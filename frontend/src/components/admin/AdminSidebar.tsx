import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, Users, Mail, Receipt, TrendingUp, LogOut, ShieldCheck } from 'lucide-react';
import { LogoLockup } from '@/components/layout/Logo';
import { useAuthStore } from '@/stores/authStore';
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

/// Mismo lenguaje visual que el sidebar del cliente (glass-green).
/// La diferencia: badge "PANEL ADMIN" para que sepas siempre dónde estás.
export function AdminSidebar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col p-4">
      <div className="relative flex-1 flex flex-col glass-green rounded-2xl shadow-glass overflow-hidden">
        {/* Brand */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <LogoLockup size={30} variant="light" animated />
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
            <ShieldCheck className="h-3 w-3 text-white" />
            <span className="text-[9px] uppercase tracking-[0.16em] font-semibold text-white">Panel admin</span>
          </div>
        </div>

        {/* Sesión */}
        <div className="px-4 pb-4 border-b border-white/15 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-white/60">Sesión</p>
          <p className="text-sm font-medium text-white truncate">{usuario?.nombre ?? '—'}</p>
          <p className="text-[11px] text-white/70 truncate">{usuario?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 inset-y-1.5 w-1 bg-white rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/15 shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/75 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
