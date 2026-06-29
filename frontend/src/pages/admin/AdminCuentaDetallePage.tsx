import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UserMinus, Eye, Building2, Sprout, CalendarRange, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { EditarCuentaSheet } from '@/components/admin/EditarCuentaSheet';
import type { RolEnCuenta } from '@/stores/authStore';

const rolLabel: Record<string, string> = {
  ingeniero: 'Ingeniero',
  propietario: 'Propietario',
  operador: 'Operador',
};

export function AdminCuentaDetallePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const iniciarImpersonacion = useAuthStore((s) => s.iniciarImpersonacion);
  const [confirmandoMembresia, setConfirmandoMembresia] = useState<string | null>(null);
  const [editandoCuenta, setEditandoCuenta] = useState(false);

  const q = useQuery({
    queryKey: ['admin', 'cuentas', id],
    queryFn: () => adminService.detalleCuenta(id),
    enabled: !!id,
  });

  const quitarMut = useMutation({
    mutationFn: ({ usuarioId }: { usuarioId: string }) => adminService.quitarMembresia(usuarioId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success('Membresía eliminada');
      setConfirmandoMembresia(null);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const impersonarMut = useMutation({
    mutationFn: () => adminService.impersonar(id),
    onSuccess: (res) => {
      iniciarImpersonacion(res.accessToken, res.refreshToken, res.usuario);
      qc.clear();
      toast.success(`Modo cuenta: ${res.usuario.impersonatingCuentaNombre}`);
      navigate('/', { replace: true });
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const cambiarRolMut = useMutation({
    mutationFn: ({ usuarioId, rol }: { usuarioId: string; rol: RolEnCuenta }) =>
      adminService.actualizarMembresia(usuarioId, id, rol),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success('Rol actualizado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="bg-white border border-destructive/30 rounded-xl p-6 text-sm text-destructive">
        {extraerMensajeError(q.error)}
      </div>
    );
  }

  const c = q.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/cuentas"
            className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-slate-200/60 text-slate-600"
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold truncate">{c.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              Creada {new Date(c.createdAt).toLocaleDateString('es-AR')} ·{' '}
              <span className={c.activo ? 'text-emerald-700' : 'text-slate-500'}>
                {c.activo ? 'Activa' : 'Inactiva'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" onClick={() => setEditandoCuenta(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button onClick={() => impersonarMut.mutate()} disabled={impersonarMut.isPending || !c.activo} className="gap-2">
            {impersonarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Ver como esta cuenta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Building2} label="Establecimientos" valor={c._count.establecimientos} />
        <StatCard icon={CalendarRange} label="Campañas" valor={c._count.campanias} />
        <StatCard icon={Sprout} label="Usuarios" valor={c.membresias.length} />
      </div>

      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Usuarios con acceso</h2>
        </header>
        {c.membresias.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sin usuarios todavía. Invitá uno desde la sección Usuarios.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Nombre</th>
                <th className="text-left px-4 py-2 font-medium">Rol</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Último login</th>
                <th className="text-center px-4 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {c.membresias.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.usuario.nombre}</p>
                    <p className="text-xs text-muted-foreground">{m.usuario.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.rol}
                      disabled={cambiarRolMut.isPending}
                      onChange={(e) => cambiarRolMut.mutate({ usuarioId: m.usuario.id, rol: e.target.value as RolEnCuenta })}
                      className="text-xs px-2 py-1 rounded border border-border bg-surface"
                    >
                      <option value="ingeniero">{rolLabel.ingeniero}</option>
                      <option value="propietario">{rolLabel.propietario}</option>
                      <option value="operador">{rolLabel.operador}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {m.usuario.ultimoLogin
                      ? new Date(m.usuario.ultimoLogin).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })
                      : 'Nunca'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                        m.usuario.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {m.usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    {confirmandoMembresia === m.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => quitarMut.mutate({ usuarioId: m.usuario.id })}
                          disabled={quitarMut.isPending}
                          className="text-xs text-destructive font-medium px-2 py-1 rounded hover:bg-destructive/10"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoMembresia(null)}
                          className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmandoMembresia(m.id)}
                        className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                      >
                        <UserMinus className="h-3 w-3" />
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <EditarCuentaSheet
        open={editandoCuenta}
        cuenta={{ id: c.id, nombre: c.nombre, emailContacto: c.emailContacto, telefono: c.telefono }}
        onClose={() => setEditandoCuenta(false)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, valor }: { icon: typeof Building2; label: string; valor: number }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-slate-900/5 flex items-center justify-center">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{valor}</p>
      </div>
    </div>
  );
}
