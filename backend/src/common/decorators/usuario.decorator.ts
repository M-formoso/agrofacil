import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioActual } from '../types/usuario-actual';

export const Usuario = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioActual => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UsuarioActual;
  },
);
