import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export class LoginDto extends createZodDto(loginSchema) {}

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken requerido'),
});

export class RefreshDto extends createZodDto(refreshSchema) {}
