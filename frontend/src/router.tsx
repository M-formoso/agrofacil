import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RutaProtegida } from '@/components/layout/RutaProtegida';
import { InicioPage } from '@/pages/InicioPage';
import { EstablecimientosPage } from '@/pages/EstablecimientosPage';
import { LotesPage } from '@/pages/LotesPage';
import { CampaniasPage } from '@/pages/CampaniasPage';
import { CampaniaDetallePage } from '@/pages/CampaniaDetallePage';
import { LoteCampaniaDetallePage } from '@/pages/LoteCampaniaDetallePage';
import { CultivosPage } from '@/pages/CultivosPage';
import { InsumosPage } from '@/pages/InsumosPage';
import { LluviasPage } from '@/pages/LluviasPage';
import { ClimaPage } from '@/pages/ClimaPage';
import { AsistentePage } from '@/pages/AsistentePage';
import { ResumenPage } from '@/pages/ResumenPage';
import { PropietariosPage } from '@/pages/PropietariosPage';
import { EstablecimientoDetallePage } from '@/pages/EstablecimientoDetallePage';
import { LoteDetallePage } from '@/pages/LoteDetallePage';
import { ReportesPage } from '@/pages/ReportesPage';
import { ReportePublicoPage } from '@/pages/ReportePublicoPage';
import { AlertasPage } from '@/pages/AlertasPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/r/:token', element: <ReportePublicoPage /> },
  {
    element: <RutaProtegida />,
    children: [
      { path: '/', element: <InicioPage /> },
      { path: '/establecimientos', element: <EstablecimientosPage /> },
      { path: '/establecimientos/:id', element: <EstablecimientoDetallePage /> },
      { path: '/lotes', element: <LotesPage /> },
      { path: '/lotes/:id', element: <LoteDetallePage /> },
      { path: '/campanias', element: <CampaniasPage /> },
      { path: '/campanias/:id', element: <CampaniaDetallePage /> },
      { path: '/lotes-campania/:id', element: <LoteCampaniaDetallePage /> },
      { path: '/lluvias', element: <LluviasPage /> },
      { path: '/clima', element: <ClimaPage /> },
      { path: '/asistente', element: <AsistentePage /> },
      { path: '/cultivos', element: <CultivosPage /> },
      { path: '/insumos', element: <InsumosPage /> },
      { path: '/resumen', element: <ResumenPage /> },
      { path: '/propietarios', element: <PropietariosPage /> },
      { path: '/reportes', element: <ReportesPage /> },
      { path: '/alertas', element: <AlertasPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
