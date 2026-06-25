import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RolGlobal = 'superadmin' | 'ingeniero' | 'propietario';
export type RolEnCuenta = 'ingeniero' | 'propietario' | 'operador';

export interface MembresiaResumen {
  cuentaId: string;
  cuentaNombre: string;
  rol: RolEnCuenta;
}

export interface UsuarioActual {
  id: string;
  email: string;
  nombre: string;
  rolGlobal: RolGlobal;
  cuentaId: string;
  rolEnCuentaActiva: RolEnCuenta;
  membresias: MembresiaResumen[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioActual | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string, usuario: UsuarioActual) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,
      setTokens: (access, refresh, usuario) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          usuario,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          usuario: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'agrofacil-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
