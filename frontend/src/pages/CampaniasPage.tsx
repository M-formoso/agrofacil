import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, CalendarRange, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { campaniasService } from '@/services/campaniasService';
import { extraerMensajeError } from '@/lib/apiClient';
import { formatearFecha } from '@/utils/formatters';
import type { Campania } from '@/types/agro';

const schema = z
  .object({
    nombre: z.string().min(1, 'Requerido'),
    fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional().or(z.literal('')),
  })
  .superRefine((d, ctx) => {
    if (d.fechaFin && d.fechaFin < d.fechaInicio) {
      ctx.addIssue({ code: 'custom', message: 'Debe ser >= inicio', path: ['fechaFin'] });
    }
  });
type FormData = z.infer<typeof schema>;

export function CampaniasPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campania | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campanias'],
    queryFn: () => campaniasService.listar({ limit: 100 }),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => campaniasService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanias'] });
      toast.success('Campaña eliminada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

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
          description="Creá tu primera campaña (ej. '2025/26 Gruesa') y empezá a asignar cultivos a tus lotes."
          action={{ label: 'Crear primera campaña', onClick: () => setCreating(true) }}
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {data.items.map((c, i) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/campanias/${c.id}`}
                  className="group block rounded-xl bg-surface border border-border hover:border-primary/40 hover:shadow-lift transition relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

                  <div className="pl-5 pr-4 py-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CalendarRange className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.nombre}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatearFecha(c.fechaInicio)}{c.fechaFin ? ` → ${formatearFecha(c.fechaFin)}` : ''}
                        {' · '}
                        <span className="text-primary font-medium">
                          {c._count?.lotesCampania ?? 0} lote{c._count?.lotesCampania === 1 ? '' : 's'} asignado{c._count?.lotesCampania === 1 ? '' : 's'}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.preventDefault(); setEditing(c); }}
                        className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`¿Eliminar "${c.nombre}"?`)) eliminar.mutate(c.id);
                        }}
                        className="h-8 w-8 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <CampaniaSheet
        open={creating || !!editing}
        editing={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
      />
    </div>
  );
}

function CampaniaSheet({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: Campania | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          nombre: editing.nombre,
          fechaInicio: editing.fechaInicio.slice(0, 10),
          fechaFin: editing.fechaFin?.slice(0, 10) ?? '',
        }
      : { nombre: '', fechaInicio: '', fechaFin: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: { nombre: string; fechaInicio: string; fechaFin?: string } = {
        nombre: data.nombre,
        fechaInicio: data.fechaInicio,
      };
      if (data.fechaFin) payload.fechaFin = data.fechaFin;
      return isEdit ? campaniasService.actualizar(editing!.id, payload) : campaniasService.crear(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanias'] });
      toast.success(isEdit ? 'Campaña actualizada' : 'Campaña creada');
      reset();
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? 'Editar campaña' : 'Nueva campaña'}
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" placeholder="Ej: 2025/26" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
          El ciclo (fina o gruesa) se elige <strong>por lote</strong> al
          asignarle un cultivo a esta campaña, porque en una misma campaña
          pueden convivir cultivos de invierno y de verano en distintos lotes.
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
