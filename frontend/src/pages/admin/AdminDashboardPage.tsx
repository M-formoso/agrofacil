import { Building2, Users, BarChart3 } from 'lucide-react';

/// Dashboard del superadmin — stub. Más adelante: KPIs (cuentas activas,
/// usuarios totales, campañas en curso, MRR si aplica).
export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel del superadmin</h1>
        <p className="text-sm text-muted-foreground">
          Vista global de la plataforma. Crear y administrar organizaciones, usuarios e invitaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Cuentas activas" valor="—" />
        <KpiCard icon={Users} label="Usuarios totales" valor="—" />
        <KpiCard icon={BarChart3} label="Campañas en curso" valor="—" />
      </div>

      <div className="bg-white border border-border rounded-xl p-6 text-sm text-muted-foreground">
        Próximamente: gráficos de altas, retención, últimas actividades.
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: typeof Building2;
  label: string;
  valor: string;
}

function KpiCard({ icon: Icon, label, valor }: KpiCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-slate-900/5 flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{valor}</p>
      </div>
    </div>
  );
}
