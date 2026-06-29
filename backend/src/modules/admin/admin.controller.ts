import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CuentasAdminService } from './cuentas-admin.service';
import { UsuariosAdminService } from './usuarios-admin.service';
import { SuperAdmin } from '../../common/decorators/super-admin.decorator';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CrearCuentaDto, InvitarUsuarioDto } from './dto/admin.dto';

/// Panel del dueño de la plataforma. TODOS los endpoints requieren rolGlobal=superadmin.
/// Por ahora son stubs — la lógica real se completa en la próxima iteración.
@SuperAdmin()
@UseGuards(SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly cuentas: CuentasAdminService,
    private readonly usuarios: UsuariosAdminService,
  ) {}

  // ===== Cuentas (organizaciones) =====

  @Get('cuentas')
  listarCuentas() {
    return this.cuentas.listar();
  }

  @Post('cuentas')
  @HttpCode(HttpStatus.CREATED)
  crearCuenta(@Body() dto: CrearCuentaDto) {
    return this.cuentas.crear(dto);
  }

  @Get('cuentas/:id')
  detalleCuenta(@Param('id', ParseUUIDPipe) id: string) {
    return this.cuentas.detalle(id);
  }

  @Patch('cuentas/:id/activar')
  @HttpCode(HttpStatus.OK)
  activarCuenta(@Param('id', ParseUUIDPipe) id: string) {
    return this.cuentas.activar(id);
  }

  @Patch('cuentas/:id/desactivar')
  @HttpCode(HttpStatus.OK)
  desactivarCuenta(@Param('id', ParseUUIDPipe) id: string) {
    return this.cuentas.desactivar(id);
  }

  // ===== Usuarios e invitaciones =====

  @Get('usuarios')
  listarUsuarios() {
    return this.usuarios.listar();
  }

  @Post('usuarios/invitar')
  @HttpCode(HttpStatus.CREATED)
  invitarUsuario(@Body() dto: InvitarUsuarioDto) {
    return this.usuarios.invitar(dto);
  }

  @Post('usuarios/:id/reenviar-invitacion')
  @HttpCode(HttpStatus.OK)
  reenviarInvitacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarios.reenviarInvitacion(id);
  }

  @Patch('usuarios/:id/activar')
  @HttpCode(HttpStatus.OK)
  activarUsuario(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarios.activar(id);
  }

  @Patch('usuarios/:id/desactivar')
  @HttpCode(HttpStatus.OK)
  desactivarUsuario(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarios.desactivar(id);
  }
}
