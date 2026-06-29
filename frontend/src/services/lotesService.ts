import { apiClient } from '@/lib/apiClient';
import { getList } from './_apiHelpers';
import type { Lote, Tenencia, UnidadArrendamiento } from '@/types/agro';

export interface CrearLoteData {
  establecimientoId: string;
  nombre: string;
  superficieHa: number;
  tenencia?: Tenencia;
  arrendamientoValor?: number;
  arrendamientoUnidad?: UnidadArrendamiento;
}
export type ActualizarLoteData = Partial<Omit<CrearLoteData, 'establecimientoId'>>;

export interface DividirLoteData {
  partes: Array<{ nombre: string; superficieHa: number }>;
  archivarOriginal?: boolean;
}
export interface DividirLoteResponse {
  original: Lote;
  nuevos: Lote[];
}

export const lotesService = {
  listar: (params: Record<string, unknown> = {}) => getList<Lote>('/lotes', params),
  obtener: (id: string) => apiClient.get<Lote>(`/lotes/${id}`).then((r) => r.data),
  crear: (data: CrearLoteData) => apiClient.post<Lote>('/lotes', data).then((r) => r.data),
  actualizar: (id: string, data: ActualizarLoteData) =>
    apiClient.patch<Lote>(`/lotes/${id}`, data).then((r) => r.data),
  eliminar: (id: string) => apiClient.delete(`/lotes/${id}`),
  dividir: (id: string, data: DividirLoteData) =>
    apiClient.post<DividirLoteResponse>(`/lotes/${id}/dividir`, data).then((r) => r.data),
};
