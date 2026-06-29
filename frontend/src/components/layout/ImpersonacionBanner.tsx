import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, ArrowLeftRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/// Banner persistente arriba de toda la app cuando el superadmin está viendo
/// como otra cuenta. Click → vuelve a su sesión real (sin re-login).
export function ImpersonacionBanner() {
  const usuario = useAuthStore((s) => s.usuario);
  const finalizar = useAuthStore((s) => s.finalizarImpersonacion);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!usuario?.impersonating) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Estás viendo el sistema como <strong>{usuario.impersonatingCuentaNombre}</strong>.
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          finalizar();
          qc.clear();
          navigate('/admin', { replace: true });
        }}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition text-xs font-medium"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Volver al panel
      </button>
    </div>
  );
}
