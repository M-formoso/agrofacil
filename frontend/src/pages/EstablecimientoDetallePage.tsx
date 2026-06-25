import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Plus, Sprout, Tractor, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { MapaReadonly } from '@/components/maps/MapaReadonly';
import { establecimientosService } from '@/services/establecimientosService';
import { lotesService } from '@/services/lotesService';
import { extraerMensajeError } from '@/lib/apiClient';
import { formatearFecha, formatearHa, formatearQqHa } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { Lote } from '@/types/agro';

const TENENCIA_CLASE: Record<string, string> = {
  propio: 'bg-primary/10 text-primary',
  arrendado: 'bg-warning/10 text-warning',
  mixto: 'bg-info/10 text-info',
};

export function EstablecimientoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: est, isLoading } = useQuery({
    queryKey: ['establecimiento', id],
    queryFn: () => establecimientosService.obtener(id!),
    enabled: !!id,
  });

  const eliminarLote = useMutation({
    mutationFn: (loteId: string) => lotesService.eliminar(loteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['establecimiento', id] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      toast.success('Lote eliminado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  if (isLoading || !est) {
    return (
      <div className="space-y-3">
        <div className="h-32 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  const lat = est.latitud ? Number(est.latitud) : null;
  const lon = est.longitud ? Number(est.longitud) : null;
  const lotes = (est.lotes ?? []) as Lote[];
  const supTotal = lotes.reduce((s, l) => s + Number(l.superficieHa), 0);
  const conCampaniaActiva = lotes.filter(
    (l) => l.lotesCampania && l.lotesCampania.length > 0,
  ).length;

  const tieneMapa = lat !== null && lon !== null;
  const tieneArrendamiento = est.tenencia !== 'propio' && !!est.arrendamientoValor;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <Link
        to="/establecimientos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a establecimientos
      </Link>

      {/* Hero */}
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white p-6 lg:p-8 relative overflow-hidden shadow-glass">
        <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
          <Tractor className="w-32 h-32" />
        </div>
        <div className="relative">
          <p className="text-[11px] uppercase tracking-widest text-white/75 font-medium">Establecimiento</p>
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mt-1">{est.nombre}</h1>
          {est.ubicacion && (
            <p className="text-sm text-white/85 mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {est.ubicacion}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-3xl">
            <HeroStat label="Lotes" value={String(lotes.length)} />
            <HeroStat label="Superficie" value={`${supTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ha`} />
            <HeroStat label="En campaña" value={`${conCampaniaActiva}/${lotes.length}`} />
            <HeroStat label="Tenencia" value={est.tenencia} capitalize />
          </div>
        </div>
      </header>

      {/* Mapa + Arrendamiento — si están ambos van lado a lado, si solo uno ocupa todo. */}
      {(tieneMapa || tieneArrendamiento) && (
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {tieneMapa && (
            <div className={cn(tieneArrendamiento ? 'col-span-12 lg:col-span-8' : 'col-span-12')}>
              <MapaReadonly lat={lat!} lon={lon!} height={260} />
            </div>
          )}
          {tieneArrendamiento && (
            <div className={cn(
              'rounded-xl border border-warning/30 bg-warning/5 p-4 flex flex-col justify-center',
              tieneMapa ? 'col-span-12 lg:col-span-4' : 'col-span-12',
            )}>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-warning">Arrendamiento del campo</p>
              <p className="text-sm text-foreground mt-1">
                <span className="font-semibold tabular-nums">
                  {Number(est.arrendamientoValor).toLocaleString('es-AR')}
                </span>{' '}
                <span className="text-muted-foreground">{labelUnidad(est.arrendamientoUnidad)}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lotes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Lotes de este establecimiento</h2>
          <Button
            size="sm"
            onClick={() => navigate(`/lotes?establecimientoId=${est.id}&nuevo=1`)}
          >
            <Plus className="h-4 w-4" /> Nuevo lote
          </Button>
        </div>

        {lotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Sprout className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Sin lotes cargados todavía.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {lotes.map((lote, i) => (
              <LoteCard
                key={lote.id}
                lote={lote}
                index={i}
                onEliminar={() => {
                  if (confirm(`¿Eliminar "${lote.nombre}"?`)) eliminarLote.mutate(lote.id);
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function HeroStat({
  label, value, capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-white/70 font-medium">{label}</p>
      <p className={cn('text-lg lg:text-xl font-bold text-white mt-0.5 tabular-nums', capitalize && 'capitalize')}>
        {value}
      </p>
    </div>
  );
}

function LoteCard({
  lote, index, onEliminar,
}: {
  lote: Lote;
  index: number;
  onEliminar: () => void;
}) {
  const campaniaActiva = lote.lotesCampania?.[0];
  const rinde = campaniaActiva?.rindeRealQqHa ?? campaniaActiva?.rindeEstimadoQqHa;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative"
    >
      <Link
        to={`/lotes/${lote.id}`}
        className="block h-full rounded-2xl bg-surface border border-border p-4 hover:border-primary/40 hover:shadow-lift transition"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{lote.nombre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatearHa(lote.superficieHa)}{' '}
              {lote.tenencia && (
                <span className={cn(
                  'ml-1 inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded',
                  TENENCIA_CLASE[lote.tenencia] ?? 'bg-muted text-muted-foreground',
                )}>
                  {lote.tenencia}
                </span>
              )}
            </p>
          </div>
        </div>

        {campaniaActiva ? (
          <div className="mt-3 rounded-md bg-primary/5 border border-primary/15 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" /> {campaniaActiva.campania.nombre} · {campaniaActiva.campania.tipo}
                </p>
                <p className="text-sm font-medium text-foreground capitalize truncate">
                  {campaniaActiva.cultivo.nombre}
                  {campaniaActiva.fechaSiembra && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      desde {formatearFecha(campaniaActiva.fechaSiembra)}
                    </span>
                  )}
                </p>
              </div>
              {rinde && (
                <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                  {formatearQqHa(rinde)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground italic">Sin campaña activa</p>
        )}
      </Link>

      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEliminar(); }}
          className="h-7 w-7 rounded-md bg-surface hover:bg-destructive/10 hover:text-destructive flex items-center justify-center border border-border"
          aria-label="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.li>
  );
}

function labelUnidad(u: string | null) {
  if (u === 'qq_ha') return 'qq/ha';
  if (u === 'usd_ha') return 'USD/ha';
  if (u === 'pct_produccion') return '% producción';
  return '';
}
