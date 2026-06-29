import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { extraerMensajeError } from '@/lib/apiClient';
import { CrearCuentaSheet } from '@/components/admin/CrearCuentaSheet';
import { cn } from '@/lib/utils';

export function AdminCuentasPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin', 'cuentas'],
    queryFn: () => adminService.listarCuentas(),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      activo ? adminService.desactivarCuenta(id) : adminService.activarCuenta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas'] });
      toast.success('Cuenta actualizada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Organizaciones de productores / ingenieros con acceso al sistema.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva cuenta
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
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Todavía no hay cuentas. Creá la primera para empezar.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Contacto</th>
                <th className="text-right px-4 py-3 font-medium">Usuarios</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Establ.</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link to={`/admin/cuentas/${c.id}`} className="block">
                      <p className="font-medium text-foreground hover:text-primary">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Creada {new Date(c.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-foreground">{c.emailContacto ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{c.telefono ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.usuarios}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">{c.establecimientos}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                        c.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => toggleMut.mutate({ id: c.id, activo: c.activo })}
                      disabled={toggleMut.isPending}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted"
                      title={c.activo ? 'Desactivar' : 'Activar'}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CrearCuentaSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
