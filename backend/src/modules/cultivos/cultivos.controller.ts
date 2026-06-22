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
import { CultivosService } from './cultivos.service';
import { ActualizarCultivoDto, CrearCultivoDto } from './cultivos.dto';
import { paginationSchema, type PaginationQuery } from '../../common/pagination';

@Controller('cultivos')
export class CultivosController {
  constructor(private readonly service: CultivosService) {}

  @Get()
  listar(@Query() query: Record<string, string>) {
    const parsed: PaginationQuery = paginationSchema.parse(query);
    return this.service.listar(parsed);
  }

  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerPorId(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() dto: CrearCultivoDto) {
    return this.service.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarCultivoDto) {
    return this.service.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminar(id);
  }
}
