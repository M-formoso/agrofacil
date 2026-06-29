import { apiClient } from '@/lib/apiClient';

export type PlanFacturacion = 'basico' | 'pro' | 'enterprise' | 'custom';
export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida' | 'anulada';

export interface SuscripcionCuenta {
  id: string;
  cuentaId: string;
  plan: PlanFacturacion;
  precioMensualUsd: string | number;
  diaVencimiento: number;
  activa: boolean;
  notaInterna: string | null;
  iniciadaEn: string;
}

export interface Concepto {
  descripcion: string;
  cantidad: number;
  precioUnitarioUsd: number;
  subtotalUsd: number;
}

export interface Factura {
  id: string;
  numero: number;
  cuenta: { id: string; nombre: string; emailContacto: string | null };
  periodoMes: number;
  periodoAnio: number;
  conceptos: Concepto[];
  subtotalUsd: number;
  impuestosUsd: number;
  totalUsd: number;
  estado: EstadoFactura;
  emitidaEn: string;
  vencimiento: string;
  pagadaEn: string | null;
  metodoPago: string | null;
  notaInterna: string | null;
}

export interface SetearSuscripcionInput {
  plan: PlanFacturacion;
  precioMensualUsd: number;
  diaVencimiento: number;
  activa: boolean;
  notaInterna?: string;
}

export interface GenerarFacturaInput {
  cuentaId: string;
  periodoMes: number;
  periodoAnio: number;
  vencimiento: string; // YYYY-MM-DD
  conceptos?: { descripcion: string; cantidad: number; precioUnitarioUsd: number }[];
  impuestosUsd?: number;
  notaInterna?: string;
  enviarEmail?: boolean;
}

export const facturacionService = {
  async obtenerSuscripcion(cuentaId: string): Promise<SuscripcionCuenta | null> {
    const res = await apiClient.get(`/admin/cuentas/${cuentaId}/suscripcion`);
    return res.data;
  },
  async setearSuscripcion(cuentaId: string, input: SetearSuscripcionInput) {
    const res = await apiClient.put(`/admin/cuentas/${cuentaId}/suscripcion`, input);
    return res.data as SuscripcionCuenta;
  },
  async eliminarSuscripcion(cuentaId: string) {
    const res = await apiClient.delete(`/admin/cuentas/${cuentaId}/suscripcion`);
    return res.data;
  },

  async listarFacturas(params: { estado?: EstadoFactura; cuentaId?: string } = {}): Promise<Factura[]> {
    const res = await apiClient.get('/admin/facturas', { params });
    return res.data;
  },
  async generarFactura(input: GenerarFacturaInput) {
    const res = await apiClient.post('/admin/facturas', input);
    return res.data;
  },
  async marcarPagada(id: string, metodoPago: string, pagadaEn?: string) {
    const res = await apiClient.patch(`/admin/facturas/${id}/pagada`, { metodoPago, pagadaEn });
    return res.data;
  },
  async anular(id: string) {
    const res = await apiClient.patch(`/admin/facturas/${id}/anular`);
    return res.data;
  },
  async reenviarEmail(id: string) {
    const res = await apiClient.post(`/admin/facturas/${id}/reenviar-email`);
    return res.data;
  },
};
