import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Loader2, Mail, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { adminService, type UsuarioAdmin } from '@/services/adminService';
import { extraerMensajeError } from '@/lib/apiClient';
import { InvitarUsuarioSheet } from '@/components/admin/InvitarUsuarioSheet';
import { EditarUsuarioSheet } from '@/components/admin/EditarUsuarioSheet';
import { cn } from '@/lib/utils';

const rolLabel: Record<string, string> = {
  superadmin: 'Superadmin',
  ingeniero: 'Ingeniero',
  propietario: 'Propietario',
  operador: 'Operador',
};

export function AdminUsuariosPage() {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin', 'usuarios'],
    queryFn: () => adminService.listarUsuarios(),
  });

  const reenviarMut = useMutation({
    mutationFn: (id: string) => adminService.reenviarInvitacion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success('Invitación reenviada por email.');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      activo ? adminService.desactivarUsuario(id) : adminService.activarUsuario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success('Usuario actualizado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Ingenieros, propietarios y operadores con acceso a alguna cuenta.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar usuario
        </Button>
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
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Todavía no hay usuarios cargados.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Cuentas</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Último login</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-2 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {rolLabel[u.rolGlobal]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.cuentas.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.cuentas.map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700"
                            title={`Rol: ${rolLabel[c.rol]}`}
                          >
                            {c.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {u.ultimoLogin
                      ? new Date(u.ultimoLogin).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.pendienteActivacion ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                        Pendiente
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                          u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditando(u)}
                        title="Editar usuario"
                        className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted inline-flex items-center"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {u.pendienteActivacion ? (
                        <button
                          type="button"
                          onClick={() => reenviarMut.mutate(u.id)}
                          disabled={reenviarMut.isPending}
                          className="text-xs text-primary hover:underline px-2 py-1 inline-flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Reenviar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleMut.mutate({ id: u.id, activo: u.activo })}
                          disabled={toggleMut.isPending}
                          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvitarUsuarioSheet open={open} onClose={() => setOpen(false)} />
      <EditarUsuarioSheet open={!!editando} usuario={editando} onClose={() => setEditando(null)} />
    </div>
  );
}
