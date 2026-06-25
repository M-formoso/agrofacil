import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Search } from 'lucide-react';
import { filtrarGruposPorRol, navGroups, type NavGroup } from '@/constants/navigation';
import { LogoLockup } from './Logo';
import { AccountSwitcher } from './AccountSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { useCommandPalette } from '@/stores/commandPaletteStore';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'agrofacil-sidebar-groups';

function leerEstado(grupos: NavGroup[]): Record<string, boolean> {
  // Default basado en defaultCollapsed de cada grupo
  const base: Record<string, boolean> = {};
  for (const g of grupos) base[g.id] = !!g.defaultCollapsed;
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const guardado = JSON.parse(raw) as Record<string, boolean>;
    return { ...base, ...guardado };
  } catch {
    return base;
  }
}

export function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const openPalette = useCommandPalette((s) => s.setOpen);

  const grupos = filtrarGruposPorRol(navGroups, usuario?.rolEnCuentaActiva);
  const [colapsados, setColapsados] = useState<Record<string, boolean>>(() => leerEstado(grupos));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colapsados));
    } catch {
      // ignore quota errors
    }
  }, [colapsados]);

  const toggle = (id: string) => setColapsados((s) => ({ ...s, [id]: !s[id] }));

  return (
    <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col p-4">
      <div className="relative flex-1 flex flex-col glass-green rounded-2xl shadow-glass overflow-hidden">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 shrink-0">
          <LogoLockup size={30} variant="light" animated />
        </div>

        {/* Selector / info de cuenta */}
        <div className="px-3 pb-4 border-b border-white/15 shrink-0">
          <AccountSwitcher variant="light" />
        </div>

        {/* Nav — grupos colapsables */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
          {grupos.map((grupo) => {
            const colapsado = colapsados[grupo.id];
            return (
              <div key={grupo.id}>
                {grupo.label && (
                  <button
                    type="button"
                    onClick={() => toggle(grupo.id)}
                    className="w-full px-2 py-1.5 rounded-md flex items-center justify-between text-white/55 hover:text-white/80 transition group"
                  >
                    <span className="text-[10px] uppercase tracking-widest font-semibold">
                      {grupo.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform duration-200',
                        colapsado ? '-rotate-90' : 'rotate-0',
                      )}
                    />
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {!colapsado && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 mt-1">
                        {grupo.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
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
                                    layoutId="sidebar-active"
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer — siempre pegado abajo */}
        <div className="p-3 border-t border-white/15 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => openPalette(true)}
            className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2 text-[11px] text-white/85">
              <Search className="h-3.5 w-3.5" />
              Búsqueda rápida
            </span>
            <kbd className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
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
