import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudRain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { lluviasService } from '@/services/lluviasService';
import { establecimientosService } from '@/services/establecimientosService';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Requerido'),
  mm: z.coerce.number().positive('Tiene que ser > 0').max(500, 'Demasiado para un día'),
  establecimientoId: z.string().uuid().optional().or(z.literal('')),
  nota: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LluviaRapidaSheet({ open, onClose }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      mm: undefined,
      establecimientoId: '',
      nota: '',
    },
  });

  const { data: establecimientos } = useQuery({
    queryKey: ['establecimientos', 'select'],
    queryFn: () => establecimientosService.listar({ limit: 100 }),
    enabled: open,
  });

  const cerrarYReset = () => {
    reset();
    onClose();
  };

  const crear = useMutation({
    mutationFn: (d: FormOutput) =>
      lluviasService.registrar({
        fecha: d.fecha,
        mm: d.mm,
        establecimientoId: d.establecimientoId ? d.establecimientoId : null,
        nota: d.nota,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lluvias'] });
      qc.invalidateQueries({ queryKey: ['lluvias-resumen'] });
      toast.success('Lluvia registrada');
      cerrarYReset();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && cerrarYReset()}
      title="Registrar lluvia"
      description="Registro rápido. Para una vista completa con calendario, andá a Lluvias."
    >
      <form onSubmit={handleSubmit((d) => crear.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register('fecha')} />
            {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mm">Milímetros</Label>
            <div className="relative">
              <CloudRain className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input id="mm" type="number" step="0.1" inputMode="decimal" className="pl-9" placeholder="15.5" {...register('mm')} />
            </div>
            {errors.mm && <p className="text-xs text-destructive">{errors.mm.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estId">Establecimiento <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
          <select
            id="estId"
            className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('establecimientoId')}
          >
            <option value="">Toda la cuenta (sin asignar)</option>
            {establecimientos?.items.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nota">Nota <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
          <Input id="nota" placeholder="Granizo, tormenta de noche..." {...register('nota')} />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={cerrarYReset}>Cancelar</Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
