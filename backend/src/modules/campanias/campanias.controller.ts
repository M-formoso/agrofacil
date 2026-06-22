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
import { CampaniasService } from './campanias.service';
import { ActualizarCampaniaDto, CrearCampaniaDto } from './campanias.dto';
import { paginationSchema } from '../../common/pagination';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

@Controller('campanias')
export class CampaniasController {
  constructor(private readonly service: CampaniasService) {}

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
  crear(@Usuario() user: UsuarioActual, @Body() dto: CrearCampaniaDto) {
    return this.service.crear(user.cuentaId, dto);
  }

  @Patch(':id')
  actualizar(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarCampaniaDto,
  ) {
    return this.service.actualizar(user.cuentaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(user.cuentaId, id);
  }
}
