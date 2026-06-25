import { apiClient } from '@/lib/apiClient';

export interface Propietario {
  membresiaId: string;
  usuarioId: string;
  email: string;
  nombre: string;
  ultimoLogin: string | null;
  activo: boolean;
  creadoEn: string;
}

export interface CrearPropietarioInput {
  nombre: string;
  email: string;
  password?: string;
}

export interface CrearPropietarioResponse {
  membresiaId: string;
  usuarioId: string;
  email: string;
  nombre: string;
  /** Si el ingeniero no pasó password, acá viene la generada — UNA sola vez. */
  passwordGenerada: string | null;
  mensaje: string;
}

export interface CambiarPasswordInput {
  password?: string;
}

export interface CambiarPasswordResponse {
  usuarioId: string;
  passwordGenerada: string | null;
}

export const propietariosService = {
  async listar(): Promise<Propietario[]> {
    const res = await apiClient.get<Propietario[]>('/propietarios');
    return res.data;
  },

  async crear(input: CrearPropietarioInput): Promise<CrearPropietarioResponse> {
    const res = await apiClient.post<CrearPropietarioResponse>('/propietarios', input);
    return res.data;
  },

  async cambiarPassword(
    usuarioId: string,
    input: CambiarPasswordInput,
  ): Promise<CambiarPasswordResponse> {
    const res = await apiClient.post<CambiarPasswordResponse>(
      `/propietarios/${usuarioId}/cambiar-password`,
      input,
    );
    return res.data;
  },

  async revocar(usuarioId: string): Promise<void> {
    await apiClient.delete(`/propietarios/${usuarioId}`);
  },
};
