import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ChevronRight, History, Sprout, Tractor, Wheat,
} from 'lucide-react';

import { lotesService } from '@/services/lotesService';
import { formatearFecha, formatearHa, formatearQqHa, formatearUsd } from '@/utils/formatters';
import { MonitoreosPanel } from '@/components/monitoreos/MonitoreosPanel';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function LoteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const rolEnCuenta = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);

  const { data: lote, isLoading } = useQuery({
    queryKey: ['lote', id],
    queryFn: () => lotesService.obtener(id!),
    enabled: !!id,
  });

  if (isLoading || !lote) {
    return (
      <div className="space-y-3">
        <div className="h-32 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  const historial = lote.lotesCampania ?? [];
  const activa = historial[0] ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to={lote.establecimiento ? `/establecimientos/${lote.establecimiento.id}` : '/lotes'}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {lote.establecimiento ? `Volver a ${lote.establecimiento.nombre}` : 'Volver a lotes'}
      </Link>

      {/* Hero */}
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white p-6 lg:p-8 relative overflow-hidden shadow-glass">
        <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
          <Sprout className="w-32 h-32" />
        </div>
        <div className="relative">
          {lote.establecimiento && (
            <p className="text-[11px] uppercase tracking-widest text-white/75 font-medium flex items-center gap-1">
              <Tractor className="h-3 w-3" /> {lote.establecimiento.nombre}
            </p>
          )}
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight mt-1">{lote.nombre}</h1>
          <p className="text-sm text-white/85 mt-2 flex items-center gap-2 flex-wrap">
            <span className="tabular-nums">{formatearHa(lote.superficieHa)}</span>
            {lote.tenencia && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/15">
                {lote.tenencia}
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Arrendamiento */}
      {lote.tenencia === 'arrendado' && lote.arrendamientoValor && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-warning">Arrendamiento</p>
          <p className="text-sm text-foreground mt-1">
            <span className="font-semibold tabular-nums">
              {Number(lote.arrendamientoValor).toLocaleString('es-AR')}
            </span>{' '}
            <span className="text-muted-foreground">{labelUnidad(lote.arrendamientoUnidad)}</span>
          </p>
        </div>
      )}

      {/* Campaña activa — destacada arriba */}
      {activa && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Wheat className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Campaña activa</h2>
          </div>
          <Link
            to={`/lotes-campania/${activa.id}`}
            className="block rounded-2xl bg-surface border border-primary/30 p-5 hover:border-primary hover:shadow-lift transition group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                  {activa.campania.nombre} · {activa.campania.tipo}
                </p>
                <p className="text-xl font-bold text-foreground capitalize mt-0.5">
                  {activa.cultivo.nombre}
                  {activa.variedad && (
                    <span className="text-sm font-medium text-muted-foreground ml-2">
                      {activa.variedad.nombre}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activa.fechaSiembra ? `Sembrado ${formatearFecha(activa.fechaSiembra)}` : 'Sin fecha de siembra'}{' '}
                  · {formatearHa(activa.superficieSembradaHa)}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activa.rindeRealQqHa ?? activa.rindeEstimadoQqHa) && (
                <StatInline
                  label={activa.rindeRealQqHa ? 'Rinde real' : 'Rinde estimado'}
                  value={formatearQqHa(activa.rindeRealQqHa ?? activa.rindeEstimadoQqHa!)}
                />
              )}
              {activa.precioGranoUsdTn && (
                <StatInline
                  label="Precio"
                  value={`${formatearUsd(activa.precioGranoUsdTn)}/tn`}
                />
              )}
              {activa.fechaCosecha && (
                <StatInline
                  label="Cosechado"
                  value={formatearFecha(activa.fechaCosecha)}
                />
              )}
            </div>
          </Link>
        </section>
      )}

      {/* Historial */}
      {historial.length > 1 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Historial ({historial.length - 1})
            </h2>
          </div>
          <ul className="space-y-2">
            {historial.slice(1).map((lc, i) => (
              <motion.li
                key={lc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  to={`/lotes-campania/${lc.id}`}
                  className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3 hover:border-primary/40 transition group"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Wheat className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground capitalize truncate">
                      {lc.cultivo.nombre}
                      {lc.variedad && <span className="font-normal text-muted-foreground ml-1">· {lc.variedad.nombre}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lc.campania.nombre} · {lc.campania.tipo} · {formatearHa(lc.superficieSembradaHa)}
                      {lc.rindeRealQqHa && ` · ${formatearQqHa(lc.rindeRealQqHa)} real`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* Si no hay campañas */}
      {historial.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wheat className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Este lote todavía no se sembró en ninguna campaña.</p>
          <Link
            to="/campanias"
            className="inline-flex items-center justify-center gap-2 mt-4 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
          >
            Ir a campañas
          </Link>
        </div>
      )}

      {/* Monitoreos del lote — buscamos los de la campaña activa */}
      {activa && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Monitoreos de la campaña activa
            </h2>
          </div>
          <MonitoreosPanel loteCampaniaId={activa.id} readonly={rolEnCuenta === 'propietario'} />
        </section>
      )}
    </div>
  );
}

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-bold text-foreground tabular-nums')}>{value}</p>
    </div>
  );
}

function labelUnidad(u: string | null) {
  if (u === 'qq_ha') return 'qq/ha';
  if (u === 'usd_ha') return 'USD/ha';
  if (u === 'pct_produccion') return '% producción';
  return '';
}
