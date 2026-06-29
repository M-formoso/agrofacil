import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Mail, Receipt, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const items: AdminNavItem[] = [
  { to: '/admin',              label: 'Panel',        icon: LayoutDashboard },
  { to: '/admin/metricas',     label: 'Métricas',     icon: TrendingUp },
  { to: '/admin/cuentas',      label: 'Cuentas',      icon: Building2 },
  { to: '/admin/usuarios',     label: 'Usuarios',     icon: Users },
  { to: '/admin/invitaciones', label: 'Invitaciones', icon: Mail },
  { to: '/admin/facturacion',  label: 'Facturación',  icon: Receipt },
];

/// Sidebar del panel superadmin — tema oscuro distinto del cliente.
/// Logo real arriba en blanco.
export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 h-screen sticky top-0 flex-col p-4">
      <div className="relative flex-1 flex flex-col bg-slate-900 text-slate-100 rounded-2xl shadow-lift overflow-hidden">
        {/* Brand: logo + wordmark */}
        <div className="px-5 pt-5 pb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size={26} variant="light" />
            <div>
              <p className="text-base font-bold leading-none">
                <span className="text-slate-300">Agro</span>
                <span className="text-white">Facil</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400/90 mt-1 font-semibold">
                Panel admin
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 inset-y-2 w-[3px] bg-emerald-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn('h-4 w-4 transition', isActive ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            AgroFácil <span className="text-slate-600">v1.0</span>
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
            Gestión agropecuaria
          </p>
        </div>
      </div>
    </aside>
  );
}
