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

const schema = z
  .object({
    nombreCuenta: z.string().trim().min(1, 'Nombre requerido'),
    emailContacto: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().trim().optional(),
    ingenieroEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    ingenieroNombre: z.string().trim().optional(),
  })
  .refine(
    (v) => {
      const tieneEmail = !!v.ingenieroEmail;
      const tieneNombre = !!v.ingenieroNombre;
      return tieneEmail === tieneNombre;
    },
    { message: 'Completá email y nombre del ingeniero, o dejá ambos vacíos', path: ['ingenieroEmail'] },
  );

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CrearCuentaSheet({ open, onClose }: Props) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombreCuenta: '', emailContacto: '', telefono: '', ingenieroEmail: '', ingenieroNombre: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      adminService.crearCuenta({
        nombreCuenta: data.nombreCuenta,
        emailContacto: data.emailContacto || undefined,
        telefono: data.telefono || undefined,
        ingenieroEmail: data.ingenieroEmail || undefined,
        ingenieroNombre: data.ingenieroNombre || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'cuentas'] });
      qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      toast.success(
        res.invitacionEnviada
          ? `Cuenta creada y email de invitación enviado.`
          : `Cuenta creada.`,
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
      title="Nueva cuenta"
      description="Creá una organización y, opcionalmente, invitá a su primer ingeniero por email."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <section className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nombreCuenta">Nombre de la cuenta *</Label>
            <Input id="nombreCuenta" placeholder="Campo de los Hermanos Pérez" {...register('nombreCuenta')} />
            {errors.nombreCuenta && <p className="text-xs text-destructive">{errors.nombreCuenta.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emailContacto">Email de contacto</Label>
              <Input id="emailContacto" type="email" placeholder="hola@campo.com" {...register('emailContacto')} />
              {errors.emailContacto && <p className="text-xs text-destructive">{errors.emailContacto.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" placeholder="+54 9 ..." {...register('telefono')} />
            </div>
          </div>
        </section>

        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium mb-2">Primer ingeniero (opcional)</p>
          <p className="text-xs text-muted-foreground mb-3">
            Si completás email + nombre, le mandamos un email de invitación para que active su cuenta y defina contraseña.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ingenieroNombre">Nombre</Label>
              <Input id="ingenieroNombre" placeholder="Juan Pérez" {...register('ingenieroNombre')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ingenieroEmail">Email</Label>
              <Input id="ingenieroEmail" type="email" placeholder="juan@campo.com" {...register('ingenieroEmail')} />
              {errors.ingenieroEmail && <p className="text-xs text-destructive">{errors.ingenieroEmail.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crear cuenta
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
