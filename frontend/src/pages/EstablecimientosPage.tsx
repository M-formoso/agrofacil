import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, MapPin, Sprout, Tractor, Loader2, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { establecimientosService } from '@/services/establecimientosService';
import { extraerMensajeError } from '@/lib/apiClient';
import { formatearHa } from '@/utils/formatters';
import type { Establecimiento, Tenencia, UnidadArrendamiento } from '@/types/agro';
import { MapPicker } from '@/components/maps/MapPicker';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    nombre: z.string().min(1, 'Requerido'),
    ubicacion: z.string().optional(),
    latitud: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitud: z.coerce.number().min(-180).max(180).optional().nullable(),
    tenencia: z.enum(['propio', 'arrendado', 'mixto']),
    arrendamientoValor: z.coerce.number().nonnegative().optional().nullable(),
    arrendamientoUnidad: z.enum(['qq_ha', 'usd_ha', 'pct_produccion']).optional().nullable(),
    superficieTotalHa: z.coerce.number().nonnegative().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.tenencia === 'arrendado' || d.tenencia === 'mixto') {
      if (d.arrendamientoValor === undefined || d.arrendamientoValor === null) {
        ctx.addIssue({ code: 'custom', message: 'Requerido', path: ['arrendamientoValor'] });
      }
      if (!d.arrendamientoUnidad) {
        ctx.addIssue({ code: 'custom', message: 'Requerido', path: ['arrendamientoUnidad'] });
      }
    }
  });

const UNIDADES_ARR: { value: UnidadArrendamiento; label: string; help: string }[] = [
  { value: 'qq_ha',         label: 'qq/ha',  help: 'Quintales por hectárea' },
  { value: 'usd_ha',        label: 'USD/ha', help: 'Dólares por hectárea' },
  { value: 'pct_produccion', label: '%',     help: '% de la producción' },
];
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

const TENENCIAS: { value: Tenencia; label: string; pill: string }[] = [
  { value: 'propio',    label: 'Propio',    pill: 'bg-primary/10 text-primary' },
  { value: 'arrendado', label: 'Arrendado', pill: 'bg-warning/10 text-warning' },
  { value: 'mixto',     label: 'Mixto',     pill: 'bg-info/10 text-info' },
];

export function EstablecimientosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Establecimiento | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['establecimientos'],
    queryFn: () => establecimientosService.listar({ limit: 100 }),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => establecimientosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['establecimientos'] });
      toast.success('Establecimiento eliminado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Tu red de campos</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Establecimientos</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo establecimiento
        </Button>
      </header>

      {isLoading ? (
        <SkeletonGrid />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title="Sin establecimientos aún"
          description="Empezá cargando tu primer campo. Después le sumás los lotes y arrancás la campaña."
          action={{ label: 'Crear primer establecimiento', onClick: () => setCreating(true) }}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {data.items.map((est, i) => (
              <motion.li
                key={est.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl bg-surface border border-border p-5 hover:border-primary/40 hover:shadow-lift transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Tractor className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{est.nombre}</h3>
                      {est.ubicacion && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {est.ubicacion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setEditing(est)}
                      className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${est.nombre}"?`)) eliminar.mutate(est.id);
                      }}
                      className="h-8 w-8 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <TenenciaPill value={est.tenencia} />
                  {est.superficieTotalHa && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium tabular-nums">
                      {formatearHa(est.superficieTotalHa)}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/8 text-primary font-medium flex items-center gap-1">
                    <Sprout className="h-3 w-3" />
                    {est._count?.lotes ?? 0} lote{est._count?.lotes === 1 ? '' : 's'}
                  </span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <EstablecimientoSheet
        open={creating || !!editing}
        editing={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function TenenciaPill({ value }: { value: Tenencia }) {
  const cfg = TENENCIAS.find((t) => t.value === value);
  if (!cfg) return null;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.pill}`}>
      {cfg.label}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-32 rounded-2xl bg-surface border border-border shimmer" />
      ))}
    </ul>
  );
}

function EstablecimientoSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Establecimiento | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          nombre: editing.nombre,
          ubicacion: editing.ubicacion ?? '',
          latitud: editing.latitud ? Number(editing.latitud) : undefined,
          longitud: editing.longitud ? Number(editing.longitud) : undefined,
          tenencia: editing.tenencia,
          arrendamientoValor: editing.arrendamientoValor ? Number(editing.arrendamientoValor) : undefined,
          arrendamientoUnidad: editing.arrendamientoUnidad ?? undefined,
          superficieTotalHa: editing.superficieTotalHa ? Number(editing.superficieTotalHa) : undefined,
        }
      : {
          nombre: '', ubicacion: '', tenencia: 'propio',
          latitud: undefined, longitud: undefined,
          arrendamientoValor: undefined, arrendamientoUnidad: undefined,
          superficieTotalHa: undefined,
        },
  });

  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const tomarUbicacionActual = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitud', Number(pos.coords.latitude.toFixed(6)));
        setValue('longitud', Number(pos.coords.longitude.toFixed(6)));
        toast.success('Coordenadas tomadas de tu ubicación');
        setObteniendoUbicacion(false);
      },
      (err) => {
        toast.error(`No se pudo obtener ubicación: ${err.message}`);
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? establecimientosService.actualizar(editing!.id, data) : establecimientosService.crear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['establecimientos'] });
      toast.success(isEdit ? 'Establecimiento actualizado' : 'Establecimiento creado');
      reset();
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  const tenencia = watch('tenencia');
  const unidadArr = watch('arrendamientoUnidad');
  const latActual = watch('latitud');
  const lonActual = watch('longitud');

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? 'Editar establecimiento' : 'Nuevo establecimiento'}
      description={isEdit ? 'Modificá los datos y guardá los cambios.' : 'Cargá un nuevo campo a tu cuenta.'}
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" placeholder="Ej: Campo Norte" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ubicacion">Ubicación</Label>
          <Input id="ubicacion" placeholder="Ej: Oliva, Córdoba" {...register('ubicacion')} />
        </div>

        <div className="space-y-2">
          <Label>Tenencia</Label>
          <div className="grid grid-cols-3 gap-2">
            {TENENCIAS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('tenencia', t.value, { shouldValidate: true })}
                className={`relative h-11 rounded-lg border text-sm font-medium transition ${
                  tenencia === t.value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-border bg-surface text-foreground hover:border-primary/40'
                }`}
              >
                {tenencia === t.value && (
                  <motion.div
                    layoutId="tenencia-active"
                    className="absolute inset-0 rounded-lg ring-2 ring-primary/40 pointer-events-none"
                  />
                )}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="superficieTotalHa">Superficie total (ha)</Label>
          <Input
            id="superficieTotalHa"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 250"
            {...register('superficieTotalHa', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
          />
          <p className="text-[11px] text-muted-foreground">
            Informativa. La superficie real surge de la suma de los lotes que cargues.
          </p>
        </div>

        {/* Solapa de arrendamiento (solo si tenencia=arrendado o mixto) */}
        {(tenencia === 'arrendado' || tenencia === 'mixto') && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-warning/5 border border-warning/30 p-4 space-y-3"
          >
            <p className="text-[11px] uppercase tracking-wider font-semibold text-warning">
              Datos del arrendamiento del campo
            </p>
            <p className="text-[11px] text-muted-foreground">
              Se aplica como costo por defecto a TODOS los lotes del establecimiento. Si un lote
              tiene un acuerdo diferente, se sobrescribe a nivel lote.
            </p>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="arrVal">Valor</Label>
                <Input
                  id="arrVal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 4"
                  {...register('arrendamientoValor', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                />
                {errors.arrendamientoValor && <p className="text-xs text-destructive">{errors.arrendamientoValor.message}</p>}
              </div>
              <div className="col-span-3 space-y-1.5">
                <Label>Unidad</Label>
                <div className="grid grid-cols-3 gap-1">
                  {UNIDADES_ARR.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setValue('arrendamientoUnidad', u.value, { shouldValidate: true })}
                      className={cn(
                        'h-10 rounded-md border text-xs font-medium transition',
                        unidadArr === u.value
                          ? 'border-warning bg-warning/15 text-warning'
                          : 'border-border bg-surface hover:border-warning/40',
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                {errors.arrendamientoUnidad && <p className="text-xs text-destructive">{errors.arrendamientoUnidad.message}</p>}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {unidadArr === 'qq_ha' && 'Costo en quintales por hectárea — se valoriza al precio del grano de cada lote.'}
              {unidadArr === 'usd_ha' && 'Costo fijo en dólares por hectárea.'}
              {unidadArr === 'pct_produccion' && 'Porcentaje del ingreso bruto del lote.'}
            </p>
          </motion.div>
        )}

        {/* Ubicación: mapa */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ubicación del campo</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={tomarUbicacionActual}
              disabled={obteniendoUbicacion}
            >
              {obteniendoUbicacion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
              Mi ubicación
            </Button>
          </div>
          <MapPicker
            lat={typeof latActual === 'number' ? latActual : null}
            lon={typeof lonActual === 'number' ? lonActual : null}
            onChange={(la, lo) => {
              setValue('latitud', Number(la.toFixed(6)));
              setValue('longitud', Number(lo.toFixed(6)));
            }}
            height={260}
          />
          <p className="text-[11px] text-muted-foreground">
            Buscá una localidad, tocá el mapa, o arrastrá el marcador. Es opcional pero da clima
            del campo y se puede usar para informes.
          </p>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-border mt-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
