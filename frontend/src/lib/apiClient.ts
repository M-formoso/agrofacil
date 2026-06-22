import axios, { type AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
});

// Inyectar access token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar 401 con refresh automático
let refreshing: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) refreshing = refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(original);
        }
      } catch {
        useAuthStore.getState().logout();
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
