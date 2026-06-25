import { apiClient } from '@/lib/apiClient';

export type TipoAlerta = 'clima' | 'agua' | 'plaga' | 'vencimiento' | 'general';
export type SeveridadAlerta = 'info' | 'warning' | 'critica';

export interface Alerta {
  id: string;
  cuentaId: string;
  usuarioId: string | null;
  tipo: TipoAlerta;
  severidad: SeveridadAlerta;
  titulo: string;
  detalle: string | null;
  contexto: Record<string, unknown> | null;
  leida: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearAlertaInput {
  tipo?: TipoAlerta;
  severidad?: SeveridadAlerta;
  titulo: string;
  detalle?: string;
  usuarioId?: string;
  contexto?: Record<string, unknown>;
}

export const alertasService = {
  async listar(soloNoLeidas = false): Promise<Alerta[]> {
    const res = await apiClient.get<Alerta[]>('/alertas', {
      params: soloNoLeidas ? { soloNoLeidas: 'true' } : undefined,
    });
    return res.data;
  },

  async conteo(): Promise<{ noLeidas: number }> {
    const res = await apiClient.get<{ noLeidas: number }>('/alertas/conteo');
    return res.data;
  },

  async crear(input: CrearAlertaInput): Promise<Alerta> {
    const res = await apiClient.post<Alerta>('/alertas', input);
    return res.data;
  },

  async marcarLeida(id: string): Promise<Alerta> {
    const res = await apiClient.post<Alerta>(`/alertas/${id}/leer`);
    return res.data;
  },

  async marcarTodasLeidas(): Promise<{ actualizadas: number }> {
    const res = await apiClient.post<{ actualizadas: number }>('/alertas/leer-todas');
    return res.data;
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.delete(`/alertas/${id}`);
  },
};
