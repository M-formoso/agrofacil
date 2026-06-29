import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Loader2, Mail, Pencil, ShieldOff, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { miembrosService, type MiembroCuenta } from '@/services/miembrosService';
import { extraerMensajeError } from '@/lib/apiClient';
import { MiembroSheet } from '@/components/equipo/MiembroSheet';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const rolLabel: Record<string, string> = {
  ingeniero: 'Ingeniero',
  propietario: 'Propietario',
  operador: 'Operador',
};

export function EquipoPage() {
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<MiembroCuenta | null>(null);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState<string | null>(null);
  const usuario = useAuthStore((s) => s.usuario);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['miembros'],
    queryFn: () => miembrosService.listar(),
    enabled: usuario?.rolEnCuentaActiva === 'ingeniero',
  });

  const reenviarMut = useMutation({
    mutationFn: (id: string) => miembrosService.reenviarInvitacion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['miembros'] });
      toast.success('Invitación reenviada por email');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const quitarMut = useMutation({
    mutationFn: (id: string) => miembrosService.quitar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['miembros'] });
      toast.success('Miembro removido de la cuenta');
      setConfirmandoQuitar(null);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  if (usuario?.rolEnCuentaActiva !== 'ingeniero') {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={ShieldOff}
          title="Sin acceso"
          description="Sólo el ingeniero de la cuenta puede gestionar el equipo."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Usuarios con acceso a esta cuenta</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Equipo</h1>
        </div>
        <Button onClick={() => { setEditando(null); setOpen(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar miembro
        </Button>
      </div>

      <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80 leading-relaxed">
        Al invitar, le llega un email con un link para activar la cuenta y elegir contraseña.
        Podés elegir un rol y qué módulos puede ver en su sidebar.
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
        <EmptyState
          icon={UserPlus}
          title="Sin miembros todavía"
          description="Invitá a un ingeniero, propietario u operador para que tenga acceso a esta cuenta."
          action={{ label: 'Invitar primer miembro', onClick: () => { setEditando(null); setOpen(true); } }}
        />
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Módulos</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-2 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((m) => (
                <tr key={m.membresiaId} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{m.nombre}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                    <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {rolLabel[m.rol]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs">
                    {m.modulosPermitidos.length === 0 ? (
                      <span className="text-muted-foreground">Default del rol</span>
                    ) : (
                      <span className="text-foreground">{m.modulosPermitidos.length} módulos</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.pendienteActivacion ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                        Pendiente
                      </span>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                        m.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}>
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-right">
                    {confirmandoQuitar === m.usuarioId ? (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => quitarMut.mutate(m.usuarioId)}
                          disabled={quitarMut.isPending}
                          className="text-xs text-destructive font-medium px-2 py-1 rounded hover:bg-destructive/10"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoQuitar(null)}
                          className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => { setEditando(m); setOpen(true); }}
                          title="Editar"
                          className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted inline-flex items-center"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {m.pendienteActivacion && (
                          <button
                            type="button"
                            onClick={() => reenviarMut.mutate(m.usuarioId)}
                            disabled={reenviarMut.isPending}
                            title="Reenviar invitación"
                            className="text-xs text-primary hover:underline p-1.5 inline-flex items-center"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {m.usuarioId !== usuario?.id && (
                          <button
                            type="button"
                            onClick={() => setConfirmandoQuitar(m.usuarioId)}
                            title="Quitar de la cuenta"
                            className="text-xs text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 inline-flex items-center"
                          >
                            <ShieldX className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MiembroSheet
        open={open}
        miembro={editando}
        onClose={() => { setOpen(false); setEditando(null); }}
      />
    </div>
  );
}
