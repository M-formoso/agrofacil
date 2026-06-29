import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Mail } from 'lucide-react';
import { adminService } from '@/services/adminService';

export function AdminDashboardPage() {
  const cuentasQ = useQuery({ queryKey: ['admin', 'cuentas'], queryFn: () => adminService.listarCuentas() });
  const usuariosQ = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: () => adminService.listarUsuarios() });

  const cuentasActivas = cuentasQ.data?.filter((c) => c.activo).length ?? 0;
  const usuariosActivos = usuariosQ.data?.filter((u) => u.activo).length ?? 0;
  const pendientes = usuariosQ.data?.filter((u) => u.pendienteActivacion).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel del superadmin</h1>
        <p className="text-sm text-muted-foreground">
          Vista global de la plataforma. Crear y administrar organizaciones, usuarios e invitaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Cuentas activas" valor={cuentasActivas} loading={cuentasQ.isLoading} />
        <KpiCard icon={Users} label="Usuarios activos" valor={usuariosActivos} loading={usuariosQ.isLoading} />
        <KpiCard icon={Mail} label="Invitaciones pendientes" valor={pendientes} loading={usuariosQ.isLoading} />
      </div>

      <div className="bg-white border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Próximamente: gráficos de altas, retención y últimas actividades por cuenta.
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: typeof Building2;
  label: string;
  valor: number;
  loading?: boolean;
}

function KpiCard({ icon: Icon, label, valor, loading }: KpiCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-slate-900/5 flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{loading ? '…' : valor}</p>
      </div>
    </div>
  );
}
