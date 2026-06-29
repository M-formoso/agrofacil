import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido'),
  emailContacto: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  cuenta: { id: string; nombre: string; emailContacto: string | null; telefono: string | null } | null;
  onClose: () => void;
}

export function EditarCuentaSheet({ open, cuenta, onClose }: Props) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', emailContacto: '', telefono: '' },
  });

  useEffect(() => {
    if (cuenta) {
      reset({
        nombre: cuenta.nombre,
        emailContacto: cuenta.emailContacto ?? '',
        telefono: cuenta.telefono ?? '',
      });
    }
  }, [cuenta, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      adminService.actualizarCuenta(cuenta!.id, {
        nombre: data.nombre,
        emailContacto: data.emailContacto || '',
        telefono: data.telefono || '',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas'] });
      if (cuenta) qc.invalidateQueries({ queryKey: ['admin', 'cuentas', cuenta.id] });
      toast.success('Cuenta actualizada');
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Editar cuenta"
      description="Datos generales de la organización."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="emailContacto">Email de contacto</Label>
          <Input id="emailContacto" type="email" {...register('emailContacto')} />
          {errors.emailContacto && <p className="text-xs text-destructive">{errors.emailContacto.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...register('telefono')} />
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
