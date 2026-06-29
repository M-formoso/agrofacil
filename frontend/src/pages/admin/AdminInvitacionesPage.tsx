import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Loader2, X, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { adminService } from '@/services/adminService';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const ESTADO_STYLE: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700',
  usada: 'bg-emerald-50 text-emerald-700',
  expirada: 'bg-slate-100 text-slate-500',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  usada: 'Activada',
  expirada: 'Expirada',
};

export function AdminInvitacionesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['admin', 'invitaciones'],
    queryFn: () => adminService.listarInvitaciones(),
  });

  const cancelarMut = useMutation({
    mutationFn: (id: string) => adminService.cancelarInvitacion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'invitaciones'] });
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success('Invitación cancelada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invitaciones</h1>
        <p className="text-sm text-muted-foreground">
          Historial de los links de activación enviados por email a los usuarios.
        </p>
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : q.isError ? (
        <div className="bg-white border border-destructive/30 rounded-xl p-6 text-sm text-destructive">
          {extraerMensajeError(q.error)}
        </div>
      ) : q.data && q.data.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No hay invitaciones todavía.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Destinatario</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Cuenta</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Vence</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-2 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">{i.usuario.nombre}</p>
                    <p className="text-xs text-muted-foreground">{i.usuario.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-foreground">
                    {i.cuenta?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                    {new Date(i.expiraEn).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', ESTADO_STYLE[i.estado])}>
                      {ESTADO_LABEL[i.estado]}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    {i.estado === 'pendiente' && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/activar/${i.token}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Link copiado');
                          }}
                          title="Copiar link"
                          className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted inline-flex items-center"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelarMut.mutate(i.id)}
                          disabled={cancelarMut.isPending}
                          title="Cancelar invitación"
                          className="text-xs text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-muted inline-flex items-center"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
