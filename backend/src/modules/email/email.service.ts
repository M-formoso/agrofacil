import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/// Servicio de envío de email. Usa Resend si está configurada `RESEND_API_KEY`,
/// si no, cae a un stub que loguea — útil en dev sin credenciales.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly replyTo: string | undefined;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('email.resendApiKey');
    this.fromAddress = this.config.get<string>('email.from') ?? 'AgroFácil <onboarding@resend.dev>';
    this.replyTo = this.config.get<string>('email.replyTo') || undefined;
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY no seteada — los mails se loguean en lugar de enviarse.');
    }
  }

  async enviarInvitacion(params: {
    to: string;
    nombre: string;
    cuentaNombre: string;
    linkActivacion: string;
  }): Promise<void> {
    const { to, nombre, cuentaNombre, linkActivacion } = params;
    const subject = `Acceso a AgroFácil — ${cuentaNombre}`;
    const html = plantillaInvitacion({ nombre, cuentaNombre, linkActivacion });
    const text =
      `Hola ${nombre},\n\n` +
      `Te invitamos a acceder a AgroFácil (${cuentaNombre}).\n` +
      `Activá tu cuenta y poné tu contraseña acá: ${linkActivacion}\n\n` +
      `El link vence en 7 días.`;

    await this.enviar({ to, subject, html, text });
  }

  async enviarRecuperacion(params: { to: string; linkReset: string }): Promise<void> {
    const { to, linkReset } = params;
    await this.enviar({
      to,
      subject: 'Recuperar contraseña — AgroFácil',
      html: `<p>Para reiniciar tu contraseña hacé click <a href="${linkReset}">acá</a>.</p>`,
      text: `Para reiniciar tu contraseña entrá a: ${linkReset}`,
    });
  }

  private async enviar(params: { to: string; subject: string; html: string; text: string }) {
    if (!this.resend) {
      this.logger.warn(`[EMAIL STUB] To: ${params.to} | Subject: ${params.subject}`);
      this.logger.warn(`[EMAIL STUB] ${params.text}`);
      return;
    }
    const { data, error } = await this.resend.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
    });
    if (error) {
      this.logger.error({ err: error, to: params.to }, 'Falló el envío con Resend');
      throw new Error(`Resend error: ${error.message}`);
    }
    this.logger.log(`Email enviado a ${params.to} (id=${data?.id})`);
  }
}

function plantillaInvitacion(params: {
  nombre: string;
  cuentaNombre: string;
  linkActivacion: string;
}): string {
  const { nombre, cuentaNombre, linkActivacion } = params;
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background:#F8FAFC; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background:#047C00; padding:24px; text-align:center; color:#FFFFFF;">
                <h1 style="margin:0; font-size:22px;">🚜 AgroFácil</h1>
                <p style="margin:4px 0 0 0; font-size:13px; opacity:.85;">Gestión agropecuaria</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h2 style="margin:0 0 16px 0; font-size:18px; color:#0F172A;">Hola ${escapeHtml(nombre)},</h2>
                <p style="margin:0 0 12px 0; font-size:15px; color:#334155; line-height:1.5;">
                  Te invitamos a acceder a <strong>${escapeHtml(cuentaNombre)}</strong> en AgroFácil.
                </p>
                <p style="margin:0 0 24px 0; font-size:15px; color:#334155; line-height:1.5;">
                  Activá tu cuenta haciendo click acá abajo y definí tu contraseña:
                </p>
                <p style="text-align:center; margin:24px 0;">
                  <a href="${linkActivacion}"
                     style="display:inline-block; background:#047C00; color:#FFFFFF; padding:14px 28px; border-radius:10px; text-decoration:none; font-weight:600; font-size:15px;">
                    Activar mi cuenta
                  </a>
                </p>
                <p style="margin:24px 0 0 0; font-size:13px; color:#64748B; line-height:1.5;">
                  Si el botón no funciona, copiá este link en el navegador:<br/>
                  <span style="word-break:break-all; color:#047C00;">${linkActivacion}</span>
                </p>
                <p style="margin:24px 0 0 0; font-size:12px; color:#94A3B8;">
                  El link es de un solo uso y vence en 7 días.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background:#F8FAFC; text-align:center; font-size:11px; color:#94A3B8;">
                Si no esperabas este email, simplemente ignoralo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
