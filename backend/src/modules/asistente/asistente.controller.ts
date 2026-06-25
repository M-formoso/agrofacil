import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdir } from 'fs/promises';

import { AsistenteService } from './asistente.service';
import {
  CrearConversacionDto,
  RenombrarConversacionDto,
} from './asistente.dto';
import { Usuario } from '../../common/decorators/usuario.decorator';
import type { UsuarioActual } from '../../common/types/usuario-actual';

const EXTENSIONES_IMAGEN = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const MAX_IMAGENES = 4;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por archivo

@Controller('asistente/conversaciones')
export class AsistenteController {
  constructor(private readonly service: AsistenteService) {}

  @Get()
  listar(@Usuario() user: UsuarioActual) {
    return this.service.listarConversaciones(user.cuentaId, user.id);
  }

  @Get(':id')
  obtener(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.obtenerConversacion(user.cuentaId, user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Usuario() user: UsuarioActual, @Body() dto: CrearConversacionDto) {
    return this.service.crearConversacion(user.cuentaId, user.id, dto.titulo);
  }

  @Patch(':id')
  renombrar(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenombrarConversacionDto,
  ) {
    return this.service.renombrarConversacion(user.cuentaId, user.id, id, dto.titulo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Usuario() user: UsuarioActual, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.eliminarConversacion(user.cuentaId, user.id, id);
  }

  /**
   * Enviar mensaje. Acepta multipart: campo `contenido` (texto, opcional si
   * hay imágenes) y hasta 4 archivos en el campo `imagenes`. Si la
   * conversación no tiene título, se autogenera.
   */
  @Post(':id/mensajes')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FilesInterceptor('imagenes', MAX_IMAGENES, {
      storage: diskStorage({
        destination: async (_req, _file, cb) => {
          const baseDir = process.env.UPLOADS_DIR ?? './uploads';
          const dir = join(baseDir, 'asistente');
          await mkdir(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!EXTENSIONES_IMAGEN.includes(ext)) {
          return cb(new BadRequestException(`Extensión no permitida: ${ext}`), false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_BYTES, files: MAX_IMAGENES },
    }),
  )
  enviarMensaje(
    @Usuario() user: UsuarioActual,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('contenido') contenido: string | undefined,
    @UploadedFiles() imagenes: Express.Multer.File[] = [],
  ) {
    const texto = (contenido ?? '').trim();
    if (!texto && imagenes.length === 0) {
      throw new BadRequestException('Mandá texto, una imagen, o ambos');
    }
    return this.service.enviarMensaje(user.cuentaId, user.id, id, texto, imagenes);
  }
}
