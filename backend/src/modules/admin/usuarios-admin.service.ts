import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import type { InvitarUsuarioDto } from './dto/admin.dto';

/// Operaciones de superadmin sobre Usuarios e invitaciones.
/// Stubs por ahora.
@Injectable()
export class UsuariosAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async listar() {
    throw new NotImplementedException('TODO: listar usuarios globales con sus membresías');
  }

  async invitar(_dto: InvitarUsuarioDto) {
    throw new NotImplementedException('TODO: crear usuario + UsuarioCuenta + mandar magic link');
  }

  async reenviarInvitacion(_usuarioId: string) {
    throw new NotImplementedException('TODO: regenerar token y reenviar email de activación');
  }

  async activar(_usuarioId: string) {
    throw new NotImplementedException('TODO: activar usuario');
  }

  async desactivar(_usuarioId: string) {
    throw new NotImplementedException('TODO: desactivar usuario');
  }
}
