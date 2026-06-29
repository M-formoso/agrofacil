import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/// Topbar minimalista — solo breadcrumbs. La sesión y el logout viven en el sidebar
/// para mantener el mismo patrón que el panel del cliente.
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
  const crumbs = armarCrumbs(location.pathname);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4">
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
      </div>
    </header>
  );
}
