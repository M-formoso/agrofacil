import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrigenLluvia, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { ClimaService } from '../clima/clima.service';
import type {
  ActualizarLluviaDto,
  ListarLluviasQuery,
  RegistrarLluviaDto,
} from './lluvias.dto';

export interface ResultadoSync {
  procesados: number;
  creados: number;
  actualizados: number;
  saltadosPorManual: number;
  errores: number;
}

@Injectable()
export class LluviasService {
  private readonly logger = new Logger(LluviasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly climaService: ClimaService,
  ) {}

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

  /** Upsert manual: si ya existe lo actualiza marcándolo como 'manual'.
   *  Carga del productor → siempre tiene prioridad sobre datos automáticos. */
  async registrar(cuentaId: string, dto: RegistrarLluviaDto) {
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
        data: { mm: dto.mm, nota: dto.nota ?? null, origen: OrigenLluvia.manual },
      });
    }

    return this.prisma.registroLluvia.create({
      data: {
        cuentaId,
        establecimientoId: dto.establecimientoId ?? null,
        fecha,
        mm: dto.mm,
        nota: dto.nota,
        origen: OrigenLluvia.manual,
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
        // Cualquier toque manual eleva el origen
        origen: OrigenLluvia.manual,
      },
    });
  }

  async eliminar(cuentaId: string, id: string) {
    const r = await this.prisma.registroLluvia.findFirst({ where: { id, cuentaId } });
    if (!r) throw new NotFoundException(`Registro ${id} no encontrado`);
    await this.prisma.registroLluvia.update({ where: { id }, data: { activo: false } });
  }

  /** Estadísticas anuales. */
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

  // ============================================================
  // SINCRONIZACIÓN CON OPEN-METEO
  // ============================================================

  /**
   * Sincroniza los mm de Open-Meteo a la BD para todos los establecimientos
   * con coordenadas cargadas. Si pasa cuentaId, restringe a esa cuenta.
   *
   * Reglas:
   *  - Si ya hay un registro con origen='manual' para ese día y campo → NO se
   *    pisa (el productor mandó).
   *  - Si hay un registro con origen='open_meteo' → se actualiza.
   *  - Si no existe → se crea con origen='open_meteo'.
   */
  async sincronizar(params: {
    cuentaId?: string;
    desde: string;
    hasta: string;
  }): Promise<ResultadoSync> {
    const establecimientos = await this.prisma.establecimiento.findMany({
      where: {
        activo: true,
        latitud: { not: null },
        longitud: { not: null },
        ...(params.cuentaId && { cuentaId: params.cuentaId }),
      },
      select: { id: true, cuentaId: true, latitud: true, longitud: true, nombre: true },
    });

    let creados = 0;
    let actualizados = 0;
    let saltadosPorManual = 0;
    let errores = 0;

    for (const est of establecimientos) {
      try {
        const lat = Number(est.latitud);
        const lon = Number(est.longitud);
        const datos = await this.climaService.historico(lat, lon, params.desde, params.hasta);

        for (const dia of datos.dias) {
          const fecha = new Date(`${dia.fecha}T00:00:00.000Z`);
          const existente = await this.prisma.registroLluvia.findFirst({
            where: {
              cuentaId: est.cuentaId,
              establecimientoId: est.id,
              fecha,
              activo: true,
            },
          });

          if (existente?.origen === OrigenLluvia.manual) {
            saltadosPorManual += 1;
            continue;
          }

          if (existente) {
            await this.prisma.registroLluvia.update({
              where: { id: existente.id },
              data: { mm: dia.lluvia, origen: OrigenLluvia.open_meteo },
            });
            actualizados += 1;
          } else {
            await this.prisma.registroLluvia.create({
              data: {
                cuentaId: est.cuentaId,
                establecimientoId: est.id,
                fecha,
                mm: dia.lluvia,
                origen: OrigenLluvia.open_meteo,
              },
            });
            creados += 1;
          }
        }
      } catch (err) {
        this.logger.error(
          `Error sincronizando establecimiento ${est.id} (${est.nombre}): ${(err as Error).message}`,
        );
        errores += 1;
      }
    }

    return {
      procesados: establecimientos.length,
      creados,
      actualizados,
      saltadosPorManual,
      errores,
    };
  }

  /** Cron: corre todos los días a las 06:00 hora ARG y sincroniza el día anterior
   *  para TODOS los establecimientos con coordenadas. */
  @Cron('0 6 * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
  async cronSincronizarAyer(): Promise<void> {
    const ayer = new Date();
    ayer.setUTCDate(ayer.getUTCDate() - 1);
    const ayerIso = ayer.toISOString().slice(0, 10);
    this.logger.log(`Cron sync Open-Meteo: ${ayerIso}`);
    const r = await this.sincronizar({ desde: ayerIso, hasta: ayerIso });
    this.logger.log(
      `Sync completado: procesados=${r.procesados} creados=${r.creados} actualizados=${r.actualizados} manuales=${r.saltadosPorManual} errores=${r.errores}`,
    );
  }
}
