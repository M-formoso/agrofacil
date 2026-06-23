import { apiClient } from '@/lib/apiClient';
import { buildQuery } from './_apiHelpers';

export interface Variedad {
  id: string;
  cultivoId: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  cultivo?: { nombre: string };
}

export const variedadesService = {
  listar: (cultivoId?: string) =>
    apiClient.get<Variedad[]>(`/variedades${buildQuery({ cultivoId })}`).then((r) => r.data),

  crear: (cultivoId: string, nombre: string) =>
    apiClient.post<Variedad>('/variedades', { cultivoId, nombre }).then((r) => r.data),

  actualizar: (id: string, nombre: string) =>
    apiClient.patch<Variedad>(`/variedades/${id}`, { nombre }).then((r) => r.data),

  eliminar: (id: string) => apiClient.delete(`/variedades/${id}`),
};
