import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/// Stub del servicio de email. Hoy solo loguea por consola — todavía no hay proveedor real
/// configurado. Cuando definamos Resend / SendGrid / SMTP, este service pasa a hacer el envío
/// y el resto del código no cambia.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async enviarInvitacion(params: {
    to: string;
    nombre: string;
    cuentaNombre: string;
    linkActivacion: string;
  }): Promise<void> {
    // TODO: integrar proveedor real (Resend, SendGrid, SMTP). Mientras tanto, log.
    this.logger.warn(
      `[EMAIL STUB] Invitación a ${params.to} (${params.nombre}) para "${params.cuentaNombre}" → ${params.linkActivacion}`,
    );
  }

  async enviarRecuperacion(params: { to: string; linkReset: string }): Promise<void> {
    this.logger.warn(`[EMAIL STUB] Reset de password para ${params.to} → ${params.linkReset}`);
  }
}
