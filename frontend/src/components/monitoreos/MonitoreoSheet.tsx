import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, MapPin, Sprout, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { lotesCampaniaService } from '@/services/lotesCampaniaService';
import { monitoreosService, type TipoMonitoreo, type Urgencia } from '@/services/monitoreosService';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const TIPOS: { value: TipoMonitoreo; label: string; descripcion: string }[] = [
  { value: 'seguimiento',   label: 'Seguimiento',   descripcion: 'Chequeo de rutina, estado del cultivo' },
  { value: 'control_plaga', label: 'Control de plaga', descripcion: 'Plaga, maleza o enfermedad detectada' },
  { value: 'prescripcion',  label: 'Prescripción',  descripcion: 'Requiere una labor o insumo' },
  { value: 'general',       label: 'Nota general',  descripcion: 'Observación libre' },
];

const URGENCIAS: { value: Urgencia; label: string; clase: string }[] = [
  { value: 'baja',  label: 'Baja',  clase: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'media', label: 'Media', clase: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'alta',  label: 'Alta',  clase: 'bg-rose-100 text-rose-700 border-rose-200' },
];

const schema = z.object({
  tipo: z.enum(['seguimiento', 'prescripcion', 'control_plaga', 'general']),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Requerido'),
  observaciones: z.string().trim().min(1, 'Requerido'),
  prescripcion: z.string().optional(),
  urgencia: z.enum(['baja', 'media', 'alta']),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});
type FormData = z.input<typeof schema>;

interface Props {
  open: boolean;
  /** Si no se pasa, el sheet muestra primero un picker de lote-campaña. */
  loteCampaniaId?: string;
  onClose: () => void;
}

const MAX_FOTOS = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export function MonitoreoSheet({ open, loteCampaniaId: loteFijo, onClose }: Props) {
  const qc = useQueryClient();
  const [archivos, setArchivos] = useState<File[]>([]);
  const [capturandoGps, setCapturandoGps] = useState(false);
  const [loteElegido, setLoteElegido] = useState<string | null>(loteFijo ?? null);

  // Si el sheet abre con loteFijo distinto, lo sincronizamos.
  const loteCampaniaId = loteFijo ?? loteElegido;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'seguimiento',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
      prescripcion: '',
      urgencia: 'baja',
    },
  });

  const tipoSeleccionado = watch('tipo');
  const lat = watch('latitud');
  const lng = watch('longitud');

  const cerrarYReset = () => {
    reset();
    setArchivos([]);
    if (!loteFijo) setLoteElegido(null);
    onClose();
  };

  const { data: lotesActivos } = useQuery({
    queryKey: ['lotes-campania-activos-fab'],
    queryFn: () => lotesCampaniaService.listar({ limit: 100 }),
    enabled: open && !loteFijo,
  });

  const crear = useMutation({
    mutationFn: async (data: FormData) => {
      if (!loteCampaniaId) throw new Error('Elegí un lote primero');
      const monitoreo = await monitoreosService.crear({
        loteCampaniaId,
        tipo: data.tipo,
        fecha: data.fecha,
        observaciones: data.observaciones.trim(),
        prescripcion: data.prescripcion?.trim() || undefined,
        urgencia: data.urgencia,
        latitud: data.latitud,
        longitud: data.longitud,
      });
      if (archivos.length > 0) {
        try {
          await monitoreosService.subirFotos(monitoreo.id, archivos);
        } catch (e) {
          // El monitoreo se guardó OK; sólo fallaron las fotos.
          toast.error(`Monitoreo creado, pero ${archivos.length === 1 ? 'la foto' : 'las fotos'} no subieron: ${extraerMensajeError(e)}`);
        }
      }
      return monitoreo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monitoreos', loteCampaniaId] });
      qc.invalidateQueries({ queryKey: ['monitoreos'] });
      toast.success('Monitoreo registrado');
      cerrarYReset();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      toast.error('Tu dispositivo no soporta GPS');
      return;
    }
    setCapturandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitud', Number(pos.coords.latitude.toFixed(7)));
        setValue('longitud', Number(pos.coords.longitude.toFixed(7)));
        setCapturandoGps(false);
        toast.success('Ubicación guardada');
      },
      (err) => {
        setCapturandoGps(false);
        toast.error(`No se pudo obtener ubicación: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  };

  const handleArchivos = (lista: FileList | null) => {
    if (!lista) return;
    const nuevos = Array.from(lista);
    const validos: File[] = [];
    for (const f of nuevos) {
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" pesa más de 8 MB`);
        continue;
      }
      validos.push(f);
    }
    const combinados = [...archivos, ...validos].slice(0, MAX_FOTOS);
    if (archivos.length + validos.length > MAX_FOTOS) {
      toast.error(`Máximo ${MAX_FOTOS} fotos por monitoreo`);
    }
    setArchivos(combinados);
  };

  const quitarArchivo = (i: number) => {
    setArchivos((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && cerrarYReset()}
      title="Nuevo monitoreo"
      description="Registrá lo que viste en el lote. Podés agregar fotos y ubicación."
    >
      <form onSubmit={handleSubmit((d) => crear.mutate(d))} className="space-y-4">
        {/* Picker de lote-campaña (sólo si no viene fijo desde el contexto) */}
        {!loteFijo && (
          <div className="space-y-2">
            <Label htmlFor="lote-campania">Lote</Label>
            <div className="relative">
              <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                id="lote-campania"
                value={loteElegido ?? ''}
                onChange={(e) => setLoteElegido(e.target.value || null)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                required
              >
                <option value="">Elegí un lote sembrado…</option>
                {lotesActivos?.items.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.lote?.nombre} · {lc.cultivo?.nombre} · {lc.campania?.nombre}
                  </option>
                ))}
              </select>
            </div>
            {!loteElegido && (
              <p className="text-xs text-muted-foreground">
                El monitoreo se registra sobre una campaña sembrada en un lote.
              </p>
            )}
          </div>
        )}

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {TIPOS.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => field.onChange(t.value)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition',
                      field.value === t.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t.descripcion}</p>
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {/* Fecha + Urgencia */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register('fecha')} />
            {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Urgencia</Label>
            <Controller
              control={control}
              name="urgencia"
              render={({ field }) => (
                <div className="flex gap-1">
                  {URGENCIAS.map((u) => (
                    <button
                      type="button"
                      key={u.value}
                      onClick={() => field.onChange(u.value)}
                      className={cn(
                        'flex-1 h-9 rounded-md text-xs font-medium border transition',
                        field.value === u.value ? u.clase : 'bg-surface border-border text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <Label htmlFor="obs">Observaciones</Label>
          <textarea
            id="obs"
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Qué viste, en qué sector, cómo está el cultivo..."
            {...register('observaciones')}
          />
          {errors.observaciones && (
            <p className="text-xs text-destructive">{errors.observaciones.message}</p>
          )}
        </div>

        {/* Prescripción — sólo si tipo = prescripcion o control_plaga */}
        {(tipoSeleccionado === 'prescripcion' || tipoSeleccionado === 'control_plaga') && (
          <div className="space-y-2">
            <Label htmlFor="presc">
              Qué hay que hacer{' '}
              <span className="text-xs text-muted-foreground font-normal">(prescripción)</span>
            </Label>
            <textarea
              id="presc"
              rows={3}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Producto, dosis, momento de aplicación..."
              {...register('prescripcion')}
            />
          </div>
        )}

        {/* Ubicación */}
        <div className="space-y-2">
          <Label>Ubicación del punto</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={capturarUbicacion}
              disabled={capturandoGps}
              className="shrink-0"
            >
              {capturandoGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {lat !== undefined && lng !== undefined ? 'Reusar GPS' : 'Usar GPS'}
            </Button>
            {lat !== undefined && lng !== undefined && (
              <div className="flex-1 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 font-mono truncate">
                {lat.toFixed(5)}, {lng.toFixed(5)}
                <button
                  type="button"
                  onClick={() => {
                    setValue('latitud', undefined);
                    setValue('longitud', undefined);
                  }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  aria-label="Quitar GPS"
                >
                  <X className="h-3 w-3 inline" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fotos */}
        <div className="space-y-2">
          <Label>
            Fotos{' '}
            <span className="text-xs text-muted-foreground font-normal">
              (opcional, hasta {MAX_FOTOS})
            </span>
          </Label>
          <label
            htmlFor="fotos-input"
            className="flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition"
          >
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sacar foto o elegir desde el celular</span>
            <input
              id="fotos-input"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleArchivos(e.target.files)}
            />
          </label>

          {archivos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {archivos.map((a, i) => (
                <li key={`${a.name}-${i}`} className="relative group">
                  <img
                    src={URL.createObjectURL(a)}
                    alt={a.name}
                    className="w-full h-20 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => quitarArchivo(i)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 sticky bottom-0 bg-surface">
          <Button type="button" variant="outline" onClick={cerrarYReset}>Cancelar</Button>
          <Button type="submit" disabled={crear.isPending || !loteCampaniaId}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar monitoreo
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
