import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LluviasService } from './lluvias.service';
import {
  ActualizarLluviaDto,
  RegistrarLluviaDto,
  listarLluviasSchema,
  sincronizarSchema,
} from './lluvias.dto';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

@Controller('lluvias')
export class LluviasController {
  constructor(private readonly service: LluviasService) {}

  @Get()
  listar(@Usuario() user: UsuarioActual, @Query() query: Record<string, string>) {
    return this.service.listar(user.cuentaId, listarLluviasSchema.parse(query));
  }

  @Get('resumen')
  resumen(@Usuario() user: UsuarioActual, @Query() query: Record<string, string>) {
    return this.service.resumen(user.cuentaId, listarLluviasSchema.parse(query));
  }

  /** Upsert: idempotente por (fecha, establecimientoId). */
  @Post()
  @HttpCode(HttpStatus.OK)
  registrar(@Usuario() user: UsuarioActual, @Body() dto: RegistrarLluviaDto) {
    return this.service.registrar(user.cuentaId, dto);
  }

  /** Sincronización manual: trae mm de Open-Meteo para los últimos N días
   *  para todos los establecimientos de la cuenta con coordenadas cargadas.
   *  Respeta registros manuales (no los pisa). */
  @Post('sincronizar')
  @HttpCode(HttpStatus.OK)
  async sincronizar(
    @Usuario() user: UsuarioActual,
    @Body() body: { dias?: number } = {},
  ) {
    const { dias } = sincronizarSchema.parse(body);
    const hasta = new Date();
    hasta.setUTCDate(hasta.getUTCDate() - 1); // ayer (Open-Meteo no tiene "hoy" completo)
    const desde = new Date(hasta);
    desde.setUTCDate(desde.getUTCDate() - dias + 1);
    return this.service.sincronizar({
      cuentaId: user.cuentaId,
      desde: desde.toISOString().slice(0, 10),
      hasta: hasta.toISOString().slice(0, 10),
    });
  }

  @Patch(':id')
  actualizar(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarLluviaDto,
  ) {
    return this.service.actualizar(user.cuentaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(user.cuentaId, id);
  }
}
