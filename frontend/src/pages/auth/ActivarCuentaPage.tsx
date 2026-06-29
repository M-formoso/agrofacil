import { useParams } from 'react-router-dom';
import { LogoLockup } from '@/components/layout/Logo';

/// Página pública a la que se llega desde el email de invitación.
/// El usuario llega con un token único, lo validamos y le pedimos que setee su contraseña.
/// Stub por ahora — la lógica real se conecta cuando armemos el endpoint.
export function ActivarCuentaPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md glass rounded-2xl shadow-lift p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <LogoLockup size={36} animated />
          <h1 className="text-lg font-semibold">Activá tu cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Seteá una contraseña para acceder a AgroFácil.
          </p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 text-xs text-muted-foreground break-all">
          <p className="uppercase tracking-wider text-[10px] mb-1">Token recibido</p>
          <code>{token ?? '(sin token)'}</code>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          El formulario de activación se completa en la próxima iteración.
        </p>
      </div>
    </div>
  );
}
