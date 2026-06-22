import { type ReactNode } from 'react';
import { Drawer } from 'vaul';
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
 * Sheet basado en vaul: bottom-sheet en mobile (drag to dismiss),
 * dialog centrado en desktop. Reemplaza modales aburridos.
 */
export function Sheet({ open, onOpenChange, title, description, children, className }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-lift focus:outline-none',
            'lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:right-auto lg:rounded-2xl lg:w-full lg:max-w-lg',
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted lg:hidden" />
          {(title || description) && (
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                {title && (
                  <Drawer.Title className="text-lg font-bold text-foreground">{title}</Drawer.Title>
                )}
                {description && (
                  <Drawer.Description className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </Drawer.Description>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <div className="px-5 pb-5 lg:pb-5 max-h-[75vh] overflow-y-auto">{children}</div>
          <div className="pb-[env(safe-area-inset-bottom)] lg:hidden" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
