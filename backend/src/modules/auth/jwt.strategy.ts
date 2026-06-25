import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { UsuarioActual } from '../../common/types/usuario-actual';

interface JwtPayload {
  sub: string;             // user id
  email: string;
  cuentaActivaId: string;  // cuenta seleccionada en este token
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('jwt.secret');
    if (!secret) throw new Error('JWT_SECRET no configurado');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioActual> {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: payload.sub, activo: true },
      include: {
        membresias: {
          where: { activo: true },
          include: { cuenta: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado o inactivo');

    if (usuario.membresias.length === 0) {
      throw new UnauthorizedException('Usuario sin membresías activas');
    }

    // Validar que la cuenta del token sigue siendo accesible
    const membresiaActiva = usuario.membresias.find((m) => m.cuentaId === payload.cuentaActivaId);
    if (!membresiaActiva) {
      throw new UnauthorizedException('Sin acceso a esa cuenta');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rolGlobal: usuario.rolGlobal,
      cuentaId: membresiaActiva.cuentaId,
      rolEnCuentaActiva: membresiaActiva.rol,
      membresias: usuario.membresias.map((m) => ({
        cuentaId: m.cuentaId,
        cuentaNombre: m.cuenta.nombre,
        rol: m.rol,
      })),
    };
  }
}
