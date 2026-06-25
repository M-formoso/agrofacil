import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CloudRain, Plus, Sparkles, X, type LucideIcon } from 'lucide-react';

import { useAuthStore } from '@/stores/authStore';
import { MonitoreoSheet } from '@/components/monitoreos/MonitoreoSheet';
import { LluviaRapidaSheet } from '@/components/lluvias/LluviaRapidaSheet';
import { cn } from '@/lib/utils';

type AccionId = 'monitoreo' | 'lluvia' | 'asistente';

interface Accion {
  id: AccionId;
  label: string;
  icon: LucideIcon;
  color: string;
}

const ACCIONES: Accion[] = [
  { id: 'monitoreo', label: 'Nuevo monitoreo', icon: Camera,    color: 'bg-primary text-primary-foreground' },
  { id: 'lluvia',    label: 'Registrar lluvia', icon: CloudRain, color: 'bg-info text-white' },
  { id: 'asistente', label: 'Asistente IA',     icon: Sparkles,  color: 'bg-accent text-white' },
];

/**
 * Botón flotante con expansión radial. Sólo se muestra para usuarios
 * que pueden escribir (ingeniero u operador). El propietario, que es de
 * lectura, no lo ve.
 */
export function Fab() {
  const rolEnCuenta = useAuthStore((s) => s.usuario?.rolEnCuentaActiva);
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [accionActiva, setAccionActiva] = useState<AccionId | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el menú al hacer click afuera
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  // Cerrar el menú al apretar Escape
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [abierto]);

  if (rolEnCuenta !== 'ingeniero' && rolEnCuenta !== 'operador') return null;

  const elegirAccion = (id: AccionId) => {
    setAbierto(false);
    if (id === 'asistente') {
      navigate('/asistente');
      return;
    }
    setAccionActiva(id);
  };

  return (
    <>
      <div
        ref={ref}
        className="fixed bottom-6 right-6 z-40"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Acciones secundarias */}
        <AnimatePresence>
          {abierto && (
            <motion.ul
              key="acciones"
              className="absolute bottom-16 right-0 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {ACCIONES.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 12, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.8 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center justify-end gap-3"
                >
                  <span className="text-sm font-medium text-foreground bg-surface px-3 py-1.5 rounded-md shadow-sm border border-border whitespace-nowrap">
                    {a.label}
                  </span>
                  <button
                    onClick={() => elegirAccion(a.id)}
                    className={cn(
                      'h-12 w-12 rounded-full shadow-lift flex items-center justify-center transition-transform hover:scale-105 active:scale-95',
                      a.color,
                    )}
                    aria-label={a.label}
                  >
                    <a.icon className="h-5 w-5" />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Botón principal */}
        <motion.button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          whileTap={{ scale: 0.92 }}
          className={cn(
            'h-14 w-14 rounded-full shadow-lift flex items-center justify-center transition-colors',
            abierto ? 'bg-surface text-foreground border border-border' : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          )}
          aria-label={abierto ? 'Cerrar atajos' : 'Abrir atajos'}
          aria-expanded={abierto}
        >
          <motion.div animate={{ rotate: abierto ? 45 : 0 }} transition={{ type: 'spring', stiffness: 380, damping: 25 }}>
            {abierto ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </motion.button>
      </div>

      {/* Sheets disparados desde el FAB */}
      <MonitoreoSheet
        open={accionActiva === 'monitoreo'}
        onClose={() => setAccionActiva(null)}
      />
      <LluviaRapidaSheet
        open={accionActiva === 'lluvia'}
        onClose={() => setAccionActiva(null)}
      />
    </>
  );
}
