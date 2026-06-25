import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Camera, CloudRain, FileText, MapPin, Sprout, Wheat,
} from 'lucide-react';

import { establecimientosService } from '@/services/establecimientosService';
import { lotesCampaniaService } from '@/services/lotesCampaniaService';
import { monitoreosService } from '@/services/monitoreosService';
import { lluviasService } from '@/services/lluviasService';
import { reportesService } from '@/services/reportesService';
import { useAuthStore } from '@/stores/authStore';
import { formatearFecha, formatearHa, formatearQqHa, formatearUsd } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const COLOR_CULTIVO: Record<string, string> = {
  soja: '#A8B948', trigo: '#E8B53D', maiz: '#F2A03C',
  'maíz': '#F2A03C', girasol: '#F4D03F', sorgo: '#B8482A',
};
const colorCultivo = (n: string) => COLOR_CULTIVO[n.toLowerCase()] ?? '#047C00';

export function InicioPropietarioPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const anioActual = new Date().getFullYear();

  const { data: establecimientos } = useQuery({
    queryKey: ['establecimientos', { limit: 100 }],
    queryFn: () => establecimientosService.listar({ limit: 100 }),
  });
  const { data: lc } = useQuery({
    queryKey: ['lotes-campania', { limit: 100 }],
    queryFn: () => lotesCampaniaService.listar({ limit: 100 }),
  });
  const { data: monitoreos } = useQuery({
    queryKey: ['monitoreos', 'todos'],
    queryFn: () => monitoreosService.listar(),
  });
  const { data: lluvias } = useQuery({
    queryKey: ['lluvias', anioActual],
    queryFn: () => lluviasService.listar(anioActual),
  });
  const { data: reportes } = useQuery({
    queryKey: ['reportes'],
    queryFn: () => reportesService.listar(),
  });

  const items = lc?.items ?? [];
  const supTotal = items.reduce((s, x) => s + Number(x.superficieSembradaHa), 0);

  // Ingreso proyectado (solo lotes con rinde y precio)
  const ingresoProyectado = items.reduce((acc, x) => {
    const rinde = Number(x.rindeRealQqHa ?? x.rindeEstimadoQqHa ?? 0);
    const sup = Number(x.superficieSembradaHa);
    const precioTn = Number(x.precioGranoUsdTn ?? 0);
    return acc + ((rinde * sup) / 10) * precioTn;
  }, 0);

  const lluviasUltimas = (lluvias ?? []).slice(-3).reverse();
  const totalMmAnio = (lluvias ?? []).reduce((s, l) => s + Number(l.mm), 0);
  const monitoreosRecientes = (monitoreos ?? []).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Saludo */}
      <header>
        <p className="text-sm text-muted-foreground">Hola</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{usuario?.nombre}</h1>
        <p className="text-sm text-muted-foreground mt-1">Esto es lo que está pasando en tu campo.</p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigStat label="Lotes sembrados" value={String(items.length)} />
        <BigStat label="Superficie" value={`${supTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} ha`} />
        <BigStat label="Ingreso proyectado" value={formatearUsd(ingresoProyectado)} accent />
        <BigStat label={`Lluvias ${anioActual}`} value={`${totalMmAnio.toFixed(0)} mm`} />
      </section>

      {/* Establecimientos */}
      {establecimientos && establecimientos.items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Mis campos</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {establecimientos.items.map((est, i) => (
              <motion.li
                key={est.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/establecimientos/${est.id}`}
                  className="flex items-center gap-3 rounded-xl bg-surface border border-border p-4 hover:border-primary/40 hover:shadow-lift transition group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{est.nombre}</p>
                    {est.ubicacion && (
                      <p className="text-xs text-muted-foreground truncate">{est.ubicacion}</p>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* Campañas activas */}
      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Lo que está sembrado</h2>
          <ul className="space-y-2">
            {items.map((x, i) => {
              const color = colorCultivo(x.cultivo?.nombre ?? '');
              const rinde = x.rindeRealQqHa ?? x.rindeEstimadoQqHa;
              return (
                <motion.li
                  key={x.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Link
                    to={`/lotes-campania/${x.id}`}
                    className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3.5 hover:border-primary/40 transition group"
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground capitalize truncate">
                        {x.cultivo?.nombre}
                        <span className="font-normal text-muted-foreground ml-2 text-sm">
                          en {x.lote?.nombre}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatearHa(x.superficieSembradaHa)}
                        {x.fechaSiembra && ` · sembrado ${formatearFecha(x.fechaSiembra)}`}
                      </p>
                    </div>
                    {rinde && (
                      <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                        {formatearQqHa(rinde)}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Grid de 2 columnas: monitoreos + lluvias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monitoreos recientes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Últimos monitoreos</h2>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </div>
          {monitoreosRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin monitoreos todavía.</p>
          ) : (
            <ul className="space-y-2">
              {monitoreosRecientes.map((m) => (
                <li key={m.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {m.tipo.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
                      m.urgencia === 'alta' && 'bg-rose-100 text-rose-700 border-rose-200',
                      m.urgencia === 'media' && 'bg-amber-100 text-amber-700 border-amber-200',
                      m.urgencia === 'baja' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                    )}>{m.urgencia}</span>
                    <span className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{m.observaciones}</p>
                  {m.loteCampania && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {m.loteCampania.lote.nombre} · {m.loteCampania.cultivo.nombre}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lluvias recientes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Últimas lluvias</h2>
            <CloudRain className="h-4 w-4 text-muted-foreground" />
          </div>
          {lluviasUltimas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin lluvias cargadas.</p>
          ) : (
            <ul className="space-y-2">
              {lluviasUltimas.map((l) => (
                <li key={l.id} className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                    <CloudRain className="h-4 w-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {Number(l.mm).toFixed(1)} mm
                    </p>
                    <p className="text-xs text-muted-foreground">{formatearFecha(l.fecha)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Reportes recibidos */}
      {reportes && reportes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Reportes compartidos</h2>
            <Link to="/reportes" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {reportes.slice(0, 3).map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{r.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.autor.nombre} · {formatearFecha(r.createdAt)}
                  </p>
                </div>
                <Link
                  to={`/r/${r.tokenPublico}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* CTA si no hay datos */}
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wheat className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            Tu ingeniero todavía no cargó datos en esta cuenta. En cuanto haya una campaña activa,
            la vas a ver acá.
          </p>
        </div>
      )}

      {/* Padding for the visual */}
      <div className="hidden" data-icon-sprout>
        <Sprout />
      </div>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl p-4 border',
      accent ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border',
    )}>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className={cn('text-xl lg:text-2xl font-bold mt-0.5 tabular-nums', accent && 'text-primary')}>
        {value}
      </p>
    </div>
  );
}
