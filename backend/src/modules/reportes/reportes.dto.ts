import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const crearReporteSchema = z.object({
  tipo: z.enum(['lote_campania', 'campania', 'establecimiento']),
  /** Para lote_campania: { loteCampaniaId } */
  parametros: z.record(z.string(), z.string().uuid()),
  /** Título mostrado en el reporte. Si no viene, se genera. */
  titulo: z.string().trim().min(1).optional(),
  /** Días de validez del link público. null = sin expiración. */
  diasValidez: z.number().int().positive().max(365).optional().nullable(),
});
export class CrearReporteDto extends createZodDto(crearReporteSchema) {}

export const comentarioReporteSchema = z.object({
  texto: z.string().trim().min(1, 'Texto requerido').max(1000),
});
export class ComentarioReporteDto extends createZodDto(comentarioReporteSchema) {}
