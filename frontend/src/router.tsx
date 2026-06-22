import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { RutaProtegida } from '@/components/layout/RutaProtegida';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RutaProtegida />,
    children: [
      { path: '/', element: <HomePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
