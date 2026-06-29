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
import { facturacionService } from '@/services/facturacionService';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  plan: z.enum(['basico', 'pro', 'enterprise', 'custom']),
  precioMensualUsd: z.coerce.number().nonnegative(),
  diaVencimiento: z.coerce.number().int().min(1).max(28),
  activa: z.boolean(),
  notaInterna: z.string().trim().optional(),
});
type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

interface Props {
  open: boolean;
  cuentaId: string | null;
  onClose: () => void;
}

export function SuscripcionSheet({ open, cuentaId, onClose }: Props) {
  const qc = useQueryClient();

  const susQ = useQuery({
    queryKey: ['admin', 'cuentas', cuentaId, 'suscripcion'],
    queryFn: () => facturacionService.obtenerSuscripcion(cuentaId!),
    enabled: open && !!cuentaId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'basico', precioMensualUsd: 0, diaVencimiento: 10, activa: true, notaInterna: '' },
  });

  useEffect(() => {
    if (open && susQ.data) {
      reset({
        plan: susQ.data.plan,
        precioMensualUsd: Number(susQ.data.precioMensualUsd),
        diaVencimiento: susQ.data.diaVencimiento,
        activa: susQ.data.activa,
        notaInterna: susQ.data.notaInterna ?? '',
      });
    } else if (open && !susQ.data && !susQ.isLoading) {
      reset({ plan: 'basico', precioMensualUsd: 0, diaVencimiento: 10, activa: true, notaInterna: '' });
    }
  }, [open, susQ.data, susQ.isLoading, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      facturacionService.setearSuscripcion(cuentaId!, {
        plan: data.plan,
        precioMensualUsd: data.precioMensualUsd,
        diaVencimiento: data.diaVencimiento,
        activa: data.activa,
        notaInterna: data.notaInterna || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas'] });
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas', cuentaId, 'suscripcion'] });
      toast.success('Suscripción guardada');
      onClose();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Suscripción de la cuenta"
      description="Plan y precio mensual que se va a facturar a esta cuenta."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="plan">Plan</Label>
          <select id="plan" {...register('plan')} className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm">
            <option value="basico">Básico</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="precioMensualUsd">Precio mensual (USD)</Label>
            <Input id="precioMensualUsd" type="number" step="0.01" min="0" {...register('precioMensualUsd')} />
            {errors.precioMensualUsd && <p className="text-xs text-destructive">{errors.precioMensualUsd.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diaVencimiento">Día de vencimiento</Label>
            <Input id="diaVencimiento" type="number" min="1" max="28" {...register('diaVencimiento')} />
            {errors.diaVencimiento && <p className="text-xs text-destructive">{errors.diaVencimiento.message}</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('activa')} />
          <span>Suscripción activa</span>
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="notaInterna">Nota interna (opcional)</Label>
          <textarea
            id="notaInterna"
            {...register('notaInterna')}
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm"
            placeholder="Ej: Cliente histórico, pago en pesos..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
