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
import { EstablecimientosService } from './establecimientos.service';
import { ActualizarEstablecimientoDto, CrearEstablecimientoDto } from './establecimientos.dto';
import { paginationSchema } from '../../common/pagination';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

@Controller('establecimientos')
export class EstablecimientosController {
  constructor(private readonly service: EstablecimientosService) {}

  @Get()
  listar(@Usuario() user: UsuarioActual, @Query() query: Record<string, string>) {
    return this.service.listar(user.cuentaId, paginationSchema.parse(query));
  }

  @Get(':id')
  obtener(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerPorId(user.cuentaId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Usuario() user: UsuarioActual, @Body() dto: CrearEstablecimientoDto) {
    return this.service.crear(user.cuentaId, dto);
  }

  @Patch(':id')
  actualizar(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstablecimientoDto,
  ) {
    return this.service.actualizar(user.cuentaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(user.cuentaId, id);
  }
}
