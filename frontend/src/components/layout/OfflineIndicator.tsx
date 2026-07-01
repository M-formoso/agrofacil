import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudOff, RefreshCw, Loader2, CheckCheck, Trash2, List } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { PendientesSheet } from './PendientesSheet';
import { cn } from '@/lib/utils';

/**
 * Banner flotante inferior que aparece cuando:
 *  - El dispositivo no tiene conexión, o
 *  - Hay operaciones pendientes en la cola offline.
 *
 * Cuando está online + sin pendientes: NO renderiza nada.
 * Muestra contador de pendientes y botón "Sincronizar" cuando hay red.
 */
export function OfflineIndicator() {
  const { online, cantidadPendientes, sincronizando, sincronizarAhora, descartarTodo, pendientes } = useOfflineSync();
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const mostrar = !online || cantidadPendientes > 0;
  // Operaciones "trabadas" — se intentaron muchas veces y no van. Sólo entonces ofrecemos descartar.
  const hayTrabadas = pendientes.some((p) => p.intentos >= 3);

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-30 pointer-events-none"
        >
          <div
            className={cn(
              'pointer-events-auto rounded-xl shadow-lift border p-3 flex items-center gap-3',
              !online
                ? 'bg-warning/95 text-foreground border-warning'
                : 'bg-surface border-border',
            )}
          >
            <div className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
              !online ? 'bg-warning/20' : 'bg-primary/10',
            )}>
              {!online ? (
                <CloudOff className="h-4 w-4" />
              ) : sincronizando ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : cantidadPendientes > 0 ? (
                <RefreshCw className="h-4 w-4 text-primary" />
              ) : (
                <CheckCheck className="h-4 w-4 text-primary" />
              )}
            </div>

            <button
              type="button"
              onClick={() => cantidadPendientes > 0 && setDetalleAbierto(true)}
              disabled={cantidadPendientes === 0}
              className="flex-1 min-w-0 text-left disabled:cursor-default"
            >
              {!online ? (
                <>
                  <p className="font-semibold text-sm">Sin conexión</p>
                  <p className="text-xs opacity-85">
                    {cantidadPendientes > 0
                      ? `${cantidadPendientes} guardado${cantidadPendientes === 1 ? '' : 's'} — tocá para ver.`
                      : 'Lo que cargues ahora se guarda y sincroniza al volver la señal.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-foreground">
                    {cantidadPendientes} {cantidadPendientes === 1 ? 'pendiente' : 'pendientes'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sincronizando
                      ? 'Sincronizando…'
                      : hayTrabadas
                      ? 'No se pudieron enviar. Tocá para ver detalle.'
                      : 'Tocá para ver detalle.'}
                  </p>
                </>
              )}
            </button>

            {online && cantidadPendientes > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setDetalleAbierto(true)}
                  title="Ver detalle"
                  className="px-2 h-9 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-primary/10 hover:text-primary transition inline-flex items-center gap-1"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                {hayTrabadas && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Descartar los ${cantidadPendientes} registros pendientes? No se van a subir al servidor.`)) {
                        descartarTodo();
                      }
                    }}
                    title="Descartar pendientes"
                    className="px-2 h-9 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => sincronizarAhora()}
                  disabled={sincronizando}
                  className="px-3 h-9 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition disabled:opacity-50"
                >
                  Sincronizar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      <PendientesSheet open={detalleAbierto} onClose={() => setDetalleAbierto(false)} />
    </AnimatePresence>
  );
}
