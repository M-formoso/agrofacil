import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2, Sprout } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authService.login(data.email, data.password),
    onSuccess: (res) => {
      setTokens(res.accessToken, res.refreshToken, res.usuario);
      toast.success(`Bienvenido, ${res.usuario.nombre}`);
      navigate('/', { replace: true });
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground">
            <Sprout className="h-7 w-7" />
          </div>
          <CardTitle>AgroFácil</CardTitle>
          <CardDescription>Ingresá a tu campaña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="demo@agrofacil.dev"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Demo: <code className="bg-muted px-1 rounded">demo@agrofacil.dev</code> /{' '}
              <code className="bg-muted px-1 rounded">agrofacil123</code>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
