import { LogOut, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground border-b border-primary-hover">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6" />
            <span className="font-bold text-lg">AgroFácil</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90 hidden sm:inline">{usuario?.nombre}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sidebar-foreground hover:bg-primary-hover">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hola, {usuario?.nombre} 👋</h1>
          <p className="text-muted-foreground">Bienvenido a la primera versión de AgroFácil.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximos módulos del MVP</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Modulo titulo="Campos y lotes" descripcion="Alta de establecimientos, lotes, superficie y tenencia." />
            <Modulo titulo="Campaña" descripcion="Crear campaña y asignar cultivos a cada lote." />
            <Modulo titulo="Carga" descripcion="Registrar labores e insumos manual o por voz/foto." />
            <Modulo titulo="Resultado del lote" descripcion="Costos, márgenes y punto de equilibrio en USD y qq/ha." />
            <Modulo titulo="Resumen de campaña" descripcion="Totales por cultivo y por campaña." />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Modulo({ titulo, descripcion }: { titulo: string; descripcion: string }): JSX.Element {
  return (
    <div className="rounded-md border border-border p-4 hover:border-primary transition-colors">
      <h3 className="font-semibold text-foreground">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-1">{descripcion}</p>
    </div>
  );
}
