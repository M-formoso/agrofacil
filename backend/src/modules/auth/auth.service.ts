import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RolEnCuenta, type Usuario, type UsuarioCuenta, type Cuenta } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { UsuarioActual } from '../../common/types/usuario-actual';
import type { ActualizarPerfilDto, RegistroDto } from './dto/login.dto';

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioActual;
}

interface JwtPayload {
  sub: string;
  email: string;
  cuentaActivaId: string;
}

type UsuarioConMembresias = Usuario & {
  membresias: (UsuarioCuenta & { cuenta: { id: string; nombre: string } })[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<TokensResponse> {
    const usuario = await this.cargarUsuarioConMembresias({ email });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (usuario.membresias.length === 0) {
      throw new UnauthorizedException('Tu usuario no tiene cuentas asignadas — pedile al ingeniero que te dé acceso');
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Credenciales inválidas');

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    // Cuenta default: la legacy cuenta_id si tiene membresía activa, sino la primera
    const cuentaInicial =
      usuario.membresias.find((m) => m.cuentaId === usuario.cuentaId) ?? usuario.membresias[0];

    return this.generarTokens(this.armarUsuarioActual(usuario, cuentaInicial.cuentaId));
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

    const usuario = await this.cargarUsuarioConMembresias({ id: payload.sub });
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Usuario no encontrado');

    const membresia = usuario.membresias.find((m) => m.cuentaId === payload.cuentaActivaId);
    if (!membresia) throw new UnauthorizedException('Sin acceso a esa cuenta');

    return this.generarTokens(this.armarUsuarioActual(usuario, membresia.cuentaId));
  }

  async switchCuenta(usuarioId: string, nuevaCuentaId: string): Promise<TokensResponse> {
    const usuario = await this.cargarUsuarioConMembresias({ id: usuarioId });
    if (!usuario || !usuario.activo) throw new UnauthorizedException('Usuario no encontrado');

    const membresia = usuario.membresias.find((m) => m.cuentaId === nuevaCuentaId);
    if (!membresia) throw new ForbiddenException('No tenés acceso a esa cuenta');

    return this.generarTokens(this.armarUsuarioActual(usuario, nuevaCuentaId));
  }

  async registrar(dto: RegistroDto): Promise<TokensResponse> {
    const emailLower = dto.email.toLowerCase();
    const existente = await this.prisma.usuario.findUnique({ where: { email: emailLower } });
    if (existente) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await this.generarHash(dto.password);
    const { usuarioId, cuentaId } = await this.prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuenta.create({
        data: {
          nombre: dto.nombreCuenta,
          emailContacto: dto.emailContacto,
          telefono: dto.telefono,
        },
      });
      const u = await tx.usuario.create({
        data: {
          cuentaId: cuenta.id,
          email: emailLower,
          passwordHash,
          nombre: dto.nombre,
          rolGlobal: 'ingeniero',
        },
      });
      await tx.usuarioCuenta.create({
        data: {
          usuarioId: u.id,
          cuentaId: cuenta.id,
          rol: RolEnCuenta.ingeniero,
        },
      });
      return { usuarioId: u.id, cuentaId: cuenta.id };
    });

    const usuario = await this.cargarUsuarioConMembresias({ id: usuarioId });
    if (!usuario) throw new UnauthorizedException('Registro falló');
    return this.generarTokens(this.armarUsuarioActual(usuario, cuentaId));
  }

  async actualizarPerfil(usuarioId: string, dto: ActualizarPerfilDto) {
    if (dto.email) {
      const existente = await this.prisma.usuario.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: usuarioId } },
      });
      if (existente) throw new ConflictException('Ya existe un usuario con ese email');
    }
    const actualizado = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
      },
    });
    return {
      id: actualizado.id,
      email: actualizado.email,
      nombre: actualizado.nombre,
      cuentaId: actualizado.cuentaId,
    };
  }

  async cambiarPassword(usuarioId: string, passwordActual: string, passwordNueva: string): Promise<{ ok: true }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new BadRequestException('Usuario no encontrado');
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) throw new UnauthorizedException('La contraseña actual es incorrecta');
    const passwordHash = await this.generarHash(passwordNueva);
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
    return { ok: true };
  }

  async generarHash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async cargarUsuarioConMembresias(
    where: { email: string } | { id: string },
  ): Promise<UsuarioConMembresias | null> {
    return this.prisma.usuario.findUnique({
      where: where as { email: string },
      include: {
        membresias: {
          where: { activo: true },
          include: { cuenta: { select: { id: true, nombre: true, activo: true } } },
        },
      },
    }) as Promise<UsuarioConMembresias | null>;
  }

  private armarUsuarioActual(usuario: UsuarioConMembresias, cuentaActivaId: string): UsuarioActual {
    const activa = usuario.membresias.find((m) => m.cuentaId === cuentaActivaId);
    if (!activa) throw new UnauthorizedException('Sin acceso a esa cuenta');
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rolGlobal: usuario.rolGlobal,
      cuentaId: activa.cuentaId,
      rolEnCuentaActiva: activa.rol,
      membresias: usuario.membresias.map((m) => ({
        cuentaId: m.cuentaId,
        cuentaNombre: m.cuenta.nombre,
        rol: m.rol,
      })),
    };
  }

  private async generarTokens(usuario: UsuarioActual): Promise<TokensResponse> {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      cuentaActivaId: usuario.cuentaId,
    };
    const accessExpiresIn = (this.config.get<string>('jwt.accessExpiresIn') ?? '30m') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const refreshExpiresIn = (this.config.get<string>('jwt.refreshExpiresIn') ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd'}`;
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessExpiresIn });
    const refreshToken = await this.jwt.signAsync(payload, { expiresIn: refreshExpiresIn });
    return { accessToken, refreshToken, usuario };
  }
}
// type-import only re-exported to satisfy linter (Cuenta usado en type)
export type { Cuenta };
