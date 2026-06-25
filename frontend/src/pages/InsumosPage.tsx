import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowDownCircle, ArrowUpCircle, Beaker, Loader2, Package,
  Pencil, Plus, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { insumosService, type Insumo } from '@/services/insumosService';
import { extraerMensajeError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatearUsd } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { TipoInsumo } from '@/types/agro';

const TIPOS: { value: TipoInsumo; label: string; color: string }[] = [
  { value: 'semilla',      label: 'Semilla',      color: '#A8B948' },
  { value: 'fertilizante', label: 'Fertilizante', color: '#0F7702' },
  { value: 'herbicida',    label: 'Herbicida',    color: '#F2A03C' },
  { value: 'insecticida',  label: 'Insecticida',  color: '#DC2626' },
  { value: 'fungicida',    label: 'Fungicida',    color: '#3B82F6' },
  { value: 'otro',         label: 'Otro',         color: '#64748B' },
];
const colorTipo = (t: TipoInsumo) => TIPOS.find((x) => x.value === t)?.color ?? '#047C00';

const UNIDADES_SUGERIDAS = ['lt', 'kg', 'gr', 'bolsa', 'unidad', 'sem/ha', 'gr/ha'];

const schema = z.object({
  nombre: z.string().trim().min(1, 'Requerido').max(120),
  tipo: z.enum(['semilla', 'fertilizante', 'herbicida', 'insecticida', 'fungicida', 'otro']),
  unidad: z.string().trim().min(1, 'Requerido').max(20),
  stockActual: z.coerce.number().nonnegative(),
  stockMinimo: z.coerce.number().nonnegative(),
  costoUnitarioUsd: z.coerce.number().nonnegative().optional().or(z.literal('').transform(() => undefined)),
  proveedor: z.string().trim().optional(),
  nota: z.string().trim().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function InsumosPage() {
  const qc = useQueryClient();
  const rolEnCuenta = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const puedeEscribir = rolEnCuenta === 'ingeniero' || rolEnCuenta === 'operador';
  const [creating, setCreating] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [moviendo, setMoviendo] = useState<Insumo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['insumos-catalogo'],
    queryFn: () => insumosService.listar(),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => insumosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insumos-catalogo'] });
      toast.success('Insumo eliminado del catálogo');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const stockBajos = (data ?? []).filter((i) => i.stockBajo).length;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Catálogo de insumos con stock</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Insumos</h1>
        </div>
        {puedeEscribir && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nuevo insumo
          </Button>
        )}
      </header>

      {stockBajos > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {stockBajos} insumo{stockBajos === 1 ? '' : 's'} con stock bajo
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Vas a recibir alertas en la campanita por cada uno. Reponé o ajustá el stock mínimo.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin insumos en el catálogo"
          description="Cargá tus insumos con stock para registrar entradas y descontar al aplicarlos en un lote."
          action={puedeEscribir ? { label: 'Crear primer insumo', onClick: () => setCreating(true) } : undefined}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {data.map((ins, i) => (
              <InsumoCard
                key={ins.id}
                insumo={ins}
                index={i}
                puedeEscribir={puedeEscribir}
                onEditar={() => setEditando(ins)}
                onMover={() => setMoviendo(ins)}
                onEliminar={() => {
                  if (confirm(`¿Eliminar "${ins.nombre}" del catálogo? Sus aplicaciones quedan intactas.`)) {
                    eliminar.mutate(ins.id);
                  }
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <InsumoSheet
        open={creating || !!editando}
        editando={editando}
        onClose={() => {
          setCreating(false);
          setEditando(null);
        }}
      />

      <MovimientoStockSheet
        insumo={moviendo}
        onClose={() => setMoviendo(null)}
      />
    </div>
  );
}

// ============================================================
// Card de un insumo del catálogo
// ============================================================
function InsumoCard({
  insumo, index, puedeEscribir, onEditar, onMover, onEliminar,
}: {
  insumo: Insumo;
  index: number;
  puedeEscribir: boolean;
  onEditar: () => void;
  onMover: () => void;
  onEliminar: () => void;
}) {
  const color = colorTipo(insumo.tipo);
  const stock = Number(insumo.stockActual);
  const minimo = Number(insumo.stockMinimo);
  // Barra de progreso visual: relación stock / (minimo * 3), clamp 0-100
  const ratioMax = Math.max(minimo * 3, stock, 1);
  const pct = Math.min((stock / ratioMax) * 100, 100);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.025 }}
      className={cn(
        'group rounded-2xl border bg-surface p-5 flex flex-col gap-3 transition hover:shadow-lift',
        insumo.stockBajo ? 'border-amber-300' : 'border-border hover:border-primary/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}20`, color }}
          >
            <Beaker className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{insumo.nombre}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium capitalize">
              {insumo.tipo}
              {insumo.proveedor && <span> · {insumo.proveedor}</span>}
            </p>
          </div>
        </div>
        {puedeEscribir && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button onClick={onEditar} className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Editar">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={onEliminar} className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center" aria-label="Eliminar">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Stock display */}
      <div>
        <div className="flex items-end justify-between gap-3 mb-1.5">
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: insumo.stockBajo ? '#B45309' : '#0F172A' }}>
              {stock.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
              <span className="text-sm text-muted-foreground font-medium ml-1">{insumo.unidad}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mín. {minimo.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {insumo.unidad}
              {insumo.costoUnitarioUsd && (
                <span> · {formatearUsd(insumo.costoUnitarioUsd)}/{insumo.unidad}</span>
              )}
            </p>
          </div>
          {insumo.stockBajo && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 flex items-center gap-1 shrink-0">
              <AlertTriangle className="h-3 w-3" /> Bajo
            </span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: insumo.stockBajo ? '#F59E0B' : color,
            }}
          />
        </div>
      </div>

      {puedeEscribir && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={onMover}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-md border border-border bg-surface hover:bg-muted text-xs font-medium transition"
          >
            <ArrowUpCircle className="h-3.5 w-3.5 text-primary" />
            Movimiento
          </button>
        </div>
      )}
    </motion.li>
  );
}

// ============================================================
// Sheet — crear / editar insumo
// ============================================================
function InsumoSheet({
  open, editando, onClose,
}: {
  open: boolean;
  editando: Insumo | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editando;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    values: editando
      ? {
          nombre: editando.nombre,
          tipo: editando.tipo,
          unidad: editando.unidad,
          stockActual: Number(editando.stockActual),
          stockMinimo: Number(editando.stockMinimo),
          costoUnitarioUsd: editando.costoUnitarioUsd ? Number(editando.costoUnitarioUsd) : undefined,
          proveedor: editando.proveedor ?? '',
          nota: editando.nota ?? '',
        }
      : {
          nombre: '', tipo: 'herbicida', unidad: 'lt',
          stockActual: 0, stockMinimo: 0,
          costoUnitarioUsd: undefined,
          proveedor: '', nota: '',
        },
  });

  const cerrar = () => {
    reset();
    onClose();
  };

  const guardar = useMutation({
    mutationFn: (d: FormOutput) =>
      isEdit
        ? insumosService.actualizar(editando!.id, {
            ...d,
            costoUnitarioUsd: d.costoUnitarioUsd ?? null,
            proveedor: d.proveedor || null,
            nota: d.nota || null,
          })
        : insumosService.crear({
            ...d,
            costoUnitarioUsd: d.costoUnitarioUsd ?? null,
            proveedor: d.proveedor || null,
            nota: d.nota || null,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insumos-catalogo'] });
      toast.success(isEdit ? 'Insumo actualizado' : 'Insumo creado');
      cerrar();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const tipoActual = watch('tipo');

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && cerrar()}
      title={isEdit ? 'Editar insumo' : 'Nuevo insumo'}
      description={isEdit ? 'Cambiá los datos del insumo o ajustá el stock.' : 'Agregá un insumo al catálogo con su stock inicial.'}
    >
      <form onSubmit={handleSubmit((d) => guardar.mutate(d))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" placeholder="Glifosato 48%" autoFocus {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('tipo', t.value)}
                className={cn(
                  'h-9 rounded-md text-xs font-medium border transition flex items-center justify-center gap-1.5',
                  tipoActual === t.value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="unidad">Unidad</Label>
            <Input id="unidad" placeholder="lt" list="unidades-list" {...register('unidad')} />
            <datalist id="unidades-list">
              {UNIDADES_SUGERIDAS.map((u) => <option key={u} value={u} />)}
            </datalist>
            {errors.unidad && <p className="text-xs text-destructive">{errors.unidad.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="costo">Costo por unidad <span className="text-xs text-muted-foreground font-normal">(USD)</span></Label>
            <Input id="costo" type="number" step="0.01" inputMode="decimal" placeholder="4.50" {...register('costoUnitarioUsd')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock actual</Label>
            <Input id="stock" type="number" step="0.01" inputMode="decimal" {...register('stockActual')} />
            {errors.stockActual && <p className="text-xs text-destructive">{errors.stockActual.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="min">Stock mínimo</Label>
            <Input id="min" type="number" step="0.01" inputMode="decimal" {...register('stockMinimo')} />
            <p className="text-[10px] text-muted-foreground">Cuando el stock cae a este nivel, se crea una alerta.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prov">Proveedor <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
          <Input id="prov" placeholder="AgroQuímica SA" {...register('proveedor')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nota">Nota <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
          <textarea
            id="nota"
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Concentración, principio activo, observaciones..."
            {...register('nota')}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={cerrar}>Cancelar</Button>
          <Button type="submit" disabled={guardar.isPending}>
            {guardar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

// ============================================================
// Sheet — movimiento de stock (entrada / ajuste)
// ============================================================
function MovimientoStockSheet({
  insumo, onClose,
}: {
  insumo: Insumo | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [modo, setModo] = useState<'entrada' | 'ajuste'>('entrada');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [nota, setNota] = useState('');

  const cerrar = () => {
    setCantidad('');
    setNota('');
    setModo('entrada');
    onClose();
  };

  const mover = useMutation({
    mutationFn: () => {
      if (!insumo || cantidad === '' || cantidad === 0) throw new Error('Cantidad requerida');
      const delta = modo === 'entrada' ? Math.abs(Number(cantidad)) : -Math.abs(Number(cantidad));
      return insumosService.movimiento(insumo.id, { delta, nota: nota || undefined });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insumos-catalogo'] });
      toast.success(modo === 'entrada' ? 'Entrada registrada' : 'Stock ajustado');
      cerrar();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <Sheet
      open={!!insumo}
      onOpenChange={(o) => !o && cerrar()}
      title={insumo ? `Movimiento de stock` : ''}
      description={insumo ? `${insumo.nombre} · disponible: ${Number(insumo.stockActual)} ${insumo.unidad}` : ''}
    >
      {insumo && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mover.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModo('entrada')}
              className={cn(
                'h-12 rounded-lg border-2 transition flex items-center justify-center gap-2 font-medium',
                modo === 'entrada' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setModo('ajuste')}
              className={cn(
                'h-12 rounded-lg border-2 transition flex items-center justify-center gap-2 font-medium',
                modo === 'ajuste' ? 'border-destructive bg-destructive/5 text-destructive' : 'border-border text-muted-foreground hover:border-destructive/40',
              )}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Ajuste -
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cant">Cantidad ({insumo.unidad})</Label>
            <Input
              id="cant"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="10"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value === '' ? '' : Number(e.target.value))}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Resultado: {cantidad !== '' && cantidad !== 0
                ? `${(Number(insumo.stockActual) + (modo === 'entrada' ? Math.abs(Number(cantidad)) : -Math.abs(Number(cantidad)))).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${insumo.unidad}`
                : '—'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota-mov">Nota <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="nota-mov"
              placeholder={modo === 'entrada' ? 'Compra de remito 1234' : 'Faltante por inventario'}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={cerrar}>Cancelar</Button>
            <Button type="submit" disabled={mover.isPending || cantidad === '' || cantidad === 0}>
              {mover.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
