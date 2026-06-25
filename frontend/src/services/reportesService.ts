import axios from 'axios';
import { apiClient } from '@/lib/apiClient';

export type TipoReporte = 'lote_campania' | 'campania' | 'establecimiento';

export interface ReporteResumen {
  id: string;
  tipo: TipoReporte;
  titulo: string;
  tokenPublico: string;
  expiraEn: string | null;
  autor: { id: string; nombre: string };
  cantidadComentarios: number;
  createdAt: string;
}

export interface ComentarioReporte {
  id: string;
  reporteId: string;
  autorId: string;
  texto: string;
  activo: boolean;
  createdAt: string;
  autor: { id: string; nombre: string };
}

export interface ReporteDetalle {
  id: string;
  cuentaId: string;
  autorId: string;
  tipo: TipoReporte;
  titulo: string;
  tokenPublico: string;
  expiraEn: string | null;
  parametros: Record<string, string>;
  datosSnapshot: unknown;
  createdAt: string;
  autor: { id: string; nombre: string };
  comentarios: ComentarioReporte[];
}

export interface ReportePublico {
  id: string;
  tipo: TipoReporte;
  titulo: string;
  datosSnapshot: unknown;
  autor: { id: string; nombre: string };
  createdAt: string;
}

export interface CrearReporteInput {
  tipo: TipoReporte;
  parametros: Record<string, string>;
  titulo?: string;
  diasValidez?: number | null;
}

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const reportesService = {
  async listar(): Promise<ReporteResumen[]> {
    const res = await apiClient.get<ReporteResumen[]>('/reportes');
    return res.data;
  },

  async obtener(id: string): Promise<ReporteDetalle> {
    const res = await apiClient.get<ReporteDetalle>(`/reportes/${id}`);
    return res.data;
  },

  async crear(input: CrearReporteInput): Promise<ReporteDetalle> {
    const res = await apiClient.post<ReporteDetalle>('/reportes', input);
    return res.data;
  },

  async revocar(id: string): Promise<void> {
    await apiClient.delete(`/reportes/${id}`);
  },

  async comentarios(reporteId: string): Promise<ComentarioReporte[]> {
    const res = await apiClient.get<ComentarioReporte[]>(`/reportes/${reporteId}/comentarios`);
    return res.data;
  },

  async comentar(reporteId: string, texto: string): Promise<ComentarioReporte> {
    const res = await apiClient.post<ComentarioReporte>(`/reportes/${reporteId}/comentarios`, { texto });
    return res.data;
  },

  async eliminarComentario(comentarioId: string): Promise<void> {
    await apiClient.delete(`/reportes/comentarios/${comentarioId}`);
  },

  /**
   * Obtiene un reporte por su token público. NO usa apiClient porque el endpoint
   * es público y queremos evitar inyectar el Bearer (puede causar 401 si el
   * propio usuario no tiene auth en esa sesión).
   */
  async publico(token: string): Promise<ReportePublico> {
    const res = await axios.get<ReportePublico>(`${baseURL}/reportes/publico/${token}`);
    return res.data;
  },
};

/** URL absoluta que se comparte. */
export function urlReportePublico(token: string): string {
  if (typeof window === 'undefined') return `/r/${token}`;
  return `${window.location.origin}/r/${token}`;
}
