import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { navItems } from '@/constants/navigation';
import { Logo } from './Logo';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col p-4">
      <div className="relative flex-1 glass-green rounded-2xl shadow-glass overflow-hidden">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <Logo variant="light" size={32} animated />
          <span className="font-bold text-lg text-white tracking-tight">AgroFácil</span>
        </div>

        {/* Cuenta info */}
        <div className="px-5 pb-4 border-b border-white/15">
          <p className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Cuenta</p>
          <p className="text-sm text-white font-medium truncate">{usuario?.nombre}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
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
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
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
        <div className="p-3 border-t border-white/15 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-white/10 flex items-center justify-between">
            <span className="text-[11px] text-white/75">Búsqueda rápida</span>
            <kbd className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
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
