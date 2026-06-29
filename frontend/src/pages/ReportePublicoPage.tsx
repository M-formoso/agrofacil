import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bug, Calendar, ClipboardEdit, Loader2, MapPin, Printer, Sprout } from 'lucide-react';

import { reportesService, type ReportePublico } from '@/services/reportesService';
import { urlFotoAbsoluta } from '@/services/monitoreosService';
import { LogoLockup } from '@/components/layout/Logo';
import { formatearFecha, formatearHa, formatearQqHa, formatearUsd } from '@/utils/formatters';
import { extraerMensajeError } from '@/lib/apiClient';
import type { ResultadoLote } from '@/types/agro';

interface SnapshotLoteCampania {
  lote: { id: string; nombre: string; superficieHa: string };
  establecimiento: { id: string; nombre: string; ubicacion: string | null };
  cultivo: { id: string; nombre: string };
  variedad: { id: string; nombre: string } | null;
  campania: { id: string; nombre: string; tipo: string };
  loteCampania: {
    id: string;
    superficieSembradaHa: string;
    fechaSiembra: string | null;
    rindeEstimadoQqHa: string | null;
    rindeRealQqHa: string | null;
    precioGranoUsdTn: string | null;
    fechaCosecha: string | null;
  };
  labores: Array<{
    id: string;
    tipo: string;
    fecha: string;
    ejecutor: string;
    costoTotalUsd: string | null;
    formaPago: string | null;
    nota: string | null;
  }>;
  insumos: Array<{
    id: string;
    tipo: string;
    producto: string;
    cantidad: string;
    unidad: string;
    costoTotalUsd: string;
    formaPago: string | null;
  }>;
  monitoreos: Array<{
    id: string;
    tipo: string;
    fecha: string;
    observaciones: string;
    prescripcion: string | null;
    urgencia: string;
    fotos: { url: string }[];
  }>;
  resultado: ResultadoLote;
  generadoEn: string;
}

export function ReportePublicoPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reporte-publico', token],
    queryFn: () => reportesService.publico(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground mt-3">No se pudo abrir el reporte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {error ? extraerMensajeError(error) : 'El link puede estar revocado o haber expirado.'}
          </p>
        </div>
      </div>
    );
  }

  if (data.tipo === 'monitoreo') return <ReporteMonitoreo reporte={data} />;
  if (data.tipo === 'cultivo_campania') return <ReporteCultivoCampania reporte={data} />;
  if (data.tipo === 'anual') return <ReporteAnual reporte={data} />;
  return <ReporteLoteCampania reporte={data} />;
}

// ============================================================
// Snapshot types nuevos
// ============================================================
interface SnapshotMonitoreo {
  id: string;
  tipo: string;
  fecha: string;
  urgencia: string;
  observaciones: string;
  prescripcion: string | null;
  latitud: string | null;
  longitud: string | null;
  fotos: { url: string }[];
  autor: { id: string; nombre: string };
  loteCampania: {
    lote: { id: string; nombre: string };
    establecimiento: { id: string; nombre: string };
    cultivo: { id: string; nombre: string };
    campania: { id: string; nombre: string };
  };
  generadoEn: string;
}

interface SnapshotCultivoCampania {
  campania: { id: string; nombre: string };
  cultivo: { id: string; nombre: string };
  totales: {
    lotes: number;
    superficieHa: string;
    ingresoBruto: string;
    costoTotal: string;
    margenNeto: string;
    margenNetoHa: string;
  };
  porLote: Array<{
    loteCampaniaId: string;
    lote: { id: string; nombre: string };
    establecimiento: { id: string; nombre: string };
    superficieHa: string;
    rinde: string;
    rindeFuente: 'real' | 'estimado';
    ingresoBruto: string;
    costoTotal: string;
    margenNeto: string;
    margenNetoHa: string;
  }>;
  generadoEn: string;
}

interface SnapshotAnual {
  anio: number;
  establecimiento: { id: string; nombre: string; ubicacion: string | null } | null;
  totales: {
    lotes: number;
    superficieHa: number;
    ingresoBruto: number;
    costoTotal: number;
    margenNeto: number;
    margenNetoHa: number;
  };
  porCultivo: Array<{
    cultivo: string;
    lotes: number;
    superficieHa: number;
    ingreso: number;
    costo: number;
    margen: number;
  }>;
  detallePorLote: Array<{
    loteCampaniaId: string;
    lote: string;
    establecimiento: string;
    cultivo: string;
    campania: string;
    superficieHa: number;
    ingresoBruto: number;
    costoTotal: number;
    margenNeto: number;
  }>;
  generadoEn: string;
}

function ReporteLoteCampania({ reporte }: { reporte: ReportePublico }) {
  const snap = reporte.datosSnapshot as SnapshotLoteCampania;
  const r = snap.resultado;

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Barra superior — sólo se muestra en pantalla */}
      <div className="print:hidden border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <LogoLockup size={20} />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-4">
        {/* Header */}
        <header className="pb-6 border-b-2 border-primary mb-6">
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">
            Reporte de campaña · {snap.campania.tipo}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1">{reporte.titulo}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5" />
              {snap.cultivo.nombre}
              {snap.variedad && ` · ${snap.variedad.nombre}`}
            </span>
            <span>·</span>
            <span>{formatearHa(snap.loteCampania.superficieSembradaHa)}</span>
            {snap.loteCampania.fechaSiembra && (
              <>
                <span>·</span>
                <span>Sembrado {formatearFecha(snap.loteCampania.fechaSiembra)}</span>
              </>
            )}
          </div>
          {snap.establecimiento && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {snap.establecimiento.nombre}
              {snap.establecimiento.ubicacion && ` · ${snap.establecimiento.ubicacion}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Generado por {reporte.autor.nombre} el {formatearFecha(reporte.createdAt)}
            {r.esProyeccion && ' · Resultado PROYECTADO (sin cosecha confirmada)'}
          </p>
        </header>

        {/* Stats principales */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <BigStat
            label="Ingreso bruto"
            value={formatearUsd(r.ingresoBruto)}
            hint={`${formatearQqHa(r.rinde)} · ${r.rindeFuente}`}
          />
          <BigStat
            label="Costo total"
            value={formatearUsd(r.costos.total)}
            hint={`${formatearUsd(r.costos.totalHa)}/ha`}
          />
          <BigStat
            label={r.esProyeccion ? 'Margen proyectado' : 'Margen neto'}
            value={formatearUsd(r.margenes.neto)}
            hint={`${formatearUsd(r.margenes.netoHa)}/ha`}
            destacado
          />
          <BigStat
            label="Punto de equilibrio"
            value={formatearQqHa(r.puntoEquilibrio.rindeQqHa)}
            hint={`Margen seg. ${formatearQqHa(r.puntoEquilibrio.margenSeguridadQq)}`}
          />
        </section>

        {/* Lectura del punto de equilibrio */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-8">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">Lectura</p>
          <p className="text-sm text-foreground mt-1">{r.puntoEquilibrio.lectura}</p>
        </div>

        {/* Desglose de costos */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Costos</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <Row label="Insumos" valor={formatearUsd(r.costos.insumos)} />
            <Row label="Labores" valor={formatearUsd(r.costos.labores)} />
            <Row label="Subtotal directo" valor={formatearUsd(r.costos.directo)} sub />
            <Row label="Arrendamiento" valor={formatearUsd(r.costos.arrendamiento)} />
            {Number(r.costos.otros) > 0 && (
              <Row label="Otros" valor={formatearUsd(r.costos.otros)} />
            )}
            <Row label="TOTAL" valor={formatearUsd(r.costos.total)} bold />
          </div>
        </section>

        {/* Labores */}
        {snap.labores.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Labores ({snap.labores.length})</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              {snap.labores.map((l, i) => (
                <div
                  key={l.id}
                  className={`px-4 py-3 flex items-start justify-between gap-3 ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">{l.tipo}</p>
                    <p className="text-sm text-foreground">
                      {formatearFecha(l.fecha)} · {l.ejecutor}
                    </p>
                    {l.nota && <p className="text-xs text-muted-foreground">{l.nota}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {l.costoTotalUsd ? formatearUsd(l.costoTotalUsd) : '—'}
                    </p>
                    {l.formaPago && <p className="text-[10px] uppercase text-muted-foreground">{l.formaPago}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Insumos */}
        {snap.insumos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Insumos ({snap.insumos.length})</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              {snap.insumos.map((ins, i) => (
                <div
                  key={ins.id}
                  className={`px-4 py-3 flex items-start justify-between gap-3 ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">{ins.tipo}</p>
                    <p className="text-sm font-medium text-foreground">{ins.producto}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(ins.cantidad).toLocaleString('es-AR')} {ins.unidad}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatearUsd(ins.costoTotalUsd)}</p>
                    {ins.formaPago && <p className="text-[10px] uppercase text-muted-foreground">{ins.formaPago}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Monitoreos */}
        {snap.monitoreos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">
              Últimos monitoreos ({snap.monitoreos.length})
            </h2>
            <ul className="space-y-3">
              {snap.monitoreos.map((m) => (
                <li key={m.id} className="rounded-lg border border-border p-4 break-inside-avoid">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icono tipo={m.tipo} />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {m.tipo.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-muted">
                      {m.urgencia}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatearFecha(m.fecha)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-2 whitespace-pre-line">{m.observaciones}</p>
                  {m.prescripcion && (
                    <p className="text-sm text-foreground mt-2 border-l-2 border-primary pl-3">
                      <strong>A hacer:</strong> {m.prescripcion}
                    </p>
                  )}
                  {m.fotos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {m.fotos.map((f, idx) => (
                        <img
                          key={idx}
                          src={urlFotoAbsoluta(f.url)}
                          alt="Foto monitoreo"
                          className="w-full h-20 object-cover rounded border border-border"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="text-[11px] text-muted-foreground border-t border-border pt-4 mt-12">
          <p>AgroFácil · Generado el {formatearFecha(snap.generadoEn)}</p>
          <p>
            Los datos de este reporte son una foto del momento en que se compartió. Cualquier
            modificación posterior en la cuenta no se refleja acá.
          </p>
        </footer>
      </article>
    </div>
  );
}

function BigStat({
  label, value, hint, destacado,
}: {
  label: string;
  value: string;
  hint?: string;
  destacado?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${destacado ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold tabular-nums mt-1 ${destacado ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function Row({
  label, valor, bold, sub,
}: {
  label: string;
  valor: string;
  bold?: boolean;
  sub?: boolean;
}) {
  return (
    <div className={`px-4 py-2.5 flex items-center justify-between gap-3 border-t border-border first:border-t-0 ${
      sub ? 'bg-muted/30' : ''
    }`}>
      <p className={`text-sm ${bold ? 'font-bold text-foreground' : 'text-foreground'}`}>{label}</p>
      <p className={`text-sm tabular-nums ${bold ? 'font-bold' : ''}`}>{valor}</p>
    </div>
  );
}

function Icono({ tipo }: { tipo: string }) {
  const Icon =
    tipo === 'control_plaga' ? Bug :
    tipo === 'prescripcion' ? ClipboardEdit :
    tipo === 'general' ? Calendar :
    Sprout;
  return <Icon className="h-3.5 w-3.5 text-primary" />;
}

// ============================================================
// Reporte de Monitoreo
// ============================================================
function ReporteMonitoreo({ reporte }: { reporte: ReportePublico }) {
  const snap = reporte.datosSnapshot as SnapshotMonitoreo;
  return (
    <div className="min-h-screen bg-white text-foreground">
      <BarraSuperior />
      <article className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-4">
        <header className="pb-6 border-b-2 border-primary mb-6">
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">
            Reporte de monitoreo · {snap.tipo.replace('_', ' ')}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1">{reporte.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {snap.loteCampania.establecimiento.nombre} · {snap.loteCampania.lote.nombre} ·{' '}
            <span className="capitalize">{snap.loteCampania.cultivo.nombre}</span> · {snap.loteCampania.campania.nombre}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Observado por {snap.autor.nombre} el {formatearFecha(snap.fecha)} · Urgencia <strong className="uppercase">{snap.urgencia}</strong>
          </p>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Observaciones</h2>
          <p className="text-sm whitespace-pre-line">{snap.observaciones}</p>
        </section>

        {snap.prescripcion && (
          <section className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 mb-6">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">A hacer</p>
            <p className="text-sm whitespace-pre-line mt-1">{snap.prescripcion}</p>
          </section>
        )}

        {snap.latitud && snap.longitud && (
          <p className="text-xs text-muted-foreground mb-6 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-primary" />
            {Number(snap.latitud).toFixed(5)}, {Number(snap.longitud).toFixed(5)}
            {' · '}
            <a href={`https://www.google.com/maps?q=${snap.latitud},${snap.longitud}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Ver en Google Maps
            </a>
          </p>
        )}

        {snap.fotos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-3">Fotos ({snap.fotos.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {snap.fotos.map((f, i) => (
                <img
                  key={i}
                  src={urlFotoAbsoluta(f.url)}
                  alt={`Foto ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-md border border-border"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        <FooterPie generadoEn={snap.generadoEn} />
      </article>
    </div>
  );
}

// ============================================================
// Reporte por cultivo en campaña
// ============================================================
function ReporteCultivoCampania({ reporte }: { reporte: ReportePublico }) {
  const snap = reporte.datosSnapshot as SnapshotCultivoCampania;
  return (
    <div className="min-h-screen bg-white text-foreground">
      <BarraSuperior />
      <article className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-4">
        <header className="pb-6 border-b-2 border-primary mb-6">
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">
            Reporte por cultivo
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1 capitalize">
            {snap.cultivo.nombre} · {snap.campania.nombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {snap.totales.lotes} lote(s) · {Number(snap.totales.superficieHa).toFixed(1)} ha sembradas
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <BigStat label="Ingreso bruto" value={formatearUsd(snap.totales.ingresoBruto)} />
          <BigStat label="Costo total" value={formatearUsd(snap.totales.costoTotal)} />
          <BigStat label="Margen neto" value={formatearUsd(snap.totales.margenNeto)} destacado />
          <BigStat label="Margen / ha" value={formatearUsd(snap.totales.margenNetoHa)} />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Por lote</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            {snap.porLote.map((l, i) => (
              <div
                key={l.loteCampaniaId}
                className={`px-4 py-3 flex items-start justify-between gap-3 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{l.lote.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.establecimiento.nombre} · {formatearHa(l.superficieHa)} · {formatearQqHa(l.rinde)} {l.rindeFuente}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">{formatearUsd(l.margenNeto)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatearUsd(l.margenNetoHa)}/ha
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <FooterPie generadoEn={snap.generadoEn} />
      </article>
    </div>
  );
}

// ============================================================
// Reporte anual
// ============================================================
function ReporteAnual({ reporte }: { reporte: ReportePublico }) {
  const snap = reporte.datosSnapshot as SnapshotAnual;
  return (
    <div className="min-h-screen bg-white text-foreground">
      <BarraSuperior />
      <article className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-4">
        <header className="pb-6 border-b-2 border-primary mb-6">
          <p className="text-[11px] uppercase tracking-widest text-primary font-semibold">
            Reporte anual {snap.anio}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-1">{reporte.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {snap.establecimiento ? snap.establecimiento.nombre : 'Todos los campos'} ·{' '}
            {snap.totales.lotes} lote(s) que cruzan el año
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <BigStat label="Superficie" value={`${snap.totales.superficieHa.toFixed(1)} ha`} />
          <BigStat label="Ingreso bruto" value={formatearUsd(snap.totales.ingresoBruto)} />
          <BigStat label="Costo total" value={formatearUsd(snap.totales.costoTotal)} />
          <BigStat label="Margen neto" value={formatearUsd(snap.totales.margenNeto)} destacado />
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-3">Por cultivo</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            {snap.porCultivo.map((c, i) => (
              <div
                key={c.cultivo}
                className={`px-4 py-3 grid grid-cols-4 gap-2 items-center ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <p className="text-sm font-semibold capitalize">{c.cultivo}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {c.lotes} lote(s) · {c.superficieHa.toFixed(0)} ha
                </p>
                <p className="text-xs text-muted-foreground tabular-nums text-right">
                  {formatearUsd(c.ingreso)}
                </p>
                <p className={`text-sm font-bold tabular-nums text-right ${c.margen >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatearUsd(c.margen)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-lg font-bold text-foreground mb-3">
            Detalle por lote ({snap.detallePorLote.length})
          </h2>
          <div className="rounded-lg border border-border overflow-hidden text-sm">
            {snap.detallePorLote.map((l, i) => (
              <div
                key={l.loteCampaniaId}
                className={`px-4 py-2.5 grid grid-cols-12 gap-2 items-center ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="col-span-5 min-w-0">
                  <p className="font-medium truncate">{l.lote}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.establecimiento} · {l.cultivo} · {l.campania}
                  </p>
                </div>
                <p className="col-span-2 text-xs tabular-nums">{l.superficieHa.toFixed(1)} ha</p>
                <p className="col-span-2 text-xs tabular-nums">{formatearUsd(l.costoTotal)}</p>
                <p className="col-span-3 text-xs font-bold tabular-nums text-right">
                  {formatearUsd(l.margenNeto)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <FooterPie generadoEn={snap.generadoEn} />
      </article>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function BarraSuperior() {
  return (
    <div className="print:hidden border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <LogoLockup size={20} />
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
        >
          <Printer className="h-4 w-4" />
          Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}

function FooterPie({ generadoEn }: { generadoEn: string }) {
  return (
    <footer className="text-[11px] text-muted-foreground border-t border-border pt-4 mt-12">
      <p>AgroFácil · Generado el {formatearFecha(generadoEn)}</p>
      <p>Snapshot del momento. Cambios posteriores no se reflejan acá.</p>
    </footer>
  );
}
