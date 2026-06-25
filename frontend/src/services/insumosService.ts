import { apiClient } from '@/lib/apiClient';
import type { TipoInsumo } from '@/types/agro';

export interface Insumo {
  id: string;
  cuentaId: string;
  nombre: string;
  tipo: TipoInsumo;
  unidad: string;
  stockActual: string;
  stockMinimo: string;
  costoUnitarioUsd: string | null;
  proveedor: string | null;
  nota: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  /** Derivado en backend: true si stockActual <= stockMinimo. */
  stockBajo: boolean;
}

export interface CrearInsumoInput {
  nombre: string;
  tipo: TipoInsumo;
  unidad: string;
  stockActual?: number;
  stockMinimo?: number;
  costoUnitarioUsd?: number | null;
  proveedor?: string | null;
  nota?: string | null;
}

export interface ActualizarInsumoInput {
  nombre?: string;
  tipo?: TipoInsumo;
  unidad?: string;
  stockActual?: number;
  stockMinimo?: number;
  costoUnitarioUsd?: number | null;
  proveedor?: string | null;
  nota?: string | null;
}

export interface MovimientoStockInput {
  /** Positivo suma, negativo descuenta. */
  delta: number;
  nota?: string;
}

export const insumosService = {
  async listar(): Promise<Insumo[]> {
    const res = await apiClient.get<Insumo[]>('/insumos');
    return res.data;
  },

  async obtener(id: string): Promise<Insumo> {
    const res = await apiClient.get<Insumo>(`/insumos/${id}`);
    return res.data;
  },

  async crear(input: CrearInsumoInput): Promise<Insumo> {
    const res = await apiClient.post<Insumo>('/insumos', input);
    return res.data;
  },

  async actualizar(id: string, input: ActualizarInsumoInput): Promise<Insumo> {
    const res = await apiClient.patch<Insumo>(`/insumos/${id}`, input);
    return res.data;
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.delete(`/insumos/${id}`);
  },

  async movimiento(id: string, input: MovimientoStockInput): Promise<Insumo> {
    const res = await apiClient.post<Insumo>(`/insumos/${id}/movimiento`, input);
    return res.data;
  },
};
