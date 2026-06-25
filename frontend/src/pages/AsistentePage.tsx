import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquarePlus, Trash2, Loader2, ArrowUp, Sparkles, BarChart3,
  CloudRain, Calculator, Wheat, Image as ImageIcon, Mic, MicOff, Sprout, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { asistenteService, type Conversacion, type Mensaje as MensajeType } from '@/services/asistenteService';
import { lotesCampaniaService } from '@/services/lotesCampaniaService';
import { extraerMensajeError } from '@/lib/apiClient';
import { Mensaje } from '@/components/asistente/Mensaje';
import { Logo } from '@/components/layout/Logo';
import { useDictado } from '@/hooks/useDictado';
import { cn } from '@/lib/utils';

const MAX_IMAGENES = 4;
const MAX_BYTES = 8 * 1024 * 1024;

const PROMPTS_SUGERIDOS = [
  { icon: Calculator,  texto: '¿Cuál es el margen neto del lote 4?' },
  { icon: CloudRain,   texto: '¿Cuánto llovió en los últimos 30 días?' },
  { icon: Wheat,       texto: '¿Qué cultivo está dando mejor resultado esta campaña?' },
  { icon: BarChart3,   texto: 'Resumime la campaña actual en 3 puntos clave.' },
];

export function AsistentePage() {
  const qc = useQueryClient();
  const [conversacionId, setConversacionId] = useState<string | null>(null);

  const { data: conversaciones } = useQuery({
    queryKey: ['asistente-conversaciones'],
    queryFn: () => asistenteService.listar(),
  });

  const { data: conversacionActiva } = useQuery({
    queryKey: ['asistente-conversacion', conversacionId],
    queryFn: () => asistenteService.obtener(conversacionId!),
    enabled: !!conversacionId,
  });

  const crearConv = useMutation({
    mutationFn: () => asistenteService.crear(),
    onSuccess: (nueva) => {
      qc.invalidateQueries({ queryKey: ['asistente-conversaciones'] });
      setConversacionId(nueva.id);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const eliminarConv = useMutation({
    mutationFn: (id: string) => asistenteService.eliminar(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['asistente-conversaciones'] });
      if (id === conversacionId) setConversacionId(null);
      toast.success('Conversación eliminada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  // Si no hay conversación activa y hay conversaciones, agarrar la primera
  useEffect(() => {
    if (!conversacionId && conversaciones && conversaciones.length > 0) {
      setConversacionId(conversaciones[0].id);
    }
  }, [conversaciones, conversacionId]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
      {/* Sidebar de conversaciones */}
      <aside className="lg:w-72 shrink-0 bg-surface border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <Button
            onClick={() => crearConv.mutate()}
            disabled={crearConv.isPending}
            className="w-full"
          >
            {crearConv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
            Nueva conversación
          </Button>
        </div>

        <ul className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversaciones?.length === 0 ? (
            <li className="text-xs text-muted-foreground p-3 text-center">
              Sin conversaciones todavía
            </li>
          ) : (
            conversaciones?.map((c) => (
              <ConversacionItem
                key={c.id}
                conv={c}
                activa={c.id === conversacionId}
                onSelect={() => setConversacionId(c.id)}
                onEliminar={() => {
                  if (confirm('¿Eliminar esta conversación?')) eliminarConv.mutate(c.id);
                }}
              />
            ))
          )}
        </ul>
      </aside>

      {/* Área principal del chat */}
      <main className="flex-1 bg-surface border border-border rounded-2xl flex flex-col overflow-hidden min-h-0">
        {conversacionActiva ? (
          <ChatArea
            mensajes={conversacionActiva.mensajes ?? []}
            conversacionId={conversacionActiva.id}
          />
        ) : (
          <EmptyChatState
            haConversaciones={(conversaciones?.length ?? 0) > 0}
            onCrearNueva={() => crearConv.mutate()}
            creando={crearConv.isPending}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================
// Sidebar item
// ============================================================
function ConversacionItem({
  conv,
  activa,
  onSelect,
  onEliminar,
}: {
  conv: Conversacion;
  activa: boolean;
  onSelect: () => void;
  onEliminar: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className={cn(
          'group w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition',
          activa
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted text-foreground',
        )}
      >
        <span className="text-sm truncate flex-1 min-w-0">
          {conv.titulo ?? 'Sin título'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEliminar();
          }}
          aria-label="Eliminar"
          className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </button>
    </li>
  );
}

// ============================================================
// Empty state cuando no hay conversación seleccionada
// ============================================================
function EmptyChatState({
  haConversaciones,
  onCrearNueva,
  creando,
}: {
  haConversaciones: boolean;
  onCrearNueva: () => void;
  creando: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Logo size={36} animated />
        </div>
        <h2 className="text-xl font-bold mt-4 text-foreground">Asistente AgroFácil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Conectado al estado real de tu cuenta: lotes, campañas, costos, lluvias y clima.
        </p>
        <Button
          onClick={onCrearNueva}
          disabled={creando}
          className="mt-6"
        >
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
          {haConversaciones ? 'Empezar nueva conversación' : 'Crear primera conversación'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Chat area — mensajes + input
// ============================================================
function ChatArea({ mensajes, conversacionId }: { mensajes: MensajeType[]; conversacionId: string }) {
  const qc = useQueryClient();
  const [borrador, setBorrador] = useState('');
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [audioPendiente, setAudioPendiente] = useState<Blob | null>(null);
  const [loteCampaniaCtxId, setLoteCampaniaCtxId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dictado = useDictado();
  const ultimoLargoFinal = useRef(0);

  const { data: lotesCampania } = useQuery({
    queryKey: ['lotes-campania', { limit: 100 }],
    queryFn: () => lotesCampaniaService.listar({ limit: 100 }),
  });
  const ctxLote = lotesCampania?.items.find((l) => l.id === loteCampaniaCtxId);

  const enviar = useMutation({
    mutationFn: ({ texto, archivos, audio }: { texto: string; archivos: File[]; audio: Blob | null }) =>
      asistenteService.enviarMensaje(conversacionId, texto, { imagenes: archivos, audio }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asistente-conversacion', conversacionId] });
      qc.invalidateQueries({ queryKey: ['asistente-conversaciones'] });
      setBorrador('');
      setImagenes([]);
      setAudioPendiente(null);
      dictado.resetear();
      ultimoLargoFinal.current = 0;
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, enviar.isPending]);

  // Mientras dictado está activo, ir agregando lo nuevo al borrador
  useEffect(() => {
    if (!dictado.grabando) return;
    const nuevo = dictado.textoEnVivo;
    if (nuevo.length > ultimoLargoFinal.current) {
      const delta = nuevo.slice(ultimoLargoFinal.current);
      setBorrador((prev) => {
        const base = prev.endsWith(' ') || prev === '' ? prev : prev + ' ';
        return base + delta;
      });
      ultimoLargoFinal.current = nuevo.length;
    }
  }, [dictado.textoEnVivo, dictado.grabando]);

  useEffect(() => {
    if (dictado.error) {
      const msg =
        dictado.error === 'not-allowed'
          ? 'Tenés que habilitar el micrófono para grabar.'
          : `Error de mic: ${dictado.error}`;
      toast.error(msg);
    }
  }, [dictado.error]);

  const handleArchivos = (lista: FileList | null) => {
    if (!lista) return;
    const validos: File[] = [];
    for (const f of Array.from(lista)) {
      if (!f.type.startsWith('image/')) {
        toast.error(`"${f.name}" no es una imagen`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" pesa más de 8 MB`);
        continue;
      }
      validos.push(f);
    }
    const total = [...imagenes, ...validos].slice(0, MAX_IMAGENES);
    if (imagenes.length + validos.length > MAX_IMAGENES) {
      toast.error(`Máximo ${MAX_IMAGENES} imágenes`);
    }
    setImagenes(total);
    if (fileRef.current) fileRef.current.value = '';
  };

  const quitarImagen = (i: number) => {
    setImagenes((prev) => prev.filter((_, idx) => idx !== i));
  };

  /** Si está dictando, primero cerramos para capturar el último audio + texto. */
  const cerrarDictadoSiActivo = async (): Promise<{ texto: string; audio: Blob | null }> => {
    if (!dictado.grabando) return { texto: '', audio: audioPendiente };
    const r = await dictado.detener();
    return { texto: r.texto, audio: r.audio };
  };

  const enviarMensaje = async () => {
    if (enviar.isPending) return;
    const finalDictado = await cerrarDictadoSiActivo();

    // Si dictamos por voz y se cerró ahora, el texto puede no estar todavía en el borrador
    // (porque el useEffect aún no corrió). Aseguramos que esté.
    const textoBruto = borrador.trim() || finalDictado.texto;
    const audioFinal = finalDictado.audio ?? audioPendiente;

    // Prepender contexto del lote si está vinculado
    const prefijo = ctxLote
      ? `[Hablando del lote ${ctxLote.lote?.nombre ?? '?'} · ${ctxLote.cultivo?.nombre ?? '?'} · ${ctxLote.campania?.nombre ?? '?'}] `
      : '';
    const texto = (prefijo + textoBruto).trim();

    if (!texto && imagenes.length === 0 && !audioFinal) return;

    enviar.mutate({ texto, archivos: imagenes, audio: audioFinal });
  };

  const toggleDictado = async () => {
    if (dictado.grabando) {
      const r = await dictado.detener();
      if (r.audio) setAudioPendiente(r.audio);
    } else {
      // Si había un audio anterior sin enviar, lo descartamos al re-grabar.
      setAudioPendiente(null);
      ultimoLargoFinal.current = 0;
      await dictado.iniciar();
    }
  };

  const sinMensajes = mensajes.length === 0;

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
        {sinMensajes ? (
          <PromptsIniciales onElegir={(t) => enviar.mutate({ texto: t, archivos: [], audio: null })} disabled={enviar.isPending} />
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {mensajes.map((m) => (
              <Mensaje key={m.id} mensaje={m} />
            ))}
            <AnimatePresence>
              {enviar.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Logo size={18} />
                  </div>
                  <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:120ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:240ms]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 lg:p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Selector de lote-campaña como contexto */}
          {lotesCampania && lotesCampania.items.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Sprout className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={loteCampaniaCtxId ?? ''}
                onChange={(e) => setLoteCampaniaCtxId(e.target.value || null)}
                className="text-xs h-7 px-2 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring max-w-full"
              >
                <option value="">¿Hablamos de algún lote? (opcional)</option>
                {lotesCampania.items.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.lote?.nombre} · {lc.cultivo?.nombre} · {lc.campania?.nombre}
                  </option>
                ))}
              </select>
              {ctxLote && (
                <button
                  type="button"
                  onClick={() => setLoteCampaniaCtxId(null)}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
                >
                  quitar
                </button>
              )}
            </div>
          )}

          {/* Preview de imágenes pendientes */}
          {imagenes.length > 0 && (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {imagenes.map((img, i) => (
                <li key={`${img.name}-${i}`} className="relative shrink-0">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={img.name}
                    className="h-16 w-16 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => quitarImagen(i)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm"
                    aria-label="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Preview del audio grabado pendiente de enviar */}
          {audioPendiente && !dictado.grabando && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5">
              <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
              <audio
                src={URL.createObjectURL(audioPendiente)}
                controls
                className="h-7 flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => setAudioPendiente(null)}
                className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center shrink-0"
                aria-label="Descartar audio"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleArchivos(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={enviar.isPending || imagenes.length >= MAX_IMAGENES}
              className="h-11 w-11 shrink-0 rounded-xl border border-border bg-background hover:bg-muted disabled:opacity-50 inline-flex items-center justify-center transition"
              aria-label="Adjuntar imagen"
              title="Adjuntar imagen"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </button>

            {dictado.soportaGrabacion && (
              <button
                type="button"
                onClick={toggleDictado}
                disabled={enviar.isPending}
                className={cn(
                  'h-11 w-11 shrink-0 rounded-xl inline-flex items-center justify-center transition',
                  dictado.grabando
                    ? 'bg-destructive text-destructive-foreground animate-pulse'
                    : 'border border-border bg-background hover:bg-muted',
                )}
                aria-label={dictado.grabando ? 'Detener dictado' : 'Dictar por voz'}
                title={dictado.grabando ? 'Detener dictado' : 'Dictar por voz'}
              >
                {dictado.grabando
                  ? <MicOff className="h-4 w-4" />
                  : <Mic className="h-4 w-4 text-muted-foreground" />}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
              placeholder={
                dictado.grabando
                  ? 'Escuchando… hablá en español.'
                  : imagenes.length > 0
                    ? 'Contale qué ves en la foto (opcional).'
                    : 'Preguntá algo sobre tu campo, lluvias, márgenes…'
              }
              rows={1}
              className="flex-1 resize-none min-h-[44px] max-h-32 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-surface"
              disabled={enviar.isPending}
            />
            <Button
              onClick={enviarMensaje}
              disabled={(!borrador.trim() && imagenes.length === 0 && !audioPendiente && !dictado.grabando) || enviar.isPending}
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Enviar"
            >
              {enviar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            El asistente lee tus datos reales (lotes, costos, lluvias, clima) e interpreta fotos y dictado de voz.
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Prompts sugeridos
// ============================================================
function PromptsIniciales({
  onElegir,
  disabled,
}: {
  onElegir: (texto: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col justify-center text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-xl font-bold mt-4 text-foreground">¿En qué te ayudo?</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Probá con una de estas o escribí lo que necesites.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto w-full">
        {PROMPTS_SUGERIDOS.map((p) => (
          <button
            key={p.texto}
            onClick={() => onElegir(p.texto)}
            disabled={disabled}
            className="group text-left rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition p-4 disabled:opacity-50"
          >
            <p.icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-sm text-foreground">{p.texto}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
