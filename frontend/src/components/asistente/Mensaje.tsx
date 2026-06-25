import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { type Mensaje as MensajeType, urlAdjuntoAbsoluta } from '@/services/asistenteService';
import { cn } from '@/lib/utils';

export function Mensaje({ mensaje }: { mensaje: MensajeType }) {
  const esUser = mensaje.rol === 'user';
  const adjuntos = mensaje.metadata?.adjuntos ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', esUser ? 'justify-end' : 'justify-start')}
    >
      {!esUser && (
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Logo size={18} />
        </div>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 space-y-2',
          esUser ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground',
        )}
      >
        {adjuntos.length > 0 && (
          <div className={cn('grid gap-1.5', adjuntos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
            {adjuntos.map((a) => (
              <a
                key={a.url}
                href={urlAdjuntoAbsoluta(a.url)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg overflow-hidden border border-white/15"
              >
                <img
                  src={urlAdjuntoAbsoluta(a.url)}
                  alt={a.nombre}
                  className="w-full max-h-64 object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        )}

        {mensaje.contenido && (
          esUser ? (
            <p className="whitespace-pre-wrap text-sm">{mensaje.contenido}</p>
          ) : (
            <div className="markdown-asistente text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{mensaje.contenido}</ReactMarkdown>
            </div>
          )
        )}
      </div>

      {esUser && (
        <div className="h-8 w-8 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-foreground" />
        </div>
      )}
    </motion.div>
  );
}
