import { z } from 'zod';

const lat = z.coerce.number().min(-90).max(90);
const lon = z.coerce.number().min(-180).max(180);

export const coordenadasSchema = z.object({
  lat,
  lon,
});
export type CoordenadasQuery = z.infer<typeof coordenadasSchema>;

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

export const historicoSchema = z.object({
  lat,
  lon,
  desde: fechaIso,
  hasta: fechaIso,
});
export type HistoricoQuery = z.infer<typeof historicoSchema>;
