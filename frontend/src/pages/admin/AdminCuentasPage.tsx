import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/// Listado y alta de Cuentas (organizaciones) — stub.
export function AdminCuentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuentas</h1>
          <p className="text-sm text-muted-foreground">
            Organizaciones de productores / ingenieros con acceso al sistema.
          </p>
        </div>
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      <div className="bg-white border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
        Todavía no hay cuentas para mostrar. El alta y el listado se implementan en la próxima iteración.
      </div>
    </div>
  );
}
