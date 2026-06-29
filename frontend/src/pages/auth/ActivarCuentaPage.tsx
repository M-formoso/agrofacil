import { useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Loader2, ShieldX, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoLockup } from '@/components/layout/Logo';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmar: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((v) => v.password === v.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] });
type FormData = z.infer<typeof schema>;

const MENSAJES_MOTIVO: Record<string, string> = {
  no_existe: 'Este link no existe o ya no está disponible.',
  usado: 'Este link ya fue usado. Si necesitás otro, pedile al superadmin que reenvíe la invitación.',
  expirado: 'El link de invitación venció. Pedí uno nuevo al superadmin.',
  usuario_inactivo: 'El usuario está desactivado. Contactá al superadmin.',
};

export function ActivarCuentaPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const verificacionQ = useQuery({
    queryKey: ['auth', 'verificar-invitacion', token],
    queryFn: () => authService.verificarInvitacion(token!),
    enabled: !!token,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmar: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authService.activar(token!, data.password),
    onSuccess: (res) => {
      setTokens(res.accessToken, res.refreshToken, res.usuario);
      toast.success(`Cuenta activada. Bienvenido, ${res.usuario.nombre}`);
      navigate(res.usuario.rolGlobal === 'superadmin' ? '/admin' : '/', { replace: true });
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Por las dudas: si el usuario ya está logueado y entra a este link, lo mandamos al home.
    }
  }, [isAuthenticated]);

  if (!token) return <Navigate to="/login" replace />;

  const valida = verificacionQ.data?.valido === true;
  const motivo = verificacionQ.data?.motivo;
  const email = verificacionQ.data?.emailDestinatario;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl shadow-lift p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <LogoLockup size={36} animated />
            <h1 className="text-lg font-semibold">Activá tu cuenta</h1>
          </div>

          {verificacionQ.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !valida ? (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <ShieldX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Link no válido</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {MENSAJES_MOTIVO[motivo ?? 'no_existe'] ?? 'No se pudo validar este link.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm">
                <MailCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-emerald-900 truncate">{email}</span>
              </div>

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmar">Confirmar contraseña</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmar')}
                  />
                  {errors.confirmar && <p className="text-xs text-destructive">{errors.confirmar.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Activar y entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
