# Implementar Cálculos de Costos, Margen y Punto de Equilibrio

Implementa el módulo `calculos` — el **corazón del producto** AgroFácil. Es el feature que justifica el SaaS.

## Parámetros
- Sin argumentos. Genera el módulo completo.

## Contexto crítico

Las fórmulas están definidas en `AgroFacil_MVP_Especificacion.docx` sección 4 y resumidas en `CLAUDE.md`. **Cualquier desviación invalida la confianza del productor en el sistema.** Si hay duda, preguntar al usuario antes de inventar.

Todo se calcula primero a nivel `lote_campania` y luego se agrega.

## Estructura del módulo

```
backend/src/modules/calculos/
├── dto/
│   ├── resultado-lote.dto.ts
│   └── resumen-campania.dto.ts
├── calculos.controller.ts
├── calculos.service.ts
├── calculos.module.ts
├── conversiones.ts                 # utils canónicos (qq <-> tn, etc.)
└── tests/
    ├── calculos.service.spec.ts    # OBLIGATORIO — verifica fórmulas contra casos a mano
    └── conversiones.spec.ts
```

## Conversiones canónicas (`conversiones.ts`)

```typescript
import Decimal from 'decimal.js';

// 1 qq = 100 kg | 1 tn = 1000 kg = 10 qq
export const QQ_POR_TN = 10;

export const precioUsdPorQq = (precioUsdPorTn: Decimal): Decimal =>
  precioUsdPorTn.div(QQ_POR_TN);

export const produccionTn = (rindeQqHa: Decimal, superficieHa: Decimal): Decimal =>
  rindeQqHa.times(superficieHa).div(QQ_POR_TN);

export const ingresoUsd = (
  rindeQqHa: Decimal,
  superficieHa: Decimal,
  precioUsdQq: Decimal,
): Decimal => rindeQqHa.times(superficieHa).times(precioUsdQq);

// USAR SIEMPRE Decimal — no number — para evitar errores de float en dinero.
```

## Service principal

```typescript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { precioUsdPorQq, ingresoUsd } from './conversiones';

@Injectable()
export class CalculosService {
  constructor(private readonly prisma: PrismaService) {}

  async calcularResultadoLote(loteCampaniaId: string) {
    const lc = await this.prisma.loteCampania.findFirstOrThrow({
      where: { id: loteCampaniaId },
      include: { lote: true, labores: true, insumosAplicados: true, cultivo: true },
    });

    const superficieHa = new Decimal(lc.superficieSembradaHa);
    const precioUsdTn = new Decimal(lc.precioGranoUsdTn);
    const precioUsdQq = precioUsdPorQq(precioUsdTn);

    // === Rinde ===
    const rinde = new Decimal(lc.rindeRealQqHa ?? lc.rindeEstimadoQqHa);
    const esProyeccion = lc.rindeRealQqHa === null;

    // === Costos directos ===
    const costoInsumos = lc.insumosAplicados.reduce(
      (s, i) => s.plus(i.costoTotalUsd), new Decimal(0),
    );
    const costoLabores = lc.labores.reduce(
      (s, l) => s.plus(l.costoTotalUsd ?? 0), new Decimal(0),
    );
    const costoDirecto = costoInsumos.plus(costoLabores);

    // === Ingreso bruto ===
    const ingresoBruto = ingresoUsd(rinde, superficieHa, precioUsdQq);

    // === Arrendamiento ===
    const costoArrendamiento = this.calcularArrendamiento({
      tenencia: lc.lote.tenencia,
      unidad: lc.lote.arrendamientoUnidad,
      valor: lc.lote.arrendamientoValor,
      superficieHa,
      precioUsdQq,
      ingresoBruto,
    });

    // === Totales ===
    const otrosGastos = new Decimal(0); // futuro: tabla de otros_gastos
    const costoTotal = costoDirecto.plus(costoArrendamiento).plus(otrosGastos);
    const costoTotalHa = costoTotal.div(superficieHa);

    // === Márgenes ===
    const margenBruto = ingresoBruto.minus(costoDirecto);
    const margenBrutoHa = margenBruto.div(superficieHa);
    const margenNeto = margenBruto.minus(costoArrendamiento).minus(otrosGastos);
    const margenNetoHa = margenNeto.div(superficieHa);
    const margenNetoQqHa = margenNetoHa.div(precioUsdQq);

    // === Punto de equilibrio ===
    const rindeEquilibrioQqHa = costoTotalHa.div(precioUsdQq);
    const margenSeguridadQq = rinde.minus(rindeEquilibrioQqHa);

    return {
      loteCampaniaId,
      esProyeccion,
      superficieHa: superficieHa.toFixed(4),
      rinde: rinde.toFixed(2),
      ingresoBruto: ingresoBruto.toFixed(2),
      costos: {
        insumos: costoInsumos.toFixed(2),
        labores: costoLabores.toFixed(2),
        directo: costoDirecto.toFixed(2),
        arrendamiento: costoArrendamiento.toFixed(2),
        total: costoTotal.toFixed(2),
        totalHa: costoTotalHa.toFixed(2),
      },
      margenes: {
        bruto: margenBruto.toFixed(2),
        brutoHa: margenBrutoHa.toFixed(2),
        neto: margenNeto.toFixed(2),
        netoHa: margenNetoHa.toFixed(2),
        netoQqHa: margenNetoQqHa.toFixed(2),
      },
      puntoEquilibrio: {
        rindeQqHa: rindeEquilibrioQqHa.toFixed(2),
        margenSeguridadQq: margenSeguridadQq.toFixed(2),
      },
    };
  }

  async agregarPorCultivo(campaniaId: string) {
    const lcs = await this.prisma.loteCampania.findMany({
      where: { campaniaId },
      include: { cultivo: true /* + lote, labores, insumos */ },
    });

    const resultados = await Promise.all(lcs.map((lc) => this.calcularResultadoLote(lc.id)));

    // Agrupar por cultivo y AGREGAR (no promediar)
    const porCultivo = new Map<string, any>();
    for (const r of resultados) {
      const cultivoId = lcs.find((lc) => lc.id === r.loteCampaniaId)!.cultivoId;
      const acc = porCultivo.get(cultivoId) ?? {
        superficieHa: new Decimal(0),
        ingreso: new Decimal(0),
        costoTotal: new Decimal(0),
        margenNeto: new Decimal(0),
      };
      acc.superficieHa = acc.superficieHa.plus(r.superficieHa);
      acc.ingreso = acc.ingreso.plus(r.ingresoBruto);
      acc.costoTotal = acc.costoTotal.plus(r.costos.total);
      acc.margenNeto = acc.margenNeto.plus(r.margenes.neto);
      porCultivo.set(cultivoId, acc);
    }

    // Recalcular por hectárea sobre la superficie agregada (NUNCA promediar)
    return Array.from(porCultivo.entries()).map(([cultivoId, acc]) => ({
      cultivoId,
      superficieHa: acc.superficieHa.toFixed(2),
      ingreso: acc.ingreso.toFixed(2),
      costoTotal: acc.costoTotal.toFixed(2),
      margenNeto: acc.margenNeto.toFixed(2),
      margenNetoHa: acc.margenNeto.div(acc.superficieHa).toFixed(2), // <-- recalculado
    }));
  }

  private calcularArrendamiento(p: {
    tenencia: string;
    unidad: string | null;
    valor: number | null;
    superficieHa: Decimal;
    precioUsdQq: Decimal;
    ingresoBruto: Decimal;
  }): Decimal {
    if (p.tenencia !== 'arrendado' || p.valor === null) return new Decimal(0);
    const valor = new Decimal(p.valor);

    switch (p.unidad) {
      case 'qq_ha':          return valor.times(p.superficieHa).times(p.precioUsdQq);
      case 'usd_ha':         return valor.times(p.superficieHa);
      case 'pct_produccion': return p.ingresoBruto.times(valor).div(100);
      default:               return new Decimal(0);
    }
  }
}
```

## Endpoints

```typescript
@Controller('calculos')
@UseGuards(JwtAuthGuard)
export class CalculosController {
  constructor(private readonly service: CalculosService) {}

  @Get('lotes-campania/:id/resultado')
  resultadoLote(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.calcularResultadoLote(id);
  }

  @Get('campanias/:id/resumen-por-cultivo')
  resumenPorCultivo(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.agregarPorCultivo(id);
  }
}
```

## Tests obligatorios

**Cualquier cambio en este módulo debe pasar todos los tests con casos numéricos verificados a mano:**

```typescript
describe('CalculosService', () => {
  it('caso de oro: lote real del campo del fundador', async () => {
    // Datos: soja, 80 ha, rinde estimado 38 qq/ha, precio 320 USD/tn
    // Costos: insumos 8000 USD, labores 6000 USD, arrendamiento 4 qq/ha
    // Esperado (calculado a mano):
    //   ingreso  = 38 * 80 * 32 = 97280 USD
    //   c.dir    = 14000 USD
    //   c.arr    = 4 * 80 * 32 = 10240 USD
    //   c.tot    = 24240 USD => 303 USD/ha
    //   r.equil  = 303 / 32 = 9.47 qq/ha
    //   m.neto   = 73040 USD => 913 USD/ha
    expect(...).toBeCloseTo(97280, 0);
  });
});
```

## Reglas obligatorias

1. **SIEMPRE Decimal** para dinero, superficies, rindes y precios. Nunca `number` en el flujo de cálculo.
2. **Conversiones canónicas**: solo desde `conversiones.ts`. Si encontrás `precio_usd_tn / 10` en otro lado, refactorizar.
3. **Agregaciones**: sumar totales, recalcular `/ha` sobre superficie agregada. NUNCA `promedio(margenes_ha)`.
4. **Rinde**: `real ?? estimado` + flag `esProyeccion`. El frontend muestra badge según el flag.
5. **Tests con casos a mano**: cualquier fórmula nueva o cambio en una existente debe traer un test con valores verificados independientemente.
6. **Sin shortcuts**: si la fórmula del docx dice "recalcular", se recalcula. No "es lo mismo si...".

## Ejemplo de uso
```
/calculos-margen
```
