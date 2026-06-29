import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Users, Mail, Receipt, ArrowRight, Sprout, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { facturacionService } from '@/services/facturacionService';
import { StatCard } from '@/components/admin/StatCard';

const fmtUsd = (n: number) => `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function AdminDashboardPage() {
  const cuentasQ = useQuery({ queryKey: ['admin', 'cuentas'], queryFn: () => adminService.listarCuentas() });
  const usuariosQ = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: () => adminService.listarUsuarios() });
  const facturasQ = useQuery({ queryKey: ['admin', 'facturas'], queryFn: () => facturacionService.listarFacturas() });

  const cuentasActivas = cuentasQ.data?.filter((c) => c.activo).length ?? 0;
  const usuariosActivos = usuariosQ.data?.filter((u) => u.activo).length ?? 0;
  const pendientes = usuariosQ.data?.filter((u) => u.pendienteActivacion).length ?? 0;

  const facturas = facturasQ.data ?? [];
  const cobrado = facturas.filter((f) => f.estado === 'pagada').reduce((s, f) => s + f.totalUsd, 0);
  const pendienteCobro = facturas.filter((f) => f.estado === 'pendiente').reduce((s, f) => s + f.totalUsd, 0);
  const vencido = facturas.filter((f) => f.estado === 'vencida').reduce((s, f) => s + f.totalUsd, 0);
  const ultimasFacturas = [...facturas].sort((a, b) => new Date(b.emitidaEn).getTime() - new Date(a.emitidaEn).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Cuentas activas"    valor={cuentasActivas} loading={cuentasQ.isLoading} tone="emerald" />
        <StatCard icon={Users}     label="Usuarios activos"   valor={usuariosActivos} loading={usuariosQ.isLoading} tone="sky" />
        <StatCard icon={Mail}      label="Invitaciones pend." valor={pendientes} loading={usuariosQ.isLoading} tone="amber" />
        <StatCard icon={Receipt}   label="Facturas emitidas"  valor={facturas.length} loading={facturasQ.isLoading} tone="violet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={CheckCircle2} label="Cobrado"   valor={fmtUsd(cobrado)}       loading={facturasQ.isLoading} tone="emerald" />
        <StatCard icon={Clock}        label="Pendiente" valor={fmtUsd(pendienteCobro)} loading={facturasQ.isLoading} tone="amber" />
        <StatCard icon={AlertCircle}  label="Vencido"   valor={fmtUsd(vencido)}       loading={facturasQ.isLoading} tone="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Cuentas recientes</h2>
            <Link to="/admin/cuentas" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          {cuentasQ.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : (cuentasQ.data ?? []).slice(0, 5).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Sprout className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Sin cuentas todavía.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(cuentasQ.data ?? []).slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/cuentas/${c.id}`} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <p className="font-medium text-foreground">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.usuarios} usuarios · {c.establecimientos} establecimientos</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Últimas facturas</h2>
            <Link to="/admin/facturacion" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </header>
          {facturasQ.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : ultimasFacturas.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Sin facturas todavía.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {ultimasFacturas.map((f) => (
                <li key={f.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs text-foreground">F-{String(f.numero).padStart(4, '0')}</p>
                    <p className="text-xs text-muted-foreground">{f.cuenta.nombre}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">{fmtUsd(f.totalUsd)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
