import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bug, Camera, ClipboardEdit, MapPin, Plus, Sprout, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  monitoreosService,
  urlFotoAbsoluta,
  type Monitoreo,
  type TipoMonitoreo,
  type Urgencia,
} from '@/services/monitoreosService';
import { formatearFecha } from '@/utils/formatters';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { MonitoreoSheet } from './MonitoreoSheet';

const ICONO_TIPO: Record<TipoMonitoreo, typeof Sprout> = {
  seguimiento: Sprout,
  control_plaga: Bug,
  prescripcion: ClipboardEdit,
  general: ClipboardEdit,
};

const LABEL_TIPO: Record<TipoMonitoreo, string> = {
  seguimiento: 'Seguimiento',
  control_plaga: 'Control de plaga',
  prescripcion: 'Prescripción',
  general: 'Nota',
};

const COLOR_URGENCIA: Record<Urgencia, string> = {
  baja: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  alta: 'bg-rose-100 text-rose-700 border-rose-200',
};

interface Props {
  loteCampaniaId: string;
  /** Si es propietario, no muestra acciones de escritura. */
  readonly?: boolean;
}

export function MonitoreosPanel({ loteCampaniaId, readonly = false }: Props) {
  const qc = useQueryClient();
  const [creando, setCreando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['monitoreos', loteCampaniaId],
    queryFn: () => monitoreosService.listar(loteCampaniaId),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => monitoreosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitoreos', loteCampaniaId] });
      toast.success('Monitoreo eliminado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} monitoreo{(data?.length ?? 0) === 1 ? '' : 's'} registrado
          {(data?.length ?? 0) === 1 ? '' : 's'}
        </p>
        {!readonly && (
          <Button onClick={() => setCreando(true)}>
            <Plus className="h-4 w-4" /> Nuevo monitoreo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-24 shimmer rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            Sin monitoreos todavía. Anotá lo que ves en el lote.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence>
            {data.map((m, i) => (
              <MonitoreoCard
                key={m.id}
                monitoreo={m}
                index={i}
                onEliminar={readonly ? undefined : () => {
                  if (confirm('¿Eliminar este monitoreo?')) eliminar.mutate(m.id);
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!readonly && (
        <MonitoreoSheet
          open={creando}
          loteCampaniaId={loteCampaniaId}
          onClose={() => setCreando(false)}
        />
      )}
    </div>
  );
}

function MonitoreoCard({
  monitoreo, index, onEliminar,
}: {
  monitoreo: Monitoreo;
  index: number;
  onEliminar?: () => void;
}) {
  const Icon = ICONO_TIPO[monitoreo.tipo];
  const tieneGeo = monitoreo.latitud !== null && monitoreo.longitud !== null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.025 }}
      className="group rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
              {LABEL_TIPO[monitoreo.tipo]}
            </span>
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider font-semibold border rounded-full px-2 py-0.5',
                COLOR_URGENCIA[monitoreo.urgencia],
              )}
            >
              {monitoreo.urgencia === 'alta' && <AlertTriangle className="inline h-2.5 w-2.5 -mt-0.5 mr-1" />}
              {monitoreo.urgencia}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatearFecha(monitoreo.fecha)} · {monitoreo.autor.nombre}
            </span>
          </div>

          <p className="text-sm text-foreground mt-1.5 whitespace-pre-line">{monitoreo.observaciones}</p>

          {monitoreo.prescripcion && (
            <div className="mt-2 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">A hacer</p>
              <p className="text-sm text-foreground whitespace-pre-line">{monitoreo.prescripcion}</p>
            </div>
          )}

          {tieneGeo && (
            <a
              href={`https://www.google.com/maps?q=${monitoreo.latitud},${monitoreo.longitud}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MapPin className="h-3 w-3" />
              Ver en mapa ({Number(monitoreo.latitud).toFixed(4)}, {Number(monitoreo.longitud).toFixed(4)})
            </a>
          )}

          {monitoreo.fotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {monitoreo.fotos.map((f) => (
                <a
                  key={f.id}
                  href={urlFotoAbsoluta(f.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square rounded-md overflow-hidden border border-border bg-muted"
                >
                  <img
                    src={urlFotoAbsoluta(f.url)}
                    alt="Foto del monitoreo"
                    className="w-full h-full object-cover hover:scale-105 transition"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}

          {onEliminar && (
            <div className="mt-3 lg:opacity-0 lg:group-hover:opacity-100 transition">
              <button
                onClick={onEliminar}
                className="text-xs text-destructive hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
