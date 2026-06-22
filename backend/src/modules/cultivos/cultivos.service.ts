import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calcularSkip, paginar, type PaginationQuery } from '../../common/pagination';
import type { CrearCultivoDto, ActualizarCultivoDto } from './cultivos.dto';

@Injectable()
export class CultivosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(q: PaginationQuery) {
    const where = {
      ...(q.activo !== undefined && { activo: q.activo }),
      ...(q.search && { nombre: { contains: q.search, mode: 'insensitive' as const } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cultivo.findMany({
        where,
        skip: calcularSkip(q.page, q.limit),
        take: q.limit,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.cultivo.count({ where }),
    ]);
    return paginar(items, total, q.page, q.limit);
  }

  async obtenerPorId(id: string) {
    const item = await this.prisma.cultivo.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Cultivo ${id} no encontrado`);
    return item;
  }

  async crear(dto: CrearCultivoDto) {
    const existente = await this.prisma.cultivo.findUnique({ where: { nombre: dto.nombre.toLowerCase() } });
    if (existente) throw new ConflictException(`El cultivo "${dto.nombre}" ya existe`);
    return this.prisma.cultivo.create({ data: { nombre: dto.nombre.toLowerCase() } });
  }

  async actualizar(id: string, dto: ActualizarCultivoDto) {
    await this.obtenerPorId(id);
    return this.prisma.cultivo.update({
      where: { id },
      data: { ...(dto.nombre && { nombre: dto.nombre.toLowerCase() }) },
    });
  }

  async eliminar(id: string) {
    await this.obtenerPorId(id);
    await this.prisma.cultivo.update({ where: { id }, data: { activo: false } });
  }
}
