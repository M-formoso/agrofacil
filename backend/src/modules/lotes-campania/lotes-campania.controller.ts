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
import { LotesCampaniaService } from './lotes-campania.service';
import {
  ActualizarLoteCampaniaDto,
  CrearLoteCampaniaDto,
  listarLotesCampaniaSchema,
} from './lotes-campania.dto';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

@Controller('lotes-campania')
export class LotesCampaniaController {
  constructor(private readonly service: LotesCampaniaService) {}

  @Get()
  listar(@Usuario() user: UsuarioActual, @Query() query: Record<string, string>) {
    return this.service.listar(user.cuentaId, listarLotesCampaniaSchema.parse(query));
  }

  @Get(':id')
  obtener(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerPorId(user.cuentaId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Usuario() user: UsuarioActual, @Body() dto: CrearLoteCampaniaDto) {
    return this.service.crear(user.cuentaId, dto);
  }

  @Patch(':id')
  actualizar(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarLoteCampaniaDto,
  ) {
    return this.service.actualizar(user.cuentaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(user.cuentaId, id);
  }
}
