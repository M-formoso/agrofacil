import { apiClient } from '@/lib/apiClient';
import type { RolEnCuenta } from '@/stores/authStore';

export interface CuentaAdmin {
  id: string;
  nombre: string;
  emailContacto: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  usuarios: number;
  establecimientos: number;
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  rolGlobal: 'superadmin' | 'ingeniero' | 'propietario';
  activo: boolean;
  ultimoLogin: string | null;
  createdAt: string;
  cuentas: { id: string; nombre: string; rol: RolEnCuenta }[];
  pendienteActivacion: boolean;
}

export interface CrearCuentaInput {
  nombreCuenta: string;
  emailContacto?: string;
  telefono?: string;
  ingenieroEmail?: string;
  ingenieroNombre?: string;
}

export interface InvitarUsuarioInput {
  email: string;
  nombre: string;
  cuentaId: string;
  rol: RolEnCuenta;
}

export const adminService = {
  // Cuentas
  async listarCuentas(): Promise<CuentaAdmin[]> {
    const res = await apiClient.get<CuentaAdmin[]>('/admin/cuentas');
    return res.data;
  },
  async detalleCuenta(id: string) {
    const res = await apiClient.get(`/admin/cuentas/${id}`);
    return res.data;
  },
  async crearCuenta(input: CrearCuentaInput) {
    const res = await apiClient.post('/admin/cuentas', input);
    return res.data as { cuenta: CuentaAdmin; invitacionEnviada: boolean };
  },
  async activarCuenta(id: string) {
    const res = await apiClient.patch(`/admin/cuentas/${id}/activar`);
    return res.data;
  },
  async desactivarCuenta(id: string) {
    const res = await apiClient.patch(`/admin/cuentas/${id}/desactivar`);
    return res.data;
  },

  // Usuarios
  async listarUsuarios(): Promise<UsuarioAdmin[]> {
    const res = await apiClient.get<UsuarioAdmin[]>('/admin/usuarios');
    return res.data;
  },
  async invitarUsuario(input: InvitarUsuarioInput) {
    const res = await apiClient.post('/admin/usuarios/invitar', input);
    return res.data as { usuarioId: string; necesitaActivacion: boolean; invitacionEnviada: boolean };
  },
  async reenviarInvitacion(usuarioId: string) {
    const res = await apiClient.post(`/admin/usuarios/${usuarioId}/reenviar-invitacion`);
    return res.data;
  },
  async activarUsuario(id: string) {
    const res = await apiClient.patch(`/admin/usuarios/${id}/activar`);
    return res.data;
  },
  async desactivarUsuario(id: string) {
    const res = await apiClient.patch(`/admin/usuarios/${id}/desactivar`);
    return res.data;
  },
};
