import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, BellOff, Bug, Calendar, CloudRain,
  Droplets, Info, Loader2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { alertasService, type Alerta, type SeveridadAlerta, type TipoAlerta } from '@/services/alertasService';
import { extraerMensajeError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatearFecha } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const ICONO_TIPO: Record<TipoAlerta, typeof Bell> = {
  clima: CloudRain,
  agua: Droplets,
  plaga: Bug,
  vencimiento: Calendar,
  general: Info,
};

const COLOR_SEVERIDAD: Record<SeveridadAlerta, string> = {
  info: 'bg-info/10 text-info border-info/30',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  critica: 'bg-rose-100 text-rose-700 border-rose-200',
};

const LABEL_TIPO: Record<TipoAlerta, string> = {
  clima: 'Clima',
  agua: 'Agua',
  plaga: 'Plaga',
  vencimiento: 'Vencimiento',
  general: 'General',
};

export function AlertasPage() {
  const qc = useQueryClient();
  const rol = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const [filtro, setFiltro] = useState<'todas' | 'no-leidas'>('no-leidas');

  const { data, isLoading } = useQuery({
    queryKey: ['alertas', filtro],
    queryFn: () => alertasService.listar(filtro === 'no-leidas'),
  });

  const marcarTodas = useMutation({
    mutationFn: () => alertasService.marcarTodasLeidas(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alertas-conteo'] });
      if (res.actualizadas > 0) toast.success(`${res.actualizadas} marcadas como leídas`);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const noLeidas = data?.filter((a) => !a.leida).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Lo que está pidiendo tu atención</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Alertas</h1>
        </div>
        {noLeidas > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => marcarTodas.mutate()}
            disabled={marcarTodas.isPending}
          >
            {marcarTodas.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Marcar todas como leídas
          </Button>
        )}
      </header>

      {/* Filtro */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit">
        {(['no-leidas', 'todas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition',
              filtro === f
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {f === 'no-leidas' ? 'No leídas' : 'Todas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={filtro === 'no-leidas' ? BellOff : Bell}
          title={filtro === 'no-leidas' ? 'Todo al día' : 'Sin alertas'}
          description={
            filtro === 'no-leidas'
              ? 'No tenés alertas pendientes. ¡Buen trabajo!'
              : 'Cuando empiecen a llegar alertas, aparecerán acá.'
          }
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {data.map((a, i) => (
              <AlertaRow
                key={a.id}
                alerta={a}
                index={i}
                puedeEliminar={rol === 'ingeniero' || rol === 'operador'}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function AlertaRow({
  alerta, index, puedeEliminar,
}: {
  alerta: Alerta;
  index: number;
  puedeEliminar: boolean;
}) {
  const qc = useQueryClient();
  const Icon = ICONO_TIPO[alerta.tipo] ?? Info;

  const marcarLeida = useMutation({
    mutationFn: () => alertasService.marcarLeida(alerta.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alertas-conteo'] });
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: () => alertasService.eliminar(alerta.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      qc.invalidateQueries({ queryKey: ['alertas-conteo'] });
      toast.success('Alerta eliminada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  // Drilldown: si el contexto tiene loteCampaniaId o monitoreoId, generar link.
  const contextoLink = obtenerLinkContexto(alerta.contexto);

  const cuerpo = (
    <div className="flex items-start gap-3 flex-wrap">
      <div className={cn('h-9 w-9 rounded-lg border flex items-center justify-center shrink-0', COLOR_SEVERIDAD[alerta.severidad])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
            {LABEL_TIPO[alerta.tipo]}
          </span>
          {alerta.severidad === 'critica' && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" /> Crítica
            </span>
          )}
          {!alerta.leida && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="No leída" />
          )}
          <span className="text-xs text-muted-foreground">{formatearFecha(alerta.createdAt)}</span>
        </div>
        <p className={cn('text-sm font-semibold mt-0.5', alerta.leida ? 'text-muted-foreground' : 'text-foreground')}>
          {alerta.titulo}
        </p>
        {alerta.detalle && (
          <p className={cn('text-sm mt-1 whitespace-pre-line', alerta.leida ? 'text-muted-foreground' : 'text-foreground')}>
            {alerta.detalle}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.025 }}
      className={cn(
        'rounded-xl border p-4 transition group',
        alerta.leida ? 'bg-muted/30 border-border' : 'bg-surface border-primary/20 shadow-sm',
      )}
    >
      {contextoLink ? (
        <Link to={contextoLink} className="block hover:opacity-90 transition">
          {cuerpo}
        </Link>
      ) : cuerpo}

      <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
        {!alerta.leida && (
          <button
            onClick={() => marcarLeida.mutate()}
            disabled={marcarLeida.isPending}
            className="text-xs text-primary hover:underline"
          >
            Marcar leída
          </button>
        )}
        {puedeEliminar && (
          <button
            onClick={() => {
              if (confirm('¿Eliminar esta alerta?')) eliminar.mutate();
            }}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" /> Eliminar
          </button>
        )}
      </div>
    </motion.li>
  );
}

function obtenerLinkContexto(contexto: Record<string, unknown> | null): string | null {
  if (!contexto) return null;
  const lcId = contexto.loteCampaniaId;
  if (typeof lcId === 'string') return `/lotes-campania/${lcId}`;
  const loteId = contexto.loteId;
  if (typeof loteId === 'string') return `/lotes/${loteId}`;
  const estId = contexto.establecimientoId;
  if (typeof estId === 'string') return `/establecimientos/${estId}`;
  return null;
}
