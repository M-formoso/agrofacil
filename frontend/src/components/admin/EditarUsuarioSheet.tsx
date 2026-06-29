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
import { adminService, type UsuarioAdmin } from '@/services/adminService';
import { extraerMensajeError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  rolGlobal: z.enum(['superadmin', 'ingeniero', 'propietario']),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  usuario: UsuarioAdmin | null;
  onClose: () => void;
}

export function EditarUsuarioSheet({ open, usuario, onClose }: Props) {
  const qc = useQueryClient();
  const miUsuarioId = useAuthStore((s) => s.usuario?.id);
  const esYoMismo = usuario?.id === miUsuarioId;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', rolGlobal: 'ingeniero' },
  });

  useEffect(() => {
    if (usuario) {
      reset({ nombre: usuario.nombre, email: usuario.email, rolGlobal: usuario.rolGlobal });
    }
  }, [usuario, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => adminService.actualizarUsuario(usuario!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas'] });
      toast.success('Usuario actualizado');
      onClose();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Editar usuario"
      description="Modificá los datos del usuario. El email tiene que ser único en la plataforma."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rolGlobal">Rol global</Label>
          <select
            id="rolGlobal"
            {...register('rolGlobal')}
            disabled={esYoMismo}
            className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm disabled:bg-muted disabled:cursor-not-allowed"
          >
            <option value="ingeniero">Ingeniero</option>
            <option value="propietario">Propietario</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <p className="text-[11px] text-muted-foreground">
            {esYoMismo
              ? '⚠️ No podés cambiar tu propio rol global desde el panel — quedarías afuera sin manera de volver.'
              : 'El rol global determina si el usuario puede entrar al panel admin (superadmin). En las cuentas, el rol específico se maneja en el detalle de cada cuenta.'}
          </p>
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
