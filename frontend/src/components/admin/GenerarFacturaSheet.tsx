import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { adminService } from '@/services/adminService';
import { facturacionService } from '@/services/facturacionService';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  cuentaId: z.string().uuid('Elegí una cuenta'),
  periodoMes: z.coerce.number().int().min(1).max(12),
  periodoAnio: z.coerce.number().int(),
  vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descripcion: z.string().trim().optional(),
  precioUnitarioUsd: z.coerce.number().nonnegative().optional(),
  impuestosUsd: z.coerce.number().nonnegative(),
  enviarEmail: z.boolean(),
  notaInterna: z.string().trim().optional(),
});
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  open: boolean;
  /// Si viene set, prefilled. Si no, deja al usuario elegir.
  cuentaIdPreseleccionada?: string;
  onClose: () => void;
}

export function GenerarFacturaSheet({ open, cuentaIdPreseleccionada, onClose }: Props) {
  const qc = useQueryClient();
  const cuentasQ = useQuery({
    queryKey: ['admin', 'cuentas'],
    queryFn: () => adminService.listarCuentas(),
    enabled: open,
  });

  const hoy = new Date();
  const venc = new Date(hoy.getFullYear(), hoy.getMonth(), 10);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cuentaId: cuentaIdPreseleccionada ?? '',
      periodoMes: hoy.getMonth() + 1,
      periodoAnio: hoy.getFullYear(),
      vencimiento: venc.toISOString().slice(0, 10),
      descripcion: '',
      precioUnitarioUsd: undefined,
      impuestosUsd: 0,
      enviarEmail: true,
      notaInterna: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        cuentaId: cuentaIdPreseleccionada ?? '',
        periodoMes: hoy.getMonth() + 1,
        periodoAnio: hoy.getFullYear(),
        vencimiento: venc.toISOString().slice(0, 10),
        descripcion: '',
        precioUnitarioUsd: undefined,
        impuestosUsd: 0,
        enviarEmail: true,
        notaInterna: '',
      });
    }
  }, [open, cuentaIdPreseleccionada]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const conceptos = data.descripcion && data.precioUnitarioUsd !== undefined
        ? [{ descripcion: data.descripcion, cantidad: 1, precioUnitarioUsd: Number(data.precioUnitarioUsd) }]
        : undefined;
      return facturacionService.generarFactura({
        cuentaId: data.cuentaId,
        periodoMes: data.periodoMes,
        periodoAnio: data.periodoAnio,
        vencimiento: data.vencimiento,
        conceptos,
        impuestosUsd: data.impuestosUsd,
        notaInterna: data.notaInterna || undefined,
        enviarEmail: data.enviarEmail,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'facturas'] });
      toast.success('Factura generada');
      onClose();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Generar factura"
      description="Si dejás vacíos los conceptos manuales, se autocompletan con la suscripción de la cuenta."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cuentaId">Cuenta *</Label>
          <select id="cuentaId" {...register('cuentaId')} className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm">
            <option value="">— Elegí una cuenta —</option>
            {cuentasQ.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errors.cuentaId && <p className="text-xs text-destructive">{errors.cuentaId.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="periodoMes">Mes</Label>
            <Input id="periodoMes" type="number" min="1" max="12" {...register('periodoMes')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="periodoAnio">Año</Label>
            <Input id="periodoAnio" type="number" {...register('periodoAnio')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vencimiento">Vencimiento</Label>
            <Input id="vencimiento" type="date" {...register('vencimiento')} />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-medium text-foreground">Concepto manual (opcional)</p>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" placeholder="Ej: Setup inicial" {...register('descripcion')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="precioUnitarioUsd">Precio (USD)</Label>
              <Input id="precioUnitarioUsd" type="number" step="0.01" min="0" {...register('precioUnitarioUsd')} placeholder="Vacío = suscripción" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="impuestosUsd">Impuestos (USD)</Label>
              <Input id="impuestosUsd" type="number" step="0.01" min="0" {...register('impuestosUsd')} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notaInterna">Nota interna</Label>
          <textarea id="notaInterna" {...register('notaInterna')} rows={2} className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('enviarEmail')} />
          <span>Enviar factura al email de contacto de la cuenta</span>
        </label>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Generar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
