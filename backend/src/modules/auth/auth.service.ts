import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { UsuarioActual } from '../../common/types/usuario-actual';

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioActual;
}

interface JwtPayload {
  sub: string;
  email: string;
  cuentaId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<TokensResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { cuenta: true },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (usuario.cuenta && !usuario.cuenta.activo) {
      throw new UnauthorizedException('Cuenta inactiva');
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Credenciales inválidas');

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    return this.generarTokens({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      cuentaId: usuario.cuentaId,
    });
  }

  async refresh(refreshToken: string): Promise<TokensResponse> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { id: payload.sub, activo: true },
    });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    return this.generarTokens({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      cuentaId: usuario.cuentaId,
    });
  }

  async generarHash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  private async generarTokens(usuario: UsuarioActual): Promise<TokensResponse> {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      cuentaId: usuario.cuentaId,
    };
    const accessExpiresIn = (this.config.get<string>('jwt.accessExpiresIn') ?? '30m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = (this.config.get<string>('jwt.refreshExpiresIn') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessExpiresIn });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: refreshExpiresIn });
    return { accessToken, refreshToken, usuario };
  }
}
