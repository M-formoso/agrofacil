import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Sheet — bottom-sheet en mobile, dialog centrado en desktop.
 * Basado en Radix Dialog. Estructura:
 *  - Overlay (Radix): fondo oscuro, captura click-outside.
 *  - Wrapper div: posiciona el panel con flexbox (sin transforms).
 *  - Dialog.Content (motion.div): el panel, animado con framer.
 *    Como el posicionamiento es por flex (no por transform), framer-motion
 *    puede animar `y` sin conflictos.
 */
export function Sheet({ open, onOpenChange, title, description, children, className }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>

            {/* Wrapper de posicionamiento — sin pointer-events, sin transforms */}
            <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center pointer-events-none">
              <Dialog.Content
                asChild
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <motion.div
                  className={cn(
                    'pointer-events-auto bg-surface shadow-lift focus:outline-none flex flex-col',
                    'w-full rounded-t-2xl',
                    'lg:w-full lg:max-w-lg lg:max-h-[85vh] lg:rounded-2xl lg:m-4',
                    className,
                  )}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  {/* Handle visual en mobile */}
                  <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted lg:hidden shrink-0" />

                  {(title || description) && (
                    <div className="flex items-start justify-between gap-3 p-5 pb-3 shrink-0">
                      <div className="min-w-0 flex-1">
                        {title && (
                          <Dialog.Title className="text-lg font-bold text-foreground">{title}</Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      <Dialog.Close asChild>
                        <button
                          className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center shrink-0"
                          aria-label="Cerrar"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </Dialog.Close>
                    </div>
                  )}

                  <div className="px-5 pb-5 overflow-y-auto flex-1 max-h-[75vh] lg:max-h-none">
                    {children}
                  </div>

                  <div className="pb-[env(safe-area-inset-bottom)] lg:hidden shrink-0" />
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
