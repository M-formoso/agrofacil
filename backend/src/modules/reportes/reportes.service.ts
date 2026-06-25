import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolEnCuenta } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CalculosService } from '../calculos/calculos.service';
import type { UsuarioActual } from '../../common/types/usuario-actual';
import type { ComentarioReporteDto, CrearReporteDto } from './reportes.dto';

const ROLES_ESCRITURA: RolEnCuenta[] = [RolEnCuenta.ingeniero, RolEnCuenta.operador];

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculos: CalculosService,
  ) {}

  // ---------- LECTURA ----------

  async listarPorCuenta(cuentaId: string) {
    const items = await this.prisma.reporte.findMany({
      where: { cuentaId, activo: true },
      include: {
        autor: { select: { id: true, nombre: true } },
        _count: { select: { comentarios: { where: { activo: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      titulo: r.titulo,
      tokenPublico: r.tokenPublico,
      expiraEn: r.expiraEn,
      autor: r.autor,
      cantidadComentarios: r._count.comentarios,
      createdAt: r.createdAt,
    }));
  }

  async obtenerInterno(cuentaId: string, id: string) {
    const r = await this.prisma.reporte.findFirst({
      where: { id, cuentaId, activo: true },
      include: {
        autor: { select: { id: true, nombre: true } },
        comentarios: {
          where: { activo: true },
          include: { autor: { select: { id: true, nombre: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!r) throw new NotFoundException('Reporte no encontrado');
    return r;
  }

  /** Ruta PÚBLICA — usuario no autenticado. Sólo devuelve si el reporte no expiró. */
  async obtenerPorToken(token: string) {
    const r = await this.prisma.reporte.findFirst({
      where: { tokenPublico: token, activo: true },
      include: { autor: { select: { id: true, nombre: true } } },
    });
    if (!r) throw new NotFoundException('Reporte no encontrado o revocado');
    if (r.expiraEn && r.expiraEn < new Date()) {
      throw new NotFoundException('El link del reporte expiró');
    }
    return {
      id: r.id,
      tipo: r.tipo,
      titulo: r.titulo,
      datosSnapshot: r.datosSnapshot,
      autor: r.autor,
      createdAt: r.createdAt,
    };
  }

  // ---------- ESCRITURA ----------

  async crear(user: UsuarioActual, dto: CrearReporteDto) {
    this.asegurarEscritura(user);

    let titulo = dto.titulo?.trim();
    let datosSnapshot: unknown;

    if (dto.tipo === 'lote_campania') {
      const id = dto.parametros.loteCampaniaId;
      if (!id) throw new BadRequestException('parametros.loteCampaniaId requerido');
      const snap = await this.snapshotLoteCampania(user.cuentaId, id);
      titulo = titulo ?? `${snap.lote.nombre} · ${snap.cultivo.nombre} · ${snap.campania.nombre}`;
      datosSnapshot = snap;
    } else {
      throw new BadRequestException(`Tipo de reporte ${dto.tipo} aún no implementado`);
    }

    const expiraEn = dto.diasValidez
      ? new Date(Date.now() + dto.diasValidez * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.reporte.create({
      data: {
        cuentaId: user.cuentaId,
        autorId: user.id,
        tipo: dto.tipo,
        titulo: titulo!,
        parametros: dto.parametros,
        datosSnapshot: datosSnapshot as object,
        expiraEn,
      },
      include: { autor: { select: { id: true, nombre: true } } },
    });
  }

  async revocar(user: UsuarioActual, id: string) {
    this.asegurarEscritura(user);
    const existente = await this.prisma.reporte.findFirst({
      where: { id, cuentaId: user.cuentaId, activo: true },
      select: { id: true },
    });
    if (!existente) throw new NotFoundException('Reporte no encontrado');
    await this.prisma.reporte.update({ where: { id }, data: { activo: false } });
  }

  // ---------- COMENTARIOS ----------

  async listarComentarios(cuentaId: string, reporteId: string) {
    await this.obtenerInterno(cuentaId, reporteId);
    return this.prisma.comentarioReporte.findMany({
      where: { reporteId, activo: true },
      include: { autor: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async comentar(user: UsuarioActual, reporteId: string, dto: ComentarioReporteDto) {
    // Cualquier miembro autenticado de la cuenta puede comentar — incluido
    // el propietario, que es justamente quien usa este canal.
    await this.obtenerInterno(user.cuentaId, reporteId);
    return this.prisma.comentarioReporte.create({
      data: {
        reporteId,
        autorId: user.id,
        texto: dto.texto.trim(),
      },
      include: { autor: { select: { id: true, nombre: true } } },
    });
  }

  async eliminarComentario(user: UsuarioActual, comentarioId: string) {
    const c = await this.prisma.comentarioReporte.findFirst({
      where: { id: comentarioId, activo: true, reporte: { cuentaId: user.cuentaId } },
      select: { id: true, autorId: true },
    });
    if (!c) throw new NotFoundException('Comentario no encontrado');

    // Sólo el autor o el ingeniero pueden borrar.
    if (c.autorId !== user.id && user.rolEnCuentaActiva !== RolEnCuenta.ingeniero) {
      throw new ForbiddenException('Solo el autor o el ingeniero puede borrar el comentario');
    }
    await this.prisma.comentarioReporte.update({
      where: { id: comentarioId },
      data: { activo: false },
    });
  }

  // ---------- SNAPSHOTS ----------

  /**
   * Arma el snapshot de datos de un lote-campania: info del lote/cultivo/campania,
   * labores e insumos cargados, monitoreos visibles, y el resultado calculado
   * (costos, ingresos, márgenes, punto de equilibrio).
   */
  private async snapshotLoteCampania(cuentaId: string, loteCampaniaId: string) {
    const lc = await this.prisma.loteCampania.findFirst({
      where: { id: loteCampaniaId, cuentaId, activo: true },
      include: {
        lote: { include: { establecimiento: { select: { id: true, nombre: true, ubicacion: true } } } },
        cultivo: { select: { id: true, nombre: true } },
        variedad: { select: { id: true, nombre: true } },
        campania: { select: { id: true, nombre: true, tipo: true } },
        labores: {
          where: { activo: true },
          orderBy: { fecha: 'desc' },
          select: {
            id: true, tipo: true, fecha: true, ejecutor: true,
            costoTotalUsd: true, formaPago: true, nota: true,
          },
        },
        insumosAplicados: {
          where: { activo: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, tipo: true, producto: true, cantidad: true, unidad: true,
            costoTotalUsd: true, formaPago: true,
          },
        },
        monitoreos: {
          where: { activo: true },
          orderBy: { fecha: 'desc' },
          take: 10,
          select: {
            id: true, tipo: true, fecha: true, observaciones: true,
            prescripcion: true, urgencia: true,
            fotos: { select: { url: true } },
          },
        },
      },
    });
    if (!lc) throw new NotFoundException('Lote-campaña no encontrado');

    const resultado = await this.calculos.calcularResultadoLote(cuentaId, loteCampaniaId);

    return {
      lote: { id: lc.lote.id, nombre: lc.lote.nombre, superficieHa: lc.lote.superficieHa.toString() },
      establecimiento: lc.lote.establecimiento,
      cultivo: lc.cultivo,
      variedad: lc.variedad,
      campania: lc.campania,
      loteCampania: {
        id: lc.id,
        superficieSembradaHa: lc.superficieSembradaHa.toString(),
        fechaSiembra: lc.fechaSiembra,
        rindeEstimadoQqHa: lc.rindeEstimadoQqHa?.toString() ?? null,
        rindeRealQqHa: lc.rindeRealQqHa?.toString() ?? null,
        precioGranoUsdTn: lc.precioGranoUsdTn?.toString() ?? null,
        fechaCosecha: lc.fechaCosecha,
      },
      labores: lc.labores.map((l) => ({
        ...l,
        costoTotalUsd: l.costoTotalUsd?.toString() ?? null,
      })),
      insumos: lc.insumosAplicados.map((i) => ({
        ...i,
        cantidad: i.cantidad.toString(),
        costoTotalUsd: i.costoTotalUsd.toString(),
      })),
      monitoreos: lc.monitoreos,
      resultado,
      generadoEn: new Date().toISOString(),
    };
  }

  // ---------- HELPERS ----------

  private asegurarEscritura(user: UsuarioActual): void {
    if (!ROLES_ESCRITURA.includes(user.rolEnCuentaActiva)) {
      throw new ForbiddenException('No tenés permiso para generar reportes');
    }
  }
}
