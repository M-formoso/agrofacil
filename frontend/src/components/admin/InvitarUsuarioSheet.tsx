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
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().trim().min(1, 'Nombre requerido'),
  cuentaId: z.string().uuid('Elegí una cuenta'),
  rol: z.enum(['ingeniero', 'propietario', 'operador']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InvitarUsuarioSheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const cuentasQ = useQuery({
    queryKey: ['admin', 'cuentas'],
    queryFn: () => adminService.listarCuentas(),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', nombre: '', cuentaId: '', rol: 'ingeniero' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => adminService.invitarUsuario(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success(
        res.invitacionEnviada
          ? 'Invitación enviada por email.'
          : 'Usuario agregado a la cuenta (ya existía).',
      );
      reset();
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Invitar usuario"
      description="Le mandamos un email con un link para que active su cuenta y defina contraseña."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" placeholder="Juan Pérez" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="juan@campo.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cuentaId">Cuenta *</Label>
          <select
            id="cuentaId"
            {...register('cuentaId')}
            className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm"
            disabled={cuentasQ.isLoading}
          >
            <option value="">— Elegí una cuenta —</option>
            {cuentasQ.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.cuentaId && <p className="text-xs text-destructive">{errors.cuentaId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rol">Rol en la cuenta *</Label>
          <select
            id="rol"
            {...register('rol')}
            className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm"
          >
            <option value="ingeniero">Ingeniero — control total</option>
            <option value="propietario">Propietario — lectura + comentarios</option>
            <option value="operador">Operador — carga de datos</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Enviar invitación
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
