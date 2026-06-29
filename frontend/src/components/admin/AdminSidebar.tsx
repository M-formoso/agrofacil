import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface AdminNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const items: AdminNavItem[] = [
  { to: '/admin', label: 'Panel', icon: LayoutDashboard },
  { to: '/admin/cuentas', label: 'Cuentas', icon: Building2 },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
];

/// Sidebar del panel superadmin. Tema oscuro intencional para que visualmente
/// no se confunda con el sistema cliente (verde John Deere).
export function AdminSidebar() {
  const logout = useAuthStore((s) => s.logout);
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col p-4">
      <div className="relative flex-1 flex flex-col bg-slate-900 text-slate-100 rounded-2xl shadow-lift overflow-hidden">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 shrink-0 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold">AgroFácil</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Panel admin</p>
          </div>
        </div>

        {/* Usuario */}
        <div className="px-4 pb-4 border-b border-slate-800 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">Sesión</p>
          <p className="text-sm font-medium truncate">{usuario?.nombre ?? '—'}</p>
          <p className="text-[11px] text-slate-400 truncate">{usuario?.email}</p>
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
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 inset-y-1.5 w-1 bg-emerald-400 rounded-r-full"
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
        <div className="p-3 border-t border-slate-800 shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
