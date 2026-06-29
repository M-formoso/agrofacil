import { apiClient } from '@/lib/apiClient';
import type { RolEnCuenta, UsuarioActual } from '@/stores/authStore';

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

export interface CuentaDetalle {
  id: string;
  nombre: string;
  emailContacto: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  membresias: {
    id: string;
    rol: RolEnCuenta;
    usuario: {
      id: string;
      nombre: string;
      email: string;
      activo: boolean;
      ultimoLogin: string | null;
    };
  }[];
  _count: { establecimientos: number; campanias: number };
}

export interface InvitacionAdmin {
  id: string;
  token: string;
  createdAt: string;
  expiraEn: string;
  usadoEn: string | null;
  estado: 'pendiente' | 'usada' | 'expirada';
  usuario: { id: string; email: string; nombre: string };
  cuenta: { id: string; nombre: string } | null;
}

export interface ImpersonarResponse {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioActual;
}

export const adminService = {
  // Cuentas
  async listarCuentas(): Promise<CuentaAdmin[]> {
    const res = await apiClient.get<CuentaAdmin[]>('/admin/cuentas');
    return res.data;
  },
  async detalleCuenta(id: string): Promise<CuentaDetalle> {
    const res = await apiClient.get<CuentaDetalle>(`/admin/cuentas/${id}`);
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
  async actualizarCuenta(id: string, input: { nombre?: string; emailContacto?: string; telefono?: string }) {
    const res = await apiClient.patch(`/admin/cuentas/${id}`, input);
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

  async actualizarUsuario(id: string, input: { nombre?: string; email?: string; rolGlobal?: 'superadmin' | 'ingeniero' | 'propietario' }) {
    const res = await apiClient.patch(`/admin/usuarios/${id}`, input);
    return res.data;
  },

  async eliminarUsuario(id: string) {
    const res = await apiClient.delete(`/admin/usuarios/${id}`);
    return res.data;
  },

  async actualizarMembresia(usuarioId: string, cuentaId: string, rol: RolEnCuenta) {
    const res = await apiClient.patch(`/admin/usuarios/${usuarioId}/membresias/${cuentaId}`, { rol });
    return res.data;
  },

  async quitarMembresia(usuarioId: string, cuentaId: string) {
    const res = await apiClient.delete(`/admin/usuarios/${usuarioId}/membresias/${cuentaId}`);
    return res.data;
  },

  // Invitaciones
  async listarInvitaciones(): Promise<InvitacionAdmin[]> {
    const res = await apiClient.get<InvitacionAdmin[]>('/admin/invitaciones');
    return res.data;
  },

  async cancelarInvitacion(id: string) {
    const res = await apiClient.delete(`/admin/invitaciones/${id}`);
    return res.data;
  },

  // Impersonación
  async impersonar(cuentaId: string): Promise<ImpersonarResponse> {
    const res = await apiClient.post<ImpersonarResponse>(`/admin/impersonar/${cuentaId}`);
    return res.data;
  },
};
