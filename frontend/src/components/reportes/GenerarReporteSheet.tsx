import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { reportesService, urlReportePublico, type ReporteDetalle } from '@/services/reportesService';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  loteCampaniaId: string;
  /** Pre-rellena el título sugerido. */
  tituloSugerido?: string;
  onClose: () => void;
}

const OPCIONES_VALIDEZ: { value: number | null; label: string }[] = [
  { value: 30,  label: '30 días' },
  { value: 90,  label: '90 días' },
  { value: 365, label: '1 año' },
  { value: null, label: 'Sin expiración' },
];

export function GenerarReporteSheet({ open, loteCampaniaId, tituloSugerido, onClose }: Props) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState(tituloSugerido ?? '');
  const [diasValidez, setDiasValidez] = useState<number | null>(90);
  const [generado, setGenerado] = useState<ReporteDetalle | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cerrarYReset = () => {
    setGenerado(null);
    setTitulo(tituloSugerido ?? '');
    setDiasValidez(90);
    setCopiado(false);
    onClose();
  };

  const crear = useMutation({
    mutationFn: () =>
      reportesService.crear({
        tipo: 'lote_campania',
        parametros: { loteCampaniaId },
        titulo: titulo.trim() || undefined,
        diasValidez,
      }),
    onSuccess: (reporte) => {
      qc.invalidateQueries({ queryKey: ['reportes'] });
      setGenerado(reporte);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const url = generado ? urlReportePublico(generado.tokenPublico) : '';

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && cerrarYReset()}
      title={generado ? 'Reporte listo' : 'Generar reporte'}
      description={
        generado
          ? 'Compartí el link. Quien lo abra ve un resumen imprimible sin necesidad de loguearse.'
          : 'Crea un resumen compartible con costos, márgenes y monitoreos recientes.'
      }
    >
      {generado ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">Link público</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-surface border border-border text-xs font-mono break-all">
                {url}
              </code>
              <button
                type="button"
                onClick={copiar}
                className="h-9 w-9 rounded-md border border-border flex items-center justify-center hover:bg-muted transition"
                aria-label="Copiar"
              >
                {copiado ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border bg-surface hover:bg-muted text-sm font-medium transition"
            >
              Abrir en pestaña
            </a>
            <Button onClick={cerrarYReset}>Listo</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="titulo"
              placeholder={tituloSugerido ?? 'Ej: Resultado Lote 4 — soja 2026/27'}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si lo dejás vacío, se genera con cultivo y campaña.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Vigencia del link</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {OPCIONES_VALIDEZ.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setDiasValidez(o.value)}
                  className={cn(
                    'h-9 rounded-md text-xs font-medium border transition',
                    diasValidez === o.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-surface border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pasada la vigencia el link deja de funcionar. Podés revocarlo antes desde Reportes.
            </p>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
            <FileText className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
            El reporte incluye: identificación del lote, cultivo, campaña; superficie, rinde,
            precio; desglose completo de costos y márgenes; punto de equilibrio y los últimos
            10 monitoreos con fotos. Es un snapshot — cambios posteriores no se reflejan.
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrarYReset}>Cancelar</Button>
            <Button onClick={() => crear.mutate()} disabled={crear.isPending}>
              {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Generar
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
