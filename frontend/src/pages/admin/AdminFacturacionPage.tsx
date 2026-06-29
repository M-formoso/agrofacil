import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Receipt, Mail, Ban, CheckCircle2, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { facturacionService, type EstadoFactura } from '@/services/facturacionService';
import { extraerMensajeError } from '@/lib/apiClient';
import { GenerarFacturaSheet } from '@/components/admin/GenerarFacturaSheet';
import { StatCard } from '@/components/admin/StatCard';
import { cn } from '@/lib/utils';

const NOMBRES_MES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ESTADO_STYLE: Record<EstadoFactura, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  pagada:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  vencida:   'bg-red-50 text-red-700 border-red-200',
  anulada:   'bg-slate-100 text-slate-500 border-slate-200',
};

const ESTADO_LABEL: Record<EstadoFactura, string> = {
  pendiente: 'Pendiente',
  pagada:    'Pagada',
  vencida:   'Vencida',
  anulada:   'Anulada',
};

const fmtUsd = (n: number) => `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtFecha = (s: string) => new Date(s).toLocaleDateString('es-AR');

export function AdminFacturacionPage() {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<EstadoFactura | 'todas'>('todas');
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['admin', 'facturas', filtro],
    queryFn: () => facturacionService.listarFacturas(filtro === 'todas' ? {} : { estado: filtro }),
  });

  const allQ = useQuery({
    queryKey: ['admin', 'facturas'],
    queryFn: () => facturacionService.listarFacturas(),
  });

  const reenviarMut = useMutation({
    mutationFn: (id: string) => facturacionService.reenviarEmail(id),
    onSuccess: () => toast.success('Email reenviado'),
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const marcarPagadaMut = useMutation({
    mutationFn: ({ id, metodo }: { id: string; metodo: string }) => facturacionService.marcarPagada(id, metodo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'facturas'] });
      toast.success('Factura marcada como pagada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const anularMut = useMutation({
    mutationFn: (id: string) => facturacionService.anular(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'facturas'] });
      toast.success('Factura anulada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  // KPIs derivados del listado completo
  const facturasAll = allQ.data ?? [];
  const cobrado = facturasAll.filter((f) => f.estado === 'pagada').reduce((s, f) => s + f.totalUsd, 0);
  const pendiente = facturasAll.filter((f) => f.estado === 'pendiente').reduce((s, f) => s + f.totalUsd, 0);
  const vencido = facturasAll.filter((f) => f.estado === 'vencida').reduce((s, f) => s + f.totalUsd, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturación</h1>
          <p className="text-sm text-muted-foreground">Suscripciones y facturas de las cuentas que usan la plataforma.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Generar factura
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={CheckCircle2} label="Cobrado"   valor={fmtUsd(cobrado)}   tone="emerald" />
        <StatCard icon={Clock}        label="Pendiente" valor={fmtUsd(pendiente)} tone="amber" />
        <StatCard icon={AlertCircle}  label="Vencido"   valor={fmtUsd(vencido)}   tone="slate" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['todas', 'pendiente', 'pagada', 'vencida', 'anulada'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition',
              filtro === f
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-muted-foreground border-border hover:border-slate-300',
            )}
          >
            {f === 'todas' ? 'Todas' : ESTADO_LABEL[f]}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : q.data && q.data.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No hay facturas todavía.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Factura</th>
                <th className="text-left px-4 py-3 font-medium">Cuenta</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Período</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Vence</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Estado</th>
                <th className="px-2 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {q.data?.map((f) => (
                <tr key={f.id} className="border-t border-border hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">F-{String(f.numero).padStart(4, '0')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{f.cuenta.nombre}</p>
                    <p className="text-xs text-muted-foreground">{f.cuenta.emailContacto ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {NOMBRES_MES[f.periodoMes]} {f.periodoAnio}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{fmtFecha(f.vencimiento)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{fmtUsd(f.totalUsd)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', ESTADO_STYLE[f.estado])}>
                      {ESTADO_LABEL[f.estado]}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {f.estado === 'pendiente' && (
                        <button
                          type="button"
                          onClick={() => {
                            const metodo = prompt('Método de pago (transferencia, mp, efectivo, etc.):', 'transferencia');
                            if (metodo) marcarPagadaMut.mutate({ id: f.id, metodo });
                          }}
                          title="Marcar pagada"
                          className="text-xs text-emerald-700 hover:bg-emerald-50 p-1.5 rounded inline-flex items-center"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => reenviarMut.mutate(f.id)}
                        disabled={reenviarMut.isPending || !f.cuenta.emailContacto}
                        title={f.cuenta.emailContacto ? 'Reenviar email' : 'La cuenta no tiene email'}
                        className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted disabled:opacity-30 inline-flex items-center"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      {f.estado !== 'pagada' && f.estado !== 'anulada' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Anular esta factura?')) anularMut.mutate(f.id);
                          }}
                          title="Anular"
                          className="text-xs text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 inline-flex items-center"
                        >
                          <Ban className="h-3.5 w-3.5" />
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

      <GenerarFacturaSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
