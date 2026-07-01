import { useState } from 'react';
import { Loader2, RefreshCw, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface Props {
  open: boolean;
  onClose: () => void;
}

const formatearFecha = (ms: number) => {
  const d = new Date(ms);
  return d.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/// Vista de detalle de la cola offline. El usuario puede:
///  - Reintentar una operación puntual (por si el server está inestable).
///  - Descartar una que sabe que no va a poder subir (ej. lote que ya no existe).
///  - Copiar el JSON al portapapeles para pasárselo al soporte por WhatsApp.
export function PendientesSheet({ open, onClose }: Props) {
  const { pendientes, reintentarUno, descartarUno, online } = useOfflineSync();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [operando, setOperando] = useState<string | null>(null);

  const reintentar = async (id: string) => {
    setOperando(id);
    const r = await reintentarUno(id);
    setOperando(null);
    if (r === 'ok') toast.success('Enviado al servidor');
    else if (r === 'sin-red') toast.error('Sin conexión — esperá a tener señal');
    else toast.error('No se pudo enviar — probá más tarde o descartalo');
  };

  const descartar = (id: string, label: string) => {
    if (!confirm(`Descartar "${label}"? Esta operación no se va a subir al servidor.`)) return;
    descartarUno(id);
    toast.success('Descartado');
  };

  const copiarJson = async (op: { url: string; method: string; body?: unknown }) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ method: op.method, url: op.url, body: op.body }, null, 2));
      toast.success('JSON copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Datos pendientes de subir"
      description="Cargas hechas en el campo que todavía no llegaron al servidor. Se suben solas cuando hay señal."
    >
      {pendientes.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nada pendiente ✓
        </div>
      ) : (
        <div className="space-y-2">
          {pendientes.map((op) => {
            const abierto = expandido === op.id;
            return (
              <div key={op.id} className="border border-border rounded-lg bg-surface overflow-hidden">
                <div className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{op.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cargado {formatearFecha(op.createdAt)}
                      {op.intentos > 0 && (
                        <span className={op.intentos >= 3 ? 'text-destructive ml-2' : 'ml-2'}>
                          · {op.intentos} intento{op.intentos === 1 ? '' : 's'} fallido{op.intentos === 1 ? '' : 's'}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandido(abierto ? null : op.id)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                    title={abierto ? 'Ocultar detalle' : 'Ver detalle'}
                  >
                    {abierto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {abierto && (
                  <div className="border-t border-border bg-muted/30 px-3 py-2 space-y-2">
                    <div className="text-[11px] font-mono text-muted-foreground">
                      <span className="text-primary font-semibold">{op.method}</span> {op.url}
                    </div>
                    <pre className="text-[10px] font-mono text-foreground bg-white border border-border rounded p-2 max-h-40 overflow-auto">
{JSON.stringify(op.body, null, 2)}
                    </pre>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reintentar(op.id)}
                        disabled={!online || operando === op.id}
                        className="gap-1.5 h-8 text-xs"
                      >
                        {operando === op.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Reintentar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copiarJson(op)}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => descartar(op.id, op.label)}
                        className="gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10 ml-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
