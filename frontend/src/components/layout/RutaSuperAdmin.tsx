import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from '@/components/admin/AdminLayout';

/// Layout root para todas las rutas /admin/*. Exige rolGlobal === 'superadmin'.
/// Si no está autenticado → /login. Si está pero no es superadmin → /.
export function RutaSuperAdmin() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const usuario = useAuthStore((s) => s.usuario);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (usuario?.rolGlobal !== 'superadmin') return <Navigate to="/" replace />;

  return <AdminLayout />;
}
