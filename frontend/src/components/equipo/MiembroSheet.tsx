import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { miembrosService, type MiembroCuenta } from '@/services/miembrosService';
import { MODULOS, type ModuloId, modulosVisibles } from '@/constants/modulos';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['ingeniero', 'propietario', 'operador']),
  /// Si `usarDefaultsRol` está en true, mandamos [] al backend (= "usá defaults").
  /// Si está en false, mandamos esta lista como allowlist explícita.
  modulosPermitidos: z.array(z.string()),
  usarDefaultsRol: z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  miembro: MiembroCuenta | null;
  onClose: () => void;
}

export function MiembroSheet({ open, miembro, onClose }: Props) {
  const editando = !!miembro;
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      email: '',
      rol: 'ingeniero',
      modulosPermitidos: [],
      usarDefaultsRol: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (miembro) {
        reset({
          nombre: miembro.nombre,
          email: miembro.email,
          rol: miembro.rol,
          modulosPermitidos: miembro.modulosPermitidos,
          usarDefaultsRol: miembro.modulosPermitidos.length === 0,
        });
      } else {
        reset({ nombre: '', email: '', rol: 'ingeniero', modulosPermitidos: [], usarDefaultsRol: true });
      }
    }
  }, [open, miembro, reset]);

  const rol = watch('rol') as 'ingeniero' | 'propietario' | 'operador';
  const usarDefaultsRol = watch('usarDefaultsRol');
  const modulosSeleccionados = (watch('modulosPermitidos') ?? []) as string[];
  const defaultsDelRol = modulosVisibles(rol, []);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const modulos = data.usarDefaultsRol ? [] : data.modulosPermitidos;
      if (editando && miembro) {
        return miembrosService.actualizar(miembro.usuarioId, {
          rol: data.rol,
          modulosPermitidos: modulos,
        });
      }
      return miembrosService.invitar({
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        modulosPermitidos: modulos,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['miembros'] });
      toast.success(editando ? 'Miembro actualizado' : 'Invitación enviada por email');
      onClose();
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={editando ? 'Editar miembro' : 'Invitar miembro'}
      description={
        editando
          ? 'Cambiá el rol o los módulos a los que tiene acceso.'
          : 'Le mandamos un email con un link para que active su cuenta y defina contraseña.'
      }
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {!editando && (
          <>
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
          </>
        )}

        {editando && miembro && (
          <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm">
            <p className="font-medium">{miembro.nombre}</p>
            <p className="text-xs text-muted-foreground">{miembro.email}</p>
          </div>
        )}

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

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Módulos visibles</p>
              <p className="text-[11px] text-muted-foreground">
                Qué secciones del sidebar va a ver este usuario.
              </p>
            </div>
            <Controller
              control={control}
              name="usarDefaultsRol"
              render={({ field }) => (
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (e.target.checked) setValue('modulosPermitidos', []);
                    }}
                  />
                  <span>Usar default del rol</span>
                </label>
              )}
            />
          </div>

          <div className={`grid grid-cols-2 gap-x-3 gap-y-1.5 ${usarDefaultsRol ? 'opacity-50 pointer-events-none' : ''}`}>
            {MODULOS.map((m) => {
              const checked = usarDefaultsRol
                ? defaultsDelRol.has(m.id)
                : modulosSeleccionados.includes(m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={usarDefaultsRol}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...modulosSeleccionados, m.id]
                        : modulosSeleccionados.filter((x) => x !== m.id);
                      setValue('modulosPermitidos', next as ModuloId[]);
                    }}
                  />
                  <span>{m.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editando ? 'Guardar' : 'Enviar invitación'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
