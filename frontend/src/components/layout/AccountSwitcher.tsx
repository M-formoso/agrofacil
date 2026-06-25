import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const rolLabel: Record<string, string> = {
  ingeniero: 'Ingeniero',
  propietario: 'Propietario',
  operador: 'Operador',
};

interface Props {
  /** Variante visual: clara (sidebar verde) u oscura (móvil sobre fondo blanco). */
  variant?: 'light' | 'dark';
}

export function AccountSwitcher({ variant = 'light' }: Props) {
  const usuario = useAuthStore((s) => s.usuario);
  const setTokens = useAuthStore((s) => s.setTokens);
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const switchMut = useMutation({
    mutationFn: (cuentaId: string) => authService.switchCuenta(cuentaId),
    onSuccess: (res) => {
      setTokens(res.accessToken, res.refreshToken, res.usuario);
      qc.invalidateQueries();
      setAbierto(false);
      toast.success(`Ahora estás en ${res.usuario.nombre}`);
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  if (!usuario) return null;
  const membresias = usuario.membresias ?? [];

  // Si tiene una sola membresía, mostramos sólo el nombre de la cuenta — sin dropdown.
  if (membresias.length <= 1) {
    const cuenta = membresias[0];
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          variant === 'light' ? 'bg-white/10' : 'bg-muted',
        )}
      >
        <Building2 className={cn('h-4 w-4 shrink-0', variant === 'light' ? 'text-white/80' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs uppercase tracking-wider', variant === 'light' ? 'text-white/60' : 'text-muted-foreground')}>
            Cuenta
          </p>
          <p className={cn('text-sm font-medium truncate', variant === 'light' ? 'text-white' : 'text-foreground')}>
            {cuenta?.cuentaNombre ?? usuario.nombre}
          </p>
        </div>
      </div>
    );
  }

  const actual = membresias.find((m) => m.cuentaId === usuario.cuentaId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        disabled={switchMut.isPending}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition text-left',
          variant === 'light' ? 'bg-white/10 hover:bg-white/15' : 'bg-muted hover:bg-muted/80',
        )}
      >
        <Building2 className={cn('h-4 w-4 shrink-0', variant === 'light' ? 'text-white/80' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-[10px] uppercase tracking-wider', variant === 'light' ? 'text-white/60' : 'text-muted-foreground')}>
            Cuenta · {actual ? rolLabel[actual.rol] : ''}
          </p>
          <p className={cn('text-sm font-medium truncate', variant === 'light' ? 'text-white' : 'text-foreground')}>
            {actual?.cuentaNombre ?? '—'}
          </p>
        </div>
        {switchMut.isPending ? (
          <Loader2 className={cn('h-4 w-4 animate-spin', variant === 'light' ? 'text-white' : 'text-foreground')} />
        ) : (
          <ChevronDown className={cn('h-4 w-4 shrink-0', variant === 'light' ? 'text-white/70' : 'text-muted-foreground')} />
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-surface border border-border rounded-lg shadow-lift overflow-hidden"
          >
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Cambiar de cuenta
            </p>
            <div className="max-h-64 overflow-y-auto">
              {membresias.map((m) => {
                const activa = m.cuentaId === usuario.cuentaId;
                return (
                  <button
                    key={m.cuentaId}
                    type="button"
                    onClick={() => !activa && switchMut.mutate(m.cuentaId)}
                    disabled={activa || switchMut.isPending}
                    className={cn(
                      'w-full px-3 py-2 flex items-center gap-2 text-left transition text-sm',
                      activa ? 'bg-primary/5 cursor-default' : 'hover:bg-muted',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground font-medium truncate">{m.cuentaNombre}</p>
                      <p className="text-[11px] text-muted-foreground">{rolLabel[m.rol]}</p>
                    </div>
                    {activa && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
