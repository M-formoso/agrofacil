import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  activo: z.coerce.boolean().optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginar<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export const calcularSkip = (page: number, limit: number): number => (page - 1) * limit;
