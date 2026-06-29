import { apiClient } from '@/lib/apiClient';
import type { AgregadoPorCultivo, ResultadoLote, ResumenCampania } from '@/types/agro';

export interface AgregadoPorEstablecimiento {
  establecimientoId: string;
  establecimientoNombre: string;
  cantidadLotes: number;
  cultivos: string[];
  esProyeccion: boolean;
  superficieHa: string;
  ingresoBruto: string;
  costoTotal: string;
  margenNeto: string;
  ingresoBrutoHa: string;
  costoTotalHa: string;
  margenNetoHa: string;
}

export type EnfoqueRanking = 'productivo' | 'costos';
export type OrdenRanking =
  | 'margen_neto'
  | 'margen_neto_ha'
  | 'rinde'
  | 'costo_total_ha'
  | 'ingreso_bruto';

export interface FilaRanking {
  loteCampaniaId: string;
  lote: string;
  establecimiento: string;
  campania: string;
  cultivo: string;
  esProyeccion: boolean;
  superficieHa: string;
  rinde: string;
  rindeFuente: 'real' | 'estimado';
  ingresoBruto: string;
  ingresoBrutoHa: string;
  costoDirecto: string;
  costoArrendamiento: string;
  costoTotal: string;
  costoTotalHa: string;
  margenNeto: string;
  margenNetoHa: string;
  puntoEquilibrioQqHa: string;
}

export interface RespuestaRanking {
  ordenarPor: OrdenRanking;
  enfoque: EnfoqueRanking;
  filas: FilaRanking[];
}

export interface FiltrosRanking {
  campaniaId?: string;
  cultivoId?: string;
  establecimientoId?: string;
  ordenarPor?: OrdenRanking;
  enfoque?: EnfoqueRanking;
}

export const calculosService = {
  resultadoLote: (loteCampaniaId: string) =>
    apiClient.get<ResultadoLote>(`/calculos/lotes-campania/${loteCampaniaId}/resultado`).then((r) => r.data),
  porCultivo: (campaniaId: string) =>
    apiClient.get<AgregadoPorCultivo[]>(`/calculos/campanias/${campaniaId}/por-cultivo`).then((r) => r.data),
  porEstablecimiento: (campaniaId: string) =>
    apiClient
      .get<AgregadoPorEstablecimiento[]>(`/calculos/campanias/${campaniaId}/por-establecimiento`)
      .then((r) => r.data),
  resumenCampania: (campaniaId: string) =>
    apiClient.get<ResumenCampania>(`/calculos/campanias/${campaniaId}/resumen`).then((r) => r.data),
  ranking: (filtros: FiltrosRanking = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filtros)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return apiClient.get<RespuestaRanking>(`/calculos/ranking${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },
};
