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
import { ActualizarLluviaDto, RegistrarLluviaDto, listarLluviasSchema } from './lluvias.dto';
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
