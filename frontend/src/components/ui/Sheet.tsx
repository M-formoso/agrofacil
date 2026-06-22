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
 * Implementado sobre Radix Dialog (modal robusto que no se cierra con clicks
 * internos como pasaba con vaul). Animado con framer-motion.
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
            <Dialog.Content
              asChild
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                className={cn(
                  // Mobile: bottom-sheet fijo abajo
                  'fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-lift focus:outline-none flex flex-col',
                  // Desktop: dialog centrado
                  'lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:right-auto lg:rounded-2xl lg:w-full lg:max-w-lg lg:max-h-[85vh]',
                  className,
                )}
                initial={{ y: '100%', opacity: 1 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
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
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
