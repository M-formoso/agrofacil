import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, UserMinus, Eye, Building2, Sprout, CalendarRange, Pencil, Wheat, DollarSign, TrendingUp, Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';
import { facturacionService } from '@/services/facturacionService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { EditarCuentaSheet } from '@/components/admin/EditarCuentaSheet';
import { SuscripcionSheet } from '@/components/admin/SuscripcionSheet';
import { GenerarFacturaSheet } from '@/components/admin/GenerarFacturaSheet';
import { StatCard } from '@/components/admin/StatCard';
import type { RolEnCuenta } from '@/stores/authStore';

const fmtNumber = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
const fmtDecimal = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
const fmtUsd = (n: number) => `USD ${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

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
  const [editandoSuscripcion, setEditandoSuscripcion] = useState(false);
  const [generandoFactura, setGenerandoFactura] = useState(false);

  const q = useQuery({
    queryKey: ['admin', 'cuentas', id],
    queryFn: () => adminService.detalleCuenta(id),
    enabled: !!id,
  });

  const analyticsQ = useQuery({
    queryKey: ['admin', 'cuentas', id, 'analytics'],
    queryFn: () => adminService.analyticsDeCuenta(id),
    enabled: !!id,
  });

  const suscripcionQ = useQuery({
    queryKey: ['admin', 'cuentas', id, 'suscripcion'],
    queryFn: () => facturacionService.obtenerSuscripcion(id),
    enabled: !!id,
  });

  const facturasQ = useQuery({
    queryKey: ['admin', 'facturas', { cuentaId: id }],
    queryFn: () => facturacionService.listarFacturas({ cuentaId: id }),
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Establecimientos" valor={c._count.establecimientos} tone="slate" />
        <StatCard icon={CalendarRange} label="Campañas" valor={c._count.campanias} tone="violet" />
        <StatCard icon={Sprout} label="Hectáreas" valor={analyticsQ.data ? fmtDecimal(analyticsQ.data.totales.superficieHa) : '—'} loading={analyticsQ.isLoading} tone="amber" />
        <StatCard icon={Wheat} label="Producción (tn)"
          valor={analyticsQ.data ? fmtNumber(analyticsQ.data.cultivos.reduce((s, c) => s + c.producidoTn, 0)) : '—'}
          loading={analyticsQ.isLoading}
          tone="emerald"
        />
      </div>

      {/* Analytics — Producción + Económica */}
      {analyticsQ.data && analyticsQ.data.totales.superficieHa > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <StatCard icon={DollarSign} label="Ingreso estimado" valor={fmtUsd(analyticsQ.data.totales.ingresoUsd)} tone="emerald" />
          <StatCard icon={Receipt} label="Costo directo" valor={fmtUsd(analyticsQ.data.totales.costoDirectoUsd)} tone="slate" />
          <StatCard icon={TrendingUp}
            label="Margen neto"
            valor={fmtUsd(analyticsQ.data.totales.margenNetoUsd)}
            hint={`${fmtUsd(analyticsQ.data.totales.margenPorHa)} / ha`}
            tone={analyticsQ.data.totales.margenNetoUsd >= 0 ? 'emerald' : 'amber'}
          />
        </div>
      )}

      {/* Producción por cultivo */}
      {analyticsQ.data && analyticsQ.data.cultivos.length > 0 && (
        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Producción por cultivo</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Cultivo</th>
                <th className="text-right px-4 py-2 font-medium">Superficie</th>
                <th className="text-right px-4 py-2 font-medium">Rinde prom.</th>
                <th className="text-right px-4 py-2 font-medium">Producción</th>
                <th className="text-right px-4 py-2 font-medium">Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {analyticsQ.data.cultivos.map((cu) => (
                <tr key={cu.nombre} className="border-t border-border">
                  <td className="px-4 py-3 font-medium capitalize">{cu.nombre}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtDecimal(cu.superficieHa)} ha</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtDecimal(cu.rindePromedioQqHa)} qq/ha</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtNumber(cu.producidoTn)} tn</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(cu.ingresoUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Top productos usados */}
      {analyticsQ.data && analyticsQ.data.topProductos.length > 0 && (
        <section className="bg-white border border-border rounded-xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Top productos usados (insumos)</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Producto</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                <th className="text-right px-4 py-2 font-medium">Costo total</th>
              </tr>
            </thead>
            <tbody>
              {analyticsQ.data.topProductos.map((p, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.producto}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell capitalize">{p.tipo}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtDecimal(p.cantidad)} {p.unidad}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(p.costoUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Facturación */}
      <section className="bg-white border border-border rounded-xl overflow-hidden">
        <header className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Facturación</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditandoSuscripcion(true)} className="gap-1.5 text-xs">
              <Pencil className="h-3.5 w-3.5" />
              {suscripcionQ.data ? 'Editar plan' : 'Configurar plan'}
            </Button>
            <Button size="sm" onClick={() => setGenerandoFactura(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Generar factura
            </Button>
          </div>
        </header>

        {suscripcionQ.data ? (
          <div className="px-4 py-3 border-b border-border bg-slate-50/50 text-sm flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="capitalize">Plan: <strong>{suscripcionQ.data.plan}</strong></span>
            <span>Precio: <strong>USD {Number(suscripcionQ.data.precioMensualUsd).toFixed(2)}/mes</strong></span>
            <span>Vence día <strong>{suscripcionQ.data.diaVencimiento}</strong></span>
            <span className={suscripcionQ.data.activa ? 'text-emerald-700' : 'text-slate-500'}>
              {suscripcionQ.data.activa ? '● Activa' : '○ Inactiva'}
            </span>
          </div>
        ) : (
          <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
            Esta cuenta no tiene plan configurado. Configuralo para poder generar facturas con los conceptos automáticos.
          </div>
        )}

        {facturasQ.data && facturasQ.data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Factura</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Período</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
                <th className="text-center px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {facturasQ.data.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">F-{String(f.numero).padStart(4, '0')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {f.periodoMes}/{f.periodoAnio}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(f.totalUsd)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                      f.estado === 'pagada' ? 'bg-emerald-50 text-emerald-700' :
                      f.estado === 'pendiente' ? 'bg-amber-50 text-amber-700' :
                      f.estado === 'vencida' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-500',
                    )}>
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Sin facturas todavía.
          </div>
        )}
      </section>

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
      <SuscripcionSheet
        open={editandoSuscripcion}
        cuentaId={c.id}
        onClose={() => setEditandoSuscripcion(false)}
      />
      <GenerarFacturaSheet
        open={generandoFactura}
        cuentaIdPreseleccionada={c.id}
        onClose={() => setGenerandoFactura(false)}
      />
    </div>
  );
}

