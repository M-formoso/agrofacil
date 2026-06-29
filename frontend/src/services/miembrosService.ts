import { apiClient } from '@/lib/apiClient';
import type { RolEnCuenta } from '@/stores/authStore';

export interface MiembroCuenta {
  membresiaId: string;
  usuarioId: string;
  email: string;
  nombre: string;
  rol: RolEnCuenta;
  modulosPermitidos: string[];
  activo: boolean;
  ultimoLogin: string | null;
  creadoEn: string;
  pendienteActivacion: boolean;
}

export interface InvitarMiembroInput {
  email: string;
  nombre: string;
  rol: RolEnCuenta;
  modulosPermitidos: string[];
}

export interface ActualizarMiembroInput {
  rol?: RolEnCuenta;
  modulosPermitidos?: string[];
}

export const miembrosService = {
  async listar(): Promise<MiembroCuenta[]> {
    const res = await apiClient.get<MiembroCuenta[]>('/miembros');
    return res.data;
  },
  async invitar(input: InvitarMiembroInput) {
    const res = await apiClient.post('/miembros/invitar', input);
    return res.data as { usuarioId: string; necesitaActivacion: boolean; invitacionEnviada: boolean };
  },
  async actualizar(usuarioId: string, input: ActualizarMiembroInput) {
    const res = await apiClient.patch(`/miembros/${usuarioId}`, input);
    return res.data;
  },
  async quitar(usuarioId: string) {
    const res = await apiClient.delete(`/miembros/${usuarioId}`);
    return res.data;
  },
  async reenviarInvitacion(usuarioId: string) {
    const res = await apiClient.post(`/miembros/${usuarioId}/reenviar-invitacion`);
    return res.data;
  },
};
