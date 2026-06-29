import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import type { InvitarUsuarioDto } from './dto/admin.dto';

const INVITACION_TTL_DIAS = 7;

@Injectable()
export class UsuariosAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async listar() {
    const usuarios = await this.prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        membresias: {
          where: { activo: true },
          include: { cuenta: { select: { id: true, nombre: true } } },
        },
        invitaciones: {
          where: { usadoEn: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rolGlobal: u.rolGlobal,
      activo: u.activo,
      ultimoLogin: u.ultimoLogin,
      createdAt: u.createdAt,
      cuentas: u.membresias.map((m) => ({ id: m.cuenta.id, nombre: m.cuenta.nombre, rol: m.rol })),
      pendienteActivacion: u.ultimoLogin === null && u.invitaciones.length > 0,
    }));
  }

  /// Invita a un usuario a una cuenta existente. Si el email ya existe globalmente,
  /// solo le agregamos la membresía. Si es nuevo, lo creamos con hash sentinela + token.
  async invitar(dto: InvitarUsuarioDto) {
    const cuenta = await this.prisma.cuenta.findUnique({ where: { id: dto.cuentaId } });
    if (!cuenta) throw new NotFoundException('Cuenta no encontrada');

    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { membresias: { where: { cuentaId: dto.cuentaId } } },
    });

    if (existente && existente.membresias.length > 0) {
      throw new ConflictException('Ese usuario ya pertenece a la cuenta');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      let usuario = existente;
      let necesitaActivacion = false;

      if (!usuario) {
        const sentinelHash = await generarHashSentinela();
        usuario = await tx.usuario.create({
          data: {
            cuentaId: dto.cuentaId,
            email: dto.email,
            passwordHash: sentinelHash,
            nombre: dto.nombre,
            rolGlobal: dto.rol === 'propietario' ? 'propietario' : 'ingeniero',
            activo: true,
          },
          include: { membresias: { where: { cuentaId: dto.cuentaId } } },
        });
        necesitaActivacion = true;
      }

      await tx.usuarioCuenta.create({
        data: { usuarioId: usuario.id, cuentaId: dto.cuentaId, rol: dto.rol },
      });

      let token: string | null = null;
      if (necesitaActivacion) {
        token = generarToken();
        await tx.tokenInvitacion.create({
          data: {
            usuarioId: usuario.id,
            token,
            expiraEn: addDias(new Date(), INVITACION_TTL_DIAS),
          },
        });
      }

      return { usuario, token, necesitaActivacion };
    });

    if (resultado.token) {
      const link = `${this.config.get<string>('appPublicUrl')}/activar/${resultado.token}`;
      await this.email.enviarInvitacion({
        to: resultado.usuario.email,
        nombre: resultado.usuario.nombre,
        cuentaNombre: cuenta.nombre,
        linkActivacion: link,
      });
    }

    return {
      usuarioId: resultado.usuario.id,
      necesitaActivacion: resultado.necesitaActivacion,
      invitacionEnviada: !!resultado.token,
    };
  }

  /// Regenera el token de invitación y reenvía el email.
  async reenviarInvitacion(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        membresias: { where: { activo: true }, include: { cuenta: true }, take: 1 },
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.ultimoLogin) {
      throw new ConflictException('El usuario ya activó su cuenta');
    }
    const cuenta = usuario.membresias[0]?.cuenta;
    if (!cuenta) throw new NotFoundException('El usuario no tiene cuenta asignada');

    const token = generarToken();
    await this.prisma.$transaction(async (tx) => {
      // Invalidamos cualquier token pendiente previo marcándolos como usados.
      await tx.tokenInvitacion.updateMany({
        where: { usuarioId, usadoEn: null },
        data: { usadoEn: new Date() },
      });
      await tx.tokenInvitacion.create({
        data: { usuarioId, token, expiraEn: addDias(new Date(), INVITACION_TTL_DIAS) },
      });
    });

    const link = `${this.config.get<string>('appPublicUrl')}/activar/${token}`;
    await this.email.enviarInvitacion({
      to: usuario.email,
      nombre: usuario.nombre,
      cuentaNombre: cuenta.nombre,
      linkActivacion: link,
    });

    return { ok: true };
  }

  async activar(usuarioId: string) {
    const u = await this.prisma.usuario.update({ where: { id: usuarioId }, data: { activo: true } }).catch(() => null);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return { id: u.id, activo: u.activo };
  }

  async desactivar(usuarioId: string) {
    const u = await this.prisma.usuario.update({ where: { id: usuarioId }, data: { activo: false } }).catch(() => null);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return { id: u.id, activo: u.activo };
  }
}

async function generarHashSentinela(): Promise<string> {
  const noise = crypto.randomBytes(48).toString('hex');
  return bcrypt.hash(noise, 12);
}

function generarToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function addDias(d: Date, dias: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + dias);
  return x;
}
