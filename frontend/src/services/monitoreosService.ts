import { apiClient } from '@/lib/apiClient';

export type TipoMonitoreo = 'seguimiento' | 'prescripcion' | 'control_plaga' | 'general';
export type Urgencia = 'baja' | 'media' | 'alta';

export interface FotoMonitoreo {
  id: string;
  monitoreoId: string;
  url: string;
  orden: number;
  createdAt: string;
}

export interface AutorMonitoreo {
  id: string;
  nombre: string;
  email: string;
}

export interface Monitoreo {
  id: string;
  cuentaId: string;
  loteCampaniaId: string;
  autorId: string;
  tipo: TipoMonitoreo;
  fecha: string;
  observaciones: string;
  prescripcion: string | null;
  urgencia: Urgencia;
  latitud: string | null;
  longitud: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  fotos: FotoMonitoreo[];
  autor: AutorMonitoreo;
  loteCampania?: {
    id: string;
    lote: { id: string; nombre: string };
    cultivo: { id: string; nombre: string };
  };
}

export interface CrearMonitoreoInput {
  loteCampaniaId: string;
  tipo: TipoMonitoreo;
  fecha: string;
  observaciones: string;
  prescripcion?: string;
  urgencia: Urgencia;
  latitud?: number;
  longitud?: number;
}

export interface ActualizarMonitoreoInput {
  tipo?: TipoMonitoreo;
  fecha?: string;
  observaciones?: string;
  prescripcion?: string | null;
  urgencia?: Urgencia;
  latitud?: number | null;
  longitud?: number | null;
}

export const monitoreosService = {
  async listar(loteCampaniaId?: string): Promise<Monitoreo[]> {
    const res = await apiClient.get<Monitoreo[]>('/monitoreos', {
      params: loteCampaniaId ? { loteCampaniaId } : undefined,
    });
    return res.data;
  },

  async obtener(id: string): Promise<Monitoreo> {
    const res = await apiClient.get<Monitoreo>(`/monitoreos/${id}`);
    return res.data;
  },

  async crear(input: CrearMonitoreoInput): Promise<Monitoreo> {
    const res = await apiClient.post<Monitoreo>('/monitoreos', input);
    return res.data;
  },

  async actualizar(id: string, input: ActualizarMonitoreoInput): Promise<Monitoreo> {
    const res = await apiClient.patch<Monitoreo>(`/monitoreos/${id}`, input);
    return res.data;
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.delete(`/monitoreos/${id}`);
  },

  async subirFotos(monitoreoId: string, archivos: File[]): Promise<FotoMonitoreo[]> {
    const form = new FormData();
    archivos.forEach((a) => form.append('fotos', a));
    const res = await apiClient.post<FotoMonitoreo[]>(
      `/monitoreos/${monitoreoId}/fotos`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data;
  },

  async eliminarFoto(monitoreoId: string, fotoId: string): Promise<void> {
    await apiClient.delete(`/monitoreos/${monitoreoId}/fotos/${fotoId}`);
  },
};

/** Construye la URL absoluta de una foto a partir de la url relativa (`/uploads/...`). */
export function urlFotoAbsoluta(urlRelativa: string): string {
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
  // VITE_API_URL termina en /api/v1 — las fotos viven en la raíz del host (sin prefix).
  const host = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${host}${urlRelativa}`;
}
