import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import type { CrearCuentaDto } from './dto/admin.dto';

/// Operaciones de superadmin sobre Cuentas (organizaciones).
/// Stubs por ahora — la lógica real se completa en la próxima iteración.
@Injectable()
export class CuentasAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async listar() {
    throw new NotImplementedException('TODO: listar cuentas con métricas');
  }

  async crear(_dto: CrearCuentaDto) {
    throw new NotImplementedException('TODO: crear cuenta + invitar ingeniero por email');
  }

  async detalle(_id: string) {
    throw new NotImplementedException('TODO: detalle de cuenta con usuarios y métricas');
  }

  async activar(_id: string) {
    throw new NotImplementedException('TODO: activar cuenta');
  }

  async desactivar(_id: string) {
    throw new NotImplementedException('TODO: desactivar cuenta (soft delete)');
  }
}
