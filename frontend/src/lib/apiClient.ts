import axios, { type AxiosInstance, type AxiosResponse, AxiosError, AxiosHeaders } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { derivarEtiqueta, offlineQueue } from './offlineQueue';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
});

// Inyectar access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders();
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Manejar 401 con refresh automático + 0/red con cola offline
let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean; _skipQueue?: boolean }) | undefined;
    const status = error.response?.status;

    // --- Refresh de token 401 ---
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) refreshing = refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken && original.headers) {
          (original.headers as AxiosHeaders).set('Authorization', `Bearer ${newToken}`);
          return apiClient.request(original);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }

    // --- Sin respuesta del servidor (offline o servidor caído) → encolar mutación ---
    const esMutacion = original && ['post', 'patch', 'delete'].includes((original.method ?? '').toLowerCase());
    const esErrorDeRed = !error.response && error.code !== 'ERR_CANCELED';
    const noSkip = !original?._skipQueue;
    const url = original?.url ?? '';
    // No encolar las llamadas al endpoint de refresh ni a la cola en sí
    const urlEsCandidata = !url.includes('/auth/refresh') && !url.includes('/lluvias/sincronizar');

    if (esMutacion && esErrorDeRed && noSkip && urlEsCandidata) {
      try {
        const method = (original!.method!.toUpperCase()) as 'POST' | 'PATCH' | 'DELETE';
        const body = original!.data ? (typeof original!.data === 'string' ? JSON.parse(original!.data) : original!.data) : undefined;
        const op = offlineQueue.enqueue({
          url,
          method,
          body,
          label: derivarEtiqueta(url, method, body),
        });

        // Devolver una respuesta sintética 202 para que la mutation considere éxito local
        const respuestaOffline: AxiosResponse = {
          data: { offline: true, opId: op.id, ...((body as object) ?? {}) },
          status: 202,
          statusText: 'Accepted (offline queue)',
          headers: {},
          config: original!,
        };
        return respuestaOffline;
      } catch (err) {
        // Si falla la cola (ej. localStorage lleno), continuamos al reject normal
        console.error('No se pudo encolar la op offline', err);
      }
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    setTokens(res.data.accessToken, res.data.refreshToken, res.data.usuario);
    return res.data.accessToken;
  } catch {
    logout();
    return null;
  }
}

// Helper para errores legibles
export const extraerMensajeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
};

/** ¿La respuesta del apiClient fue guardada offline (no llegó al server)? */
export function esRespuestaOffline(data: unknown): boolean {
  return typeof data === 'object' && data !== null && (data as { offline?: boolean }).offline === true;
}
