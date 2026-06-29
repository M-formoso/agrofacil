import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Sprout, CalendarRange, TrendingUp, Wheat, DollarSign, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { StatCard } from '@/components/admin/StatCard';

const fmtNumber = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
const fmtDecimal = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
const fmtUsd = (n: number) => `USD ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

export function AdminMetricasPage() {
  const q = useQuery({
    queryKey: ['admin', 'metricas'],
    queryFn: () => adminService.metricasGlobales(),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (q.isError || !q.data) return null;

  const m = q.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Métricas globales</h1>
        <p className="text-sm text-muted-foreground">Vista agregada de toda la plataforma.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Cuentas activas" valor={m.cuentas.activas} hint={`${m.cuentas.totales} totales`} tone="emerald" />
        <StatCard icon={Users}     label="Usuarios"        valor={m.usuarios.activos} hint={`${m.usuarios.pendientesActivacion} pendientes`} tone="sky" />
        <StatCard icon={Sprout}    label="Hectáreas"       valor={fmtDecimal(m.operacion.superficieHa)} hint={`${m.operacion.lotesCampania} lote-campañas`} tone="amber" />
        <StatCard icon={CalendarRange} label="Campañas en curso" valor={m.operacion.campaniasActivas} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <StatCard icon={Wheat}       label="Producción estimada"   valor={`${fmtNumber(m.operacion.produccionTn)} tn`} hint={`${fmtNumber(m.operacion.produccionKg)} kg`} tone="amber" />
        <StatCard icon={DollarSign}  label="Ingreso estimado"      valor={fmtUsd(m.operacion.ingresoEstimadoUsd)} tone="emerald" />
        <StatCard icon={TrendingUp}  label="USD por hectárea"      valor={m.operacion.superficieHa > 0 ? fmtUsd(m.operacion.ingresoEstimadoUsd / m.operacion.superficieHa) : '—'} tone="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Top 5 cuentas por superficie</h2>
          </header>
          {m.topCuentas.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin datos todavía.</div>
          ) : (
            <ul className="divide-y divide-border">
              {m.topCuentas.map((c, i) => (
                <li key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 inline-flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <Link to={`/admin/cuentas/${c.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate hover:text-primary">{c.nombre}</p>
                  </Link>
                  <p className="text-sm tabular-nums text-muted-foreground">{fmtDecimal(c.superficieHa)} ha</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Superficie por cultivo</h2>
          </header>
          {m.superficiePorCultivo.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin datos todavía.</div>
          ) : (
            <ul className="divide-y divide-border">
              {m.superficiePorCultivo.slice(0, 8).map((c) => {
                const max = m.superficiePorCultivo[0].superficieHa || 1;
                const pct = (c.superficieHa / max) * 100;
                return (
                  <li key={c.nombre} className="px-4 py-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground capitalize">{c.nombre}</span>
                      <span className="text-muted-foreground tabular-nums">{fmtDecimal(c.superficieHa)} ha</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
