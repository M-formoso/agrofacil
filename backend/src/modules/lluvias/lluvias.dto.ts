import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD');

export const registrarLluviaSchema = z.object({
  fecha: fechaIso,
  mm: z.coerce.number().nonnegative('Debe ser >= 0'),
  establecimientoId: z.string().uuid().optional().nullable(),
  nota: z.string().trim().optional(),
});
export class RegistrarLluviaDto extends createZodDto(registrarLluviaSchema) {}

export const actualizarLluviaSchema = z.object({
  mm: z.coerce.number().nonnegative().optional(),
  nota: z.string().trim().nullable().optional(),
});
export class ActualizarLluviaDto extends createZodDto(actualizarLluviaSchema) {}

export const listarLluviasSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  establecimientoId: z.string().uuid().optional(),
});
export type ListarLluviasQuery = z.infer<typeof listarLluviasSchema>;
