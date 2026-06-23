import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ActualizarLluviaDto,
  ListarLluviasQuery,
  RegistrarLluviaDto,
} from './lluvias.dto';

@Injectable()
export class LluviasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Listado del año (puede filtrar por establecimiento). Ordenado por fecha asc. */
  async listar(cuentaId: string, q: ListarLluviasQuery) {
    const desde = new Date(Date.UTC(q.anio, 0, 1));
    const hasta = new Date(Date.UTC(q.anio + 1, 0, 1));
    const where: Prisma.RegistroLluviaWhereInput = {
      cuentaId,
      activo: true,
      fecha: { gte: desde, lt: hasta },
      ...(q.establecimientoId && { establecimientoId: q.establecimientoId }),
    };
    return this.prisma.registroLluvia.findMany({
      where,
      orderBy: { fecha: 'asc' },
    });
  }

  /** Upsert: si ya existe un registro para (fecha, establecimiento) lo actualiza.
   *  Esto evita duplicados y permite "Toqué de más, corrijo" sin pasos extra. */
  async registrar(cuentaId: string, dto: RegistrarLluviaDto) {
    // Si pasa establecimientoId, validar pertenencia
    if (dto.establecimientoId) {
      const est = await this.prisma.establecimiento.findFirst({
        where: { id: dto.establecimientoId, cuentaId, activo: true },
        select: { id: true },
      });
      if (!est) throw new BadRequestException('Establecimiento no encontrado en esta cuenta');
    }

    const fecha = new Date(`${dto.fecha}T00:00:00.000Z`);
    const existente = await this.prisma.registroLluvia.findFirst({
      where: {
        cuentaId,
        fecha,
        establecimientoId: dto.establecimientoId ?? null,
        activo: true,
      },
    });

    if (existente) {
      return this.prisma.registroLluvia.update({
        where: { id: existente.id },
        data: { mm: dto.mm, nota: dto.nota ?? null },
      });
    }

    return this.prisma.registroLluvia.create({
      data: {
        cuentaId,
        establecimientoId: dto.establecimientoId ?? null,
        fecha,
        mm: dto.mm,
        nota: dto.nota,
      },
    });
  }

  async actualizar(cuentaId: string, id: string, dto: ActualizarLluviaDto) {
    const r = await this.prisma.registroLluvia.findFirst({ where: { id, cuentaId } });
    if (!r) throw new NotFoundException(`Registro ${id} no encontrado`);
    return this.prisma.registroLluvia.update({
      where: { id },
      data: {
        ...(dto.mm !== undefined && { mm: dto.mm }),
        ...(dto.nota !== undefined && { nota: dto.nota }),
      },
    });
  }

  async eliminar(cuentaId: string, id: string) {
    const r = await this.prisma.registroLluvia.findFirst({ where: { id, cuentaId } });
    if (!r) throw new NotFoundException(`Registro ${id} no encontrado`);
    await this.prisma.registroLluvia.update({ where: { id }, data: { activo: false } });
  }

  /**
   * Estadísticas anuales:
   *  - total mm
   *  - días con lluvia (mm > 0)
   *  - máximo en un día
   *  - promedio por día con lluvia
   *  - desglose por mes (12 valores)
   */
  async resumen(cuentaId: string, q: ListarLluviasQuery) {
    const registros = await this.listar(cuentaId, q);

    const porMes: { mes: number; mm: string; dias: number }[] = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      mm: '0.00',
      dias: 0,
    }));

    let total = new Decimal(0);
    let diasConLluvia = 0;
    let maxDia = new Decimal(0);

    for (const r of registros) {
      const mm = new Decimal(r.mm.toString());
      total = total.plus(mm);
      if (mm.gt(0)) {
        diasConLluvia += 1;
        const mes = new Date(r.fecha).getUTCMonth();
        porMes[mes].mm = new Decimal(porMes[mes].mm).plus(mm).toFixed(2);
        porMes[mes].dias += 1;
        if (mm.gt(maxDia)) maxDia = mm;
      }
    }

    const promedioDia = diasConLluvia > 0 ? total.div(diasConLluvia) : new Decimal(0);

    return {
      anio: q.anio,
      establecimientoId: q.establecimientoId ?? null,
      total: total.toFixed(2),
      diasConLluvia,
      maxDia: maxDia.toFixed(2),
      promedioPorDiaConLluvia: promedioDia.toFixed(2),
      porMes,
    };
  }
}
