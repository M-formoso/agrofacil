import { apiClient } from '@/lib/apiClient';

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    usp.append(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export async function getList<T>(url: string, params: Record<string, unknown> = {}) {
  const res = await apiClient.get<Paginado<T>>(`${url}${buildQuery(params)}`);
  return res.data;
}
