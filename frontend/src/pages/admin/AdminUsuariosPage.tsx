import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/// Listado global de usuarios + invitación por email — stub.
export function AdminUsuariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Ingenieros, propietarios y operadores con acceso a alguna cuenta.
          </p>
        </div>
        <Button disabled className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar usuario
        </Button>
      </div>

      <div className="bg-white border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
        Acá va a venir el listado de usuarios y el alta por invitación.
      </div>
    </div>
  );
}
