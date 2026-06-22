import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const crearCultivoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
});
export class CrearCultivoDto extends createZodDto(crearCultivoSchema) {}

export const actualizarCultivoSchema = crearCultivoSchema.partial();
export class ActualizarCultivoDto extends createZodDto(actualizarCultivoSchema) {}
