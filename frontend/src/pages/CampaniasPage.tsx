import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Pencil, Trash2, CalendarRange, Loader2, ChevronRight, Snowflake, Sun,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { campaniasService } from '@/services/campaniasService';
import { esRespuestaOffline, extraerMensajeError } from '@/lib/apiClient';
import { formatearFecha } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { Campania } from '@/types/agro';

const anioActual = new Date().getFullYear();

const schema = z
  .object({
    anio: z.coerce.number().int().min(2000).max(2100),
    temporada: z.enum(['fina', 'gruesa']),
    nombre: z.string().min(1, 'Requerido'),
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().or(z.literal('')),
  })
  .superRefine((d, ctx) => {
    if (d.fechaFin && d.fechaFin < d.fechaInicio) {
      ctx.addIssue({ code: 'custom', message: 'Debe ser >= inicio', path: ['fechaFin'] });
    }
  });
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CampaniasPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campania | null>(null);
  const [anioFiltro, setAnioFiltro] = useState<number | 'todos'>('todos');

  const { data, isLoading } = useQuery({
    queryKey: ['campanias'],
    queryFn: () => campaniasService.listar({ limit: 200 }),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => campaniasService.eliminar(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['campanias'] });
      if (esRespuestaOffline(data)) {
        toast('Sin señal — se eliminará cuando vuelva la conexión', { duration: 5000 });
      } else {
        toast.success('Campaña eliminada');
      }
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  // Agrupar por año → temporada → campañas
  const { porAnio, anios } = useMemo(() => {
    const map = new Map<number, { fina: Campania[]; gruesa: Campania[]; sinDefinir: Campania[] }>();
    for (const c of data?.items ?? []) {
      const anio = c.anio ?? new Date(c.fechaInicio).getUTCFullYear();
      const acc = map.get(anio) ?? { fina: [], gruesa: [], sinDefinir: [] };
      if (c.temporada === 'fina') acc.fina.push(c);
      else if (c.temporada === 'gruesa') acc.gruesa.push(c);
      else acc.sinDefinir.push(c);
      map.set(anio, acc);
    }
    const anios = Array.from(map.keys()).sort((a, b) => b - a);
    return { porAnio: map, anios };
  }, [data]);

  const aniosVisibles = anioFiltro === 'todos' ? anios : anios.filter((a) => a === anioFiltro);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start sm:items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Cada ciclo agrícola es una campaña</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Campañas</h1>
        </div>
        <Button onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva campaña</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </header>

      {/* Filtro de año */}
      {anios.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setAnioFiltro('todos')}
            className={cn(
              'h-8 px-3 rounded-md text-xs font-medium border transition',
              anioFiltro === 'todos'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-surface text-muted-foreground hover:border-primary/40',
            )}
          >
            Todos
          </button>
          {anios.map((a) => (
            <button
              key={a}
              onClick={() => setAnioFiltro(a)}
              className={cn(
                'h-8 px-3 rounded-md text-xs font-medium border transition tabular-nums',
                anioFiltro === a
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-surface text-muted-foreground hover:border-primary/40',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface border border-border shimmer" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Sin campañas todavía"
          description="Elegí un año, una temporada (fina o gruesa) y nombrá tu primera campaña."
          action={{ label: 'Crear primera campaña', onClick: () => setCreating(true) }}
        />
      ) : (
        <div className="space-y-8">
          {aniosVisibles.map((anio) => {
            const grupos = porAnio.get(anio)!;
            return (
              <section key={anio} className="space-y-4">
                <h2 className="text-lg font-bold text-foreground tabular-nums">Año {anio}</h2>

                {grupos.fina.length > 0 && (
                  <BloqueTemporada
                    temporada="fina"
                    campanias={grupos.fina}
                    onEdit={setEditing}
                    onDelete={(c) => {
                      if (confirm(`¿Eliminar "${c.nombre}"?`)) eliminar.mutate(c.id);
                    }}
                  />
                )}
                {grupos.gruesa.length > 0 && (
                  <BloqueTemporada
                    temporada="gruesa"
                    campanias={grupos.gruesa}
                    onEdit={setEditing}
                    onDelete={(c) => {
                      if (confirm(`¿Eliminar "${c.nombre}"?`)) eliminar.mutate(c.id);
                    }}
                  />
                )}
                {grupos.sinDefinir.length > 0 && (
                  <BloqueTemporada
                    temporada={null}
                    campanias={grupos.sinDefinir}
                    onEdit={setEditing}
                    onDelete={(c) => {
                      if (confirm(`¿Eliminar "${c.nombre}"?`)) eliminar.mutate(c.id);
                    }}
                  />
                )}
              </section>
            );
          })}
        </div>
      )}

      <CampaniaSheet
        open={creating || !!editing}
        editing={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />
    </div>
  );
}

function BloqueTemporada({
  temporada, campanias, onEdit, onDelete,
}: {
  temporada: 'fina' | 'gruesa' | null;
  campanias: Campania[];
  onEdit: (c: Campania) => void;
  onDelete: (c: Campania) => void;
}) {
  const config = temporada === 'fina'
    ? { label: 'Fina · invierno', Icon: Snowflake, color: 'text-info', bg: 'bg-info/10', border: 'border-info/30' }
    : temporada === 'gruesa'
    ? { label: 'Gruesa · verano', Icon: Sun, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' }
    : { label: 'Sin temporada', Icon: CalendarRange, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };

  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider', config.color)}>
        <config.Icon className="h-3.5 w-3.5" />
        {config.label}
      </div>
      <ul className="space-y-2">
        <AnimatePresence mode="popLayout">
          {campanias.map((c, i) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.025 }}
            >
              <Link
                to={`/campanias/${c.id}`}
                className={cn(
                  'group block rounded-xl bg-surface border hover:shadow-lift transition relative overflow-hidden',
                  config.border,
                )}
              >
                <div className="pl-4 pr-3 py-3 flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', config.bg, config.color)}>
                    <config.Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{c.nombre}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatearFecha(c.fechaInicio)}{c.fechaFin ? ` → ${formatearFecha(c.fechaFin)}` : ''}
                      {' · '}
                      <span className="text-primary font-medium">
                        {c._count?.lotesCampania ?? 0} lote{c._count?.lotesCampania === 1 ? '' : 's'}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => { e.preventDefault(); onEdit(c); }}
                      className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); onDelete(c); }}
                      className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function CampaniaSheet({
  open, editing, onClose,
}: {
  open: boolean;
  editing: Campania | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          anio: editing.anio ?? new Date(editing.fechaInicio).getUTCFullYear(),
          temporada: editing.temporada ?? editing.tipo ?? 'gruesa',
          nombre: editing.nombre,
          fechaInicio: editing.fechaInicio.slice(0, 10),
          fechaFin: editing.fechaFin?.slice(0, 10) ?? '',
        }
      : { anio: anioActual, temporada: 'gruesa', nombre: '', fechaInicio: '', fechaFin: '' },
  });

  const anio = watch('anio');
  const temporada = watch('temporada');

  const mutation = useMutation({
    mutationFn: (data: FormOutput) => {
      const payload = {
        anio: data.anio,
        temporada: data.temporada,
        nombre: data.nombre,
        fechaInicio: data.fechaInicio,
        ...(data.fechaFin ? { fechaFin: data.fechaFin } : {}),
      };
      return isEdit ? campaniasService.actualizar(editing!.id, payload) : campaniasService.crear(payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['campanias'] });
      if (esRespuestaOffline(data)) {
        toast(
          isEdit
            ? 'Sin señal — los cambios se guardarán cuando vuelva la conexión'
            : 'Sin señal — la campaña se enviará cuando vuelva la conexión',
          { duration: 5000 },
        );
      } else {
        toast.success(isEdit ? 'Campaña actualizada' : 'Campaña creada');
      }
      reset();
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  // Sugerencia de nombre si está vacío
  const nombreSugerido = `${anio} · ${temporada === 'fina' ? 'Fina' : 'Gruesa'}`;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? 'Editar campaña' : 'Nueva campaña'}
      description="Elegí año, temporada y nombrala. Después le asignás lotes y cultivos."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {/* Paso 1: Año */}
        <div className="space-y-2">
          <Label>1) Año</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {[anioActual - 1, anioActual, anioActual + 1].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setValue('anio', a, { shouldValidate: true })}
                className={cn(
                  'h-10 rounded-md border text-sm font-medium tabular-nums transition',
                  anio === a
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-muted-foreground hover:border-primary/40',
                )}
              >
                {a}
              </button>
            ))}
            <Input
              type="number"
              min="2000"
              max="2100"
              className="col-span-2 h-10 text-sm tabular-nums"
              {...register('anio', { setValueAs: (v) => (v === '' ? anioActual : Number(v)) })}
            />
          </div>
          {errors.anio && <p className="text-xs text-destructive">{errors.anio.message}</p>}
        </div>

        {/* Paso 2: Temporada */}
        <div className="space-y-2">
          <Label>2) Temporada</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue('temporada', 'fina', { shouldValidate: true })}
              className={cn(
                'h-12 rounded-lg border flex items-center justify-center gap-2 font-medium transition',
                temporada === 'fina'
                  ? 'border-info bg-info/10 text-info'
                  : 'border-border bg-surface text-muted-foreground hover:border-info/40',
              )}
            >
              <Snowflake className="h-4 w-4" /> Fina · invierno
            </button>
            <button
              type="button"
              onClick={() => setValue('temporada', 'gruesa', { shouldValidate: true })}
              className={cn(
                'h-12 rounded-lg border flex items-center justify-center gap-2 font-medium transition',
                temporada === 'gruesa'
                  ? 'border-warning bg-warning/10 text-warning'
                  : 'border-border bg-surface text-muted-foreground hover:border-warning/40',
              )}
            >
              <Sun className="h-4 w-4" /> Gruesa · verano
            </button>
          </div>
        </div>

        {/* Paso 3: Nombre + fechas */}
        <div className="space-y-2">
          <Label htmlFor="nombre">3) Nombre</Label>
          <Input
            id="nombre"
            placeholder={nombreSugerido}
            {...register('nombre')}
          />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          <p className="text-[10px] text-muted-foreground">
            Sugerencia: <code className="bg-muted/40 px-1 rounded">{nombreSugerido}</code>. Podés
            poner algo más específico si tenés varias en el mismo año (ej: "Fina temprana").
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fi">Inicio *</Label>
            <Input id="fi" type="date" {...register('fechaInicio')} />
            {errors.fechaInicio && <p className="text-xs text-destructive">{errors.fechaInicio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ff">Fin (opcional)</Label>
            <Input id="ff" type="date" {...register('fechaFin')} />
            {errors.fechaFin && <p className="text-xs text-destructive">{errors.fechaFin.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
