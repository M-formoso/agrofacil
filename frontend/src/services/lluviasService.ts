import { apiClient } from '@/lib/apiClient';
import { buildQuery } from './_apiHelpers';

export interface RegistroLluvia {
  id: string;
  cuentaId: string;
  establecimientoId: string | null;
  fecha: string;       // ISO date (con hora 00:00:00.000Z)
  mm: string;          // Decimal serializado
  nota: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenLluvias {
  anio: number;
  establecimientoId: string | null;
  total: string;
  diasConLluvia: number;
  maxDia: string;
  promedioPorDiaConLluvia: string;
  porMes: { mes: number; mm: string; dias: number }[];
}

export interface RegistrarLluviaData {
  fecha: string;       // YYYY-MM-DD
  mm: number;
  establecimientoId?: string | null;
  nota?: string;
}

export const lluviasService = {
  listar: (anio: number, establecimientoId?: string) =>
    apiClient
      .get<RegistroLluvia[]>(`/lluvias${buildQuery({ anio, establecimientoId })}`)
      .then((r) => r.data),

  resumen: (anio: number, establecimientoId?: string) =>
    apiClient
      .get<ResumenLluvias>(`/lluvias/resumen${buildQuery({ anio, establecimientoId })}`)
      .then((r) => r.data),

  registrar: (data: RegistrarLluviaData) =>
    apiClient.post<RegistroLluvia>('/lluvias', data).then((r) => r.data),

  actualizar: (id: string, data: { mm?: number; nota?: string | null }) =>
    apiClient.patch<RegistroLluvia>(`/lluvias/${id}`, data).then((r) => r.data),

  eliminar: (id: string) => apiClient.delete(`/lluvias/${id}`),
};
