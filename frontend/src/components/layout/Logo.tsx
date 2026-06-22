import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  variant?: 'light' | 'dark' | 'mono';
  size?: number;
  animated?: boolean;
}

/**
 * Logo AgroFácil — gráfico de barras crecientes (Crecimiento Medible).
 * Recreado como SVG inline para escalar limpio + animar.
 */
export function Logo({ className, variant = 'dark', size = 28, animated = false }: Props) {
  const fill = variant === 'light' ? '#FFFFFF' : variant === 'mono' ? '#0F172A' : '#047C00';
  const bars = [
    { x: 4, h: 9 },
    { x: 11, h: 14 },
    { x: 18, h: 20 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      className={cn('shrink-0', className)}
      aria-label="AgroFacil"
    >
      {bars.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x}
          width={4}
          rx={1.2}
          fill={fill}
          initial={animated ? { y: 24, height: 0 } : false}
          animate={{ y: 24 - b.h, height: b.h }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 18,
            delay: animated ? i * 0.08 : 0,
          }}
        />
      ))}
    </svg>
  );
}
