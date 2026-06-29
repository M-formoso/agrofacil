import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, ChevronDown, Sprout, Trophy } from 'lucide-react';

import {
  calculosService,
  type EnfoqueRanking,
  type FilaRanking,
  type OrdenRanking,
} from '@/services/calculosService';
import { campaniasService } from '@/services/campaniasService';
import { cultivosService } from '@/services/cultivosService';
import { establecimientosService } from '@/services/establecimientosService';
import { formatearHa, formatearQqHa, formatearUsd } from '@/utils/formatters';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const ORDENES_PRODUCTIVO: { value: OrdenRanking; label: string }[] = [
  { value: 'margen_neto_ha', label: 'Margen neto / ha' },
  { value: 'margen_neto',    label: 'Margen neto total' },
  { value: 'rinde',          label: 'Rinde' },
  { value: 'ingreso_bruto',  label: 'Ingreso bruto' },
];
const ORDENES_COSTOS: { value: OrdenRanking; label: string }[] = [
  { value: 'costo_total_ha', label: 'Costo / ha (menor mejor)' },
];

export function RankingPage() {
  const [enfoque, setEnfoque] = useState<EnfoqueRanking>('productivo');
  const [ordenarPor, setOrdenarPor] = useState<OrdenRanking>('margen_neto_ha');
  const [campaniaId, setCampaniaId] = useState<string>('');
  const [cultivoId, setCultivoId] = useState<string>('');
  const [establecimientoId, setEstablecimientoId] = useState<string>('');

  const { data: campanias } = useQuery({
    queryKey: ['campanias', { limit: 100 }],
    queryFn: () => campaniasService.listar({ limit: 100 }),
  });
  const { data: cultivos } = useQuery({
    queryKey: ['cultivos', { limit: 100 }],
    queryFn: () => cultivosService.listar({ limit: 100 }),
  });
  const { data: establecimientos } = useQuery({
    queryKey: ['establecimientos', { limit: 100 }],
    queryFn: () => establecimientosService.listar({ limit: 100 }),
  });

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking', { enfoque, ordenarPor, campaniaId, cultivoId, establecimientoId }],
    queryFn: () =>
      calculosService.ranking({
        enfoque,
        ordenarPor,
        campaniaId: campaniaId || undefined,
        cultivoId: cultivoId || undefined,
        establecimientoId: establecimientoId || undefined,
      }),
  });

  const opcionesOrden = enfoque === 'productivo' ? ORDENES_PRODUCTIVO : ORDENES_COSTOS;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Comparar lotes lado a lado</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Ranking</h1>
      </header>

      {/* Toggle enfoque */}
      <div className="rounded-xl border border-border bg-surface p-1 flex gap-1 w-fit">
        <button
          onClick={() => { setEnfoque('productivo'); setOrdenarPor('margen_neto_ha'); }}
          className={cn(
            'h-9 px-4 rounded-lg text-sm font-medium transition flex items-center gap-2',
            enfoque === 'productivo'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Sprout className="h-4 w-4" />
          Productivo
        </button>
        <button
          onClick={() => { setEnfoque('costos'); setOrdenarPor('costo_total_ha'); }}
          className={cn(
            'h-9 px-4 rounded-lg text-sm font-medium transition flex items-center gap-2',
            enfoque === 'costos'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Costos
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SelectInline label="Campaña" value={campaniaId} onChange={setCampaniaId}>
          <option value="">Todas</option>
          {campanias?.items.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </SelectInline>
        <SelectInline label="Cultivo" value={cultivoId} onChange={setCultivoId}>
          <option value="">Todos</option>
          {cultivos?.items.map((c) => (
            <option key={c.id} value={c.id} className="capitalize">{c.nombre}</option>
          ))}
        </SelectInline>
        <SelectInline label="Campo" value={establecimientoId} onChange={setEstablecimientoId}>
          <option value="">Todos</option>
          {establecimientos?.items.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </SelectInline>
        <SelectInline label="Ordenar por" value={ordenarPor} onChange={(v) => setOrdenarPor(v as OrdenRanking)}>
          {opcionesOrden.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectInline>
      </div>

      {/* Tabla / cards */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
        </div>
      ) : !ranking || ranking.filas.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Sin datos para rankear"
          description="Asigná cultivos a lotes en una campaña para ver el ranking."
        />
      ) : (
        <RankingTabla filas={ranking.filas} enfoque={enfoque} ordenarPor={ordenarPor} />
      )}
    </div>
  );
}

function RankingTabla({
  filas, enfoque, ordenarPor,
}: {
  filas: FilaRanking[];
  enfoque: EnfoqueRanking;
  ordenarPor: OrdenRanking;
}) {
  // Cabecera de la métrica principal según orden
  const valorPrincipal = useMemo(() => {
    return (f: FilaRanking): { label: string; valor: string; positivo: boolean } => {
      switch (ordenarPor) {
        case 'margen_neto':
          return { label: 'Margen neto', valor: formatearUsd(f.margenNeto), positivo: Number(f.margenNeto) >= 0 };
        case 'margen_neto_ha':
          return { label: 'Margen neto / ha', valor: formatearUsd(f.margenNetoHa), positivo: Number(f.margenNetoHa) >= 0 };
        case 'rinde':
          return { label: 'Rinde', valor: formatearQqHa(f.rinde), positivo: true };
        case 'costo_total_ha':
          return { label: 'Costo / ha', valor: formatearUsd(f.costoTotalHa), positivo: true };
        case 'ingreso_bruto':
          return { label: 'Ingreso bruto', valor: formatearUsd(f.ingresoBruto), positivo: true };
      }
    };
  }, [ordenarPor]);

  return (
    <ul className="space-y-2">
      {filas.map((f, i) => {
        const principal = valorPrincipal(f);
        return (
          <motion.li
            key={f.loteCampaniaId}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.025 }}
          >
            <Link
              to={`/lotes-campania/${f.loteCampaniaId}`}
              className="block rounded-xl border border-border bg-surface p-4 hover:border-primary/40 hover:shadow-lift transition group"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                  i === 0 ? 'bg-warning/15 text-warning' :
                  i === 1 ? 'bg-muted text-foreground' :
                  i === 2 ? 'bg-warning/5 text-warning/80' :
                  'bg-muted/60 text-muted-foreground',
                )}>
                  #{i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">
                    {f.lote} <span className="text-muted-foreground font-normal">· {f.cultivo}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.establecimiento} · {f.campania} · {formatearHa(f.superficieHa)}
                    {f.esProyeccion && ' · proyectado'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {principal.label}
                  </p>
                  <p className={cn(
                    'text-lg font-bold tabular-nums',
                    principal.positivo ? 'text-primary' : 'text-destructive',
                  )}>
                    {principal.valor}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </div>

              {/* Secundarias según enfoque */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
                {enfoque === 'productivo' ? (
                  <>
                    <Mini label="Rinde" valor={formatearQqHa(f.rinde)} />
                    <Mini label="Ingreso" valor={formatearUsd(f.ingresoBruto)} />
                    <Mini label="Costo total" valor={formatearUsd(f.costoTotal)} />
                    <Mini label="Margen neto" valor={formatearUsd(f.margenNeto)} />
                  </>
                ) : (
                  <>
                    <Mini label="Costo directo" valor={formatearUsd(f.costoDirecto)} />
                    <Mini label="Arrendamiento" valor={formatearUsd(f.costoArrendamiento)} />
                    <Mini label="Costo total" valor={formatearUsd(f.costoTotal)} />
                    <Mini label="Punto eq." valor={formatearQqHa(f.puntoEquilibrioQqHa)} />
                  </>
                )}
              </div>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function Mini({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{valor}</p>
    </div>
  );
}

function SelectInline({
  label, value, onChange, children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-2 px-1 bg-background text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
