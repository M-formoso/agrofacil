# Implementar Carga por Voz/Foto

Implementa el feature diferencial de AgroFácil: registrar labores e insumos dictando una nota de voz o sacando una foto del anotador. El usuario **siempre confirma antes de guardar**.

## Parámetros
- **$ARGUMENTS**: Tipo de carga (`labor`, `insumo`, `cosecha`) — opcional, si se omite el modelo lo detecta del audio/foto.

## Flujo end-to-end

```
[Usuario] -- audio/foto -->
[Frontend] -- POST /ia-carga --> [Backend]
                                    |
                                    |-- Audio -> transcripción (Whisper/Claude)
                                    |-- Foto  -> visión Claude
                                    |
                                    v
                              prompt + contexto cuenta
                                    |
                                    v
                              Claude responde SOLO JSON
                                    |
                                    v
                              parser try/catch
                                    |
                                    v
[Frontend] <-- borrador editable --
[Usuario] revisa y confirma
[Frontend] -- POST /labores o /insumos-aplicados --> [Backend] -- persiste
```

## Backend: módulo `ia-carga`

### Estructura
```
backend/src/modules/ia-carga/
├── dto/
│   ├── carga-voz.dto.ts
│   └── borrador-response.dto.ts
├── ia-carga.controller.ts
├── ia-carga.service.ts
├── ia-carga.module.ts
├── prompts/
│   └── extraer-registro.ts
└── tests/
    ├── ia-carga.service.spec.ts
    └── fixtures/
        ├── audio-pulverizacion.txt
        └── foto-anotador.txt
```

### Service principal

```typescript
// src/modules/ia-carga/ia-carga.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../prisma/prisma.service';
import { promptExtraerRegistro } from './prompts/extraer-registro';

const ESQUEMA_RESPUESTA = z.object({
  tipo: z.enum(['labor', 'insumo', 'cosecha']),
  lote: z.string().nullable(),
  fecha: z.string().nullable(),
  detalle: z.record(z.unknown()),
  confianza: z.number().min(0).max(1),
  campos_faltantes: z.array(z.string()),
});

@Injectable()
export class IaCargaService {
  private readonly client: Anthropic;

  constructor(private readonly prisma: PrismaService) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async procesarTexto(texto: string, cuentaId: string) {
    // 1. Cargar contexto de la cuenta (lotes, cultivos, insumos)
    const contexto = await this.cargarContexto(cuentaId);

    // 2. Llamar a Claude pidiendo SOLO JSON
    const res = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: promptExtraerRegistro(contexto),
      messages: [{ role: 'user', content: texto }],
    });

    const raw = res.content[0].type === 'text' ? res.content[0].text : '';

    // 3. Parsear con try/catch
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadRequestException('No se pudo parsear el registro. Intentá de nuevo o cargá manualmente.');
    }

    const validado = ESQUEMA_RESPUESTA.safeParse(parsed);
    if (!validado.success) {
      throw new BadRequestException('Respuesta inválida del modelo. Intentá de nuevo.');
    }

    // 4. Resolver referencias (matchear "Lote 4" contra los lotes reales de la cuenta)
    const borrador = await this.resolverReferencias(validado.data, contexto);

    return borrador;  // <-- el frontend lo muestra editable, NO persiste
  }

  async procesarAudio(audioBase64: string, cuentaId: string) {
    // Whisper o equivalente -> texto
    const texto = await this.transcribirAudio(audioBase64);
    return this.procesarTexto(texto, cuentaId);
  }

  async procesarFoto(fotoBase64: string, cuentaId: string) {
    const contexto = await this.cargarContexto(cuentaId);

    const res = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: promptExtraerRegistro(contexto),
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fotoBase64 } },
          { type: 'text', text: 'Leé este anotador del campo y extraé el registro.' },
        ],
      }],
    });

    // resto idéntico a procesarTexto
  }

  private async cargarContexto(cuentaId: string) {
    const [lotes, cultivos] = await Promise.all([
      this.prisma.lote.findMany({ where: { cuentaId, activo: true }, select: { id: true, nombre: true } }),
      this.prisma.cultivo.findMany({ select: { id: true, nombre: true } }),
    ]);
    return { lotes, cultivos };
  }
}
```

### Prompt

```typescript
// src/modules/ia-carga/prompts/extraer-registro.ts
export const promptExtraerRegistro = (ctx: { lotes: any[]; cultivos: any[] }) => `
Sos un asistente que extrae registros de campo de productores agropecuarios argentinos.
El usuario te va a dictar (audio transcripto) o mandar foto de un anotador con datos de una labor, insumo o cosecha.

RESPONDÉ ÚNICAMENTE CON UN JSON VÁLIDO. Sin markdown, sin texto adicional, sin "aquí tenés:".

Esquema requerido:
{
  "tipo": "labor" | "insumo" | "cosecha",
  "lote": "nombre del lote como lo dijo el usuario, o null",
  "fecha": "YYYY-MM-DD" o null (default hoy si no se mencionó),
  "detalle": {
    // para labor:
    "tipo_labor": "siembra" | "pulverizacion" | "fertilizacion" | "cosecha" | "otra",
    "producto": "nombre comercial del producto o null",
    "cantidad": número o null,
    "unidad": "lt" | "kg" | "bolsa" | "sem/ha" | null,
    "superficie_ha": número o null,
    "costo_total_usd": número o null,
    "forma_pago": "contado" | "canje" | "financiado" | null
  },
  "confianza": número entre 0 y 1 (0.9 = muy seguro, 0.5 = ambiguo),
  "campos_faltantes": [lista de campos que no se pudieron extraer]
}

Contexto de la cuenta:
- Lotes existentes: ${ctx.lotes.map(l => l.nombre).join(', ')}
- Cultivos: ${ctx.cultivos.map(c => c.nombre).join(', ')}

Reglas:
- Si el usuario dice "Lote 4" → matchea contra los lotes existentes (case-insensitive, ignorando "Lote ").
- Unidades: convertí "litros" → "lt", "kilos" → "kg", "bolsas" → "bolsa".
- Si no se mencionó costo o forma de pago, dejá null — no inventes.
- La fecha default es HOY si el usuario dice "hoy", "recién" o no menciona fecha.
- Si dice "ayer" → fecha de ayer. Si dice "el martes" → asumir el martes más reciente.
`;
```

## Frontend: componente `<CargaVoz />`

```tsx
// src/components/carga/CargaVoz.tsx
import { useState } from 'react';
import { Mic, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { iaCargaService } from '@/services/iaCargaService';
import { BorradorEditable } from './BorradorEditable';
import type { BorradorRegistro } from '@/types/iaCarga';

export function CargaVoz({ loteCampaniaId }: { loteCampaniaId: string }) {
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [borrador, setBorrador] = useState<BorradorRegistro | null>(null);
  const { toast } = useToast();

  const grabarAudio = async () => {
    // MediaRecorder API ...
    // al detener -> base64 -> procesar
  };

  const procesarAudio = async (audioBase64: string) => {
    setProcesando(true);
    try {
      const res = await iaCargaService.procesarAudio(audioBase64);
      setBorrador(res);
      if (res.confianza < 0.6) {
        toast({ title: 'Revisá con cuidado', description: 'La confianza del modelo es baja' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'No se pudo procesar', description: (err as Error).message });
    } finally {
      setProcesando(false);
    }
  };

  if (borrador) {
    return (
      <BorradorEditable
        borrador={borrador}
        onConfirmar={async (data) => { /* POST /labores o /insumos */ }}
        onCancelar={() => setBorrador(null)}
      />
    );
  }

  return (
    <div className="flex gap-4 justify-center">
      <Button size="lg" onClick={grabarAudio} disabled={procesando}>
        {procesando ? <Loader2 className="animate-spin" /> : <Mic />}
        {grabando ? 'Detener' : 'Grabar nota'}
      </Button>
      <Button size="lg" variant="outline">
        <Camera /> Foto anotador
      </Button>
    </div>
  );
}
```

## Reglas obligatorias

1. **NUNCA persistir automático**. Siempre mostrar borrador editable y pedir confirmación.
2. **try/catch** alrededor del `JSON.parse`. Si falla, devolver al usuario para reintentar manualmente.
3. **`confianza < 0.6`** → mostrar banner de advertencia.
4. **`campos_faltantes`** no vacío → resaltar esos campos en el form.
5. **Sin texto markdown** en la respuesta del modelo — instruir explícitamente que devuelva solo JSON.
6. **Contexto de la cuenta en el prompt**: lotes existentes (para matchear), cultivos, catálogo de insumos. Sin contexto, las extracciones son menos precisas.
7. **Logs de auditoría**: cada borrador generado se loggea con texto original + JSON resultado + confianza, para mejorar el prompt iterativamente.

## Ejemplo de uso
```
/carga-por-voz
/carga-por-voz labor
```
