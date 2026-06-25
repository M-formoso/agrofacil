import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Copy, ExternalLink, FileText, Loader2, MessageSquare, Send, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  reportesService,
  urlReportePublico,
  type ReporteResumen,
} from '@/services/reportesService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';
import { formatearFecha } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export function ReportesPage() {
  const qc = useQueryClient();
  const rolEnCuenta = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reportes'],
    queryFn: () => reportesService.listar(),
  });

  const revocar = useMutation({
    mutationFn: (id: string) => reportesService.revocar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reportes'] });
      toast.success('Reporte revocado — el link ya no funciona');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const copiarLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(urlReportePublico(token));
      setCopiado(token);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Resúmenes que ya compartiste</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Reportes</h1>
      </header>

      <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80 leading-relaxed">
        Generá un reporte desde el detalle de un lote-campaña. Cada reporte tiene un link público
        que cualquier persona puede abrir sin loguearse — y un canal interno de comentarios para
        que el propietario te haga preguntas.
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin reportes todavía"
          description="Entrá a la pantalla de un lote-campaña y tocá “Compartir reporte” para crear el primero."
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {data.map((r, i) => (
              <ReporteRow
                key={r.id}
                reporte={r}
                index={i}
                expandido={expandido === r.id}
                copiado={copiado === r.tokenPublico}
                onToggle={() => setExpandido(expandido === r.id ? null : r.id)}
                onCopiar={() => copiarLink(r.tokenPublico)}
                onRevocar={
                  rolEnCuenta === 'ingeniero' || rolEnCuenta === 'operador'
                    ? () => {
                        if (confirm('¿Revocar este link? Quien lo tenga ya no podrá abrirlo.')) {
                          revocar.mutate(r.id);
                        }
                      }
                    : undefined
                }
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function ReporteRow({
  reporte, index, expandido, copiado, onToggle, onCopiar, onRevocar,
}: {
  reporte: ReporteResumen;
  index: number;
  expandido: boolean;
  copiado: boolean;
  onToggle: () => void;
  onCopiar: () => void;
  onRevocar?: () => void;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.025 }}
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      <div className="p-4 flex items-center gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate">{reporte.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {reporte.autor.nombre} · {formatearFecha(reporte.createdAt)}
            {reporte.expiraEn && ` · expira ${formatearFecha(reporte.expiraEn)}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCopiar}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface hover:bg-muted text-xs font-medium transition"
            title="Copiar link"
          >
            {copiado ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? 'Copiado' : 'Copiar link'}
          </button>
          <Link
            to={`/r/${reporte.tokenPublico}`}
            target="_blank"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-surface hover:bg-muted transition"
            aria-label="Abrir"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface hover:bg-muted text-xs font-medium transition"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {reporte.cantidadComentarios}
          </button>
          {onRevocar && (
            <button
              onClick={onRevocar}
              className="h-8 w-8 rounded-md border border-border bg-surface hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition"
              aria-label="Revocar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-border bg-muted/20 overflow-hidden"
          >
            <ComentariosPanel reporteId={reporte.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function ComentariosPanel({ reporteId }: { reporteId: string }) {
  const qc = useQueryClient();
  const usuarioId = useAuthStore((s) => s.usuario?.id);
  const rol = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const [texto, setTexto] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reporte-comentarios', reporteId],
    queryFn: () => reportesService.comentarios(reporteId),
  });

  const comentar = useMutation({
    mutationFn: (t: string) => reportesService.comentar(reporteId, t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reporte-comentarios', reporteId] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
      setTexto('');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => reportesService.eliminarComentario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reporte-comentarios', reporteId] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="p-4 space-y-3">
      {isLoading ? (
        <div className="h-12 shimmer rounded-md" />
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sin comentarios todavía.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((c) => {
            const puedeBorrar = c.autorId === usuarioId || rol === 'ingeniero';
            return (
              <li key={c.id} className="rounded-lg bg-surface border border-border p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                      {c.autor.nombre}
                    </p>
                    <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{c.texto}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatearFecha(c.createdAt)}
                    </p>
                  </div>
                  {puedeBorrar && (
                    <button
                      onClick={() => {
                        if (confirm('¿Borrar comentario?')) eliminar.mutate(c.id);
                      }}
                      className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      aria-label="Borrar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = texto.trim();
          if (!t) return;
          comentar.mutate(t);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un comentario..."
          rows={2}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!texto.trim() || comentar.isPending}
          className={cn('shrink-0')}
        >
          {comentar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Enviar
        </Button>
      </form>
    </div>
  );
}
