import { apiClient } from '@/lib/apiClient';
import { getList } from './_apiHelpers';
import type { FormaPago, InsumoAplicado, TipoInsumo } from '@/types/agro';

export interface CrearInsumoData {
  loteCampaniaId: string;
  /** FK opcional al catálogo. Si está presente, descuenta stock. */
  insumoId?: string;
  tipo: TipoInsumo;
  producto: string;
  cantidad: number;
  unidad: string;
  costoTotalUsd: number;
  formaPago?: FormaPago;
}
export interface ActualizarInsumoData {
  insumoId?: string | null;
  tipo?: TipoInsumo;
  producto?: string;
  cantidad?: number;
  unidad?: string;
  costoTotalUsd?: number;
  formaPago?: FormaPago | null;
}

export const insumosAplicadosService = {
  listar: (params: Record<string, unknown> = {}) => getList<InsumoAplicado>('/insumos-aplicados', params),
  obtener: (id: string) =>
    apiClient.get<InsumoAplicado>(`/insumos-aplicados/${id}`).then((r) => r.data),
  crear: (data: CrearInsumoData) =>
    apiClient.post<InsumoAplicado>('/insumos-aplicados', data).then((r) => r.data),
  actualizar: (id: string, data: ActualizarInsumoData) =>
    apiClient.patch<InsumoAplicado>(`/insumos-aplicados/${id}`, data).then((r) => r.data),
  eliminar: (id: string) => apiClient.delete(`/insumos-aplicados/${id}`),
};
