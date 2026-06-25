import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Bell, BellOff, Bug, Calendar, Check,
  CloudRain, Droplets, Info, Loader2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { alertasService, type Alerta, type SeveridadAlerta, type TipoAlerta } from '@/services/alertasService';
import { extraerMensajeError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatearFecha } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'light' | 'dark';
}

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

/**
 * Campanita con dropdown. Al hacer click muestra un panel con las
 * últimas alertas — cada una se puede marcar como leída o archivar.
 * El badge muestra el contador de no-leídas, refresca cada 60s.
 */
export function AlertasBadge({ variant = 'light' }: Props) {
  const qc = useQueryClient();
  const rol = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: conteo } = useQuery({
    queryKey: ['alertas-conteo'],
    queryFn: () => alertasService.conteo(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const cantidad = conteo?.noLeidas ?? 0;

  // Solo pedimos las alertas cuando el panel se abre.
  const { data: alertas, isLoading } = useQuery({
    queryKey: ['alertas', 'dropdown'],
    queryFn: () => alertasService.listar(false),
    enabled: abierto,
  });

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto]);

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ['alertas-conteo'] });
    qc.invalidateQueries({ queryKey: ['alertas'] });
  };

  const marcarTodas = useMutation({
    mutationFn: () => alertasService.marcarTodasLeidas(),
    onSuccess: (res) => {
      refrescar();
      if (res.actualizadas > 0) toast.success(`${res.actualizadas} marcadas como leídas`);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const recientes = (alertas ?? []).slice(0, 6);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          'relative h-9 w-9 inline-flex items-center justify-center rounded-lg transition',
          variant === 'light'
            ? 'text-white/85 hover:bg-white/15'
            : 'text-foreground hover:bg-muted border border-border bg-surface',
        )}
        aria-label={cantidad > 0 ? `${cantidad} alerta${cantidad === 1 ? '' : 's'} sin leer` : 'Alertas'}
        aria-expanded={abierto}
      >
        <Bell className="h-4 w-4" />
        {cantidad > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
              variant === 'light' ? 'bg-white text-primary' : 'bg-primary text-primary-foreground',
            )}
          >
            {cantidad > 99 ? '99+' : cantidad}
          </span>
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-32px)] z-50 rounded-xl border border-border bg-surface shadow-lift overflow-hidden"
          >
            {/* Header del dropdown */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Alertas</p>
              {cantidad > 0 && (
                <button
                  onClick={() => marcarTodas.mutate()}
                  disabled={marcarTodas.isPending}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {marcarTodas.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Marcar todas leídas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {[0, 1, 2].map((i) => <div key={i} className="h-16 shimmer rounded-md" />)}
                </div>
              ) : recientes.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <BellOff className="h-7 w-7 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground mt-2">Todo al día</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No tenés alertas pendientes.
                  </p>
                </div>
              ) : (
                <ul>
                  {recientes.map((a) => (
                    <AlertaItem
                      key={a.id}
                      alerta={a}
                      puedeArchivar={rol === 'ingeniero' || rol === 'operador'}
                      onAccion={refrescar}
                      onIrAlContexto={() => setAbierto(false)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <Link
              to="/alertas"
              onClick={() => setAbierto(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary border-t border-border hover:bg-muted/40 transition"
            >
              Ver todas las alertas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertaItem({
  alerta, puedeArchivar, onAccion, onIrAlContexto,
}: {
  alerta: Alerta;
  puedeArchivar: boolean;
  onAccion: () => void;
  onIrAlContexto: () => void;
}) {
  const Icon = ICONO_TIPO[alerta.tipo] ?? Info;
  const link = obtenerLinkContexto(alerta.contexto);

  const marcarLeida = useMutation({
    mutationFn: () => alertasService.marcarLeida(alerta.id),
    onSuccess: onAccion,
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const archivar = useMutation({
    mutationFn: () => alertasService.eliminar(alerta.id),
    onSuccess: () => {
      onAccion();
      toast.success('Alerta archivada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const contenido = (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className={cn('h-8 w-8 rounded-lg border flex items-center justify-center shrink-0', COLOR_SEVERIDAD[alerta.severidad])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {!alerta.leida && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
          <p className={cn('text-sm truncate', alerta.leida ? 'text-muted-foreground' : 'font-semibold text-foreground')}>
            {alerta.titulo}
          </p>
        </div>
        {alerta.detalle && (
          <p className={cn('text-xs mt-0.5 line-clamp-2', alerta.leida ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
            {alerta.detalle}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
          {alerta.severidad === 'critica' && (
            <span className="inline-flex items-center gap-0.5 text-destructive font-semibold uppercase tracking-wider">
              <AlertTriangle className="h-2.5 w-2.5" /> Crítica
            </span>
          )}
          <span>{formatearFecha(alerta.createdAt)}</span>
        </p>
      </div>
    </div>
  );

  return (
    <li className="group border-b border-border last:border-b-0 hover:bg-muted/30 transition">
      <div className="px-4 py-3">
        {link ? (
          <Link to={link} onClick={onIrAlContexto} className="block">
            {contenido}
          </Link>
        ) : (
          contenido
        )}

        <div className="mt-2 flex items-center gap-3 pl-[42px]">
          {!alerta.leida && (
            <button
              onClick={() => marcarLeida.mutate()}
              disabled={marcarLeida.isPending}
              className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
            >
              {marcarLeida.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
              Marcar leída
            </button>
          )}
          {puedeArchivar && (
            <button
              onClick={() => archivar.mutate()}
              disabled={archivar.isPending}
              className="text-[11px] text-destructive hover:underline inline-flex items-center gap-1"
            >
              {archivar.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-2.5 w-2.5" />}
              Archivar
            </button>
          )}
        </div>
      </div>
    </li>
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
