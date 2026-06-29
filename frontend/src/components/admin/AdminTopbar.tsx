import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

/// Mapeo de path → breadcrumbs visibles. Se renderiza dinámicamente
/// según `location.pathname`.
function armarCrumbs(pathname: string): { label: string; to?: string }[] {
  const partes = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const out: { label: string; to?: string }[] = [{ label: 'Panel', to: '/admin' }];

  if (partes.length === 0) return out;

  const [seccion, id, sub] = partes;
  const labelSeccion: Record<string, string> = {
    cuentas: 'Cuentas',
    usuarios: 'Usuarios',
    invitaciones: 'Invitaciones',
    facturacion: 'Facturación',
    metricas: 'Métricas',
  };

  out.push({ label: labelSeccion[seccion] ?? seccion, to: `/admin/${seccion}` });
  if (id) {
    out.push({ label: id.length > 12 ? id.slice(0, 8) + '…' : id });
  }
  if (sub) out.push({ label: sub });
  return out;
}

export function AdminTopbar() {
  const location = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const crumbs = armarCrumbs(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 min-w-0 text-sm overflow-hidden">
          <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {crumbs.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              {c.to ? (
                <Link to={c.to} className="text-muted-foreground hover:text-foreground transition truncate">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium truncate">{c.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* User menu */}
        <div ref={ref} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition',
              open && 'bg-slate-100',
            )}
          >
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-semibold inline-flex items-center justify-center">
              {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">{usuario?.nombre}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Superadmin</p>
            </div>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-foreground truncate">{usuario?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); logout(); }}
                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-slate-50 transition flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
