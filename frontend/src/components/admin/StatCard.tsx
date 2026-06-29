import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  icon: LucideIcon;
  label: string;
  valor: string | number;
  hint?: string;
  /** Color tag para distinguir KPIs. */
  tone?: 'primary' | 'slate' | 'emerald' | 'amber' | 'sky' | 'violet';
  loading?: boolean;
  className?: string;
}

const TONE_BG: Record<NonNullable<Props['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  slate:   'bg-slate-100 text-slate-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  sky:     'bg-sky-100 text-sky-700',
  violet:  'bg-violet-100 text-violet-700',
};

/// KPI card. Mismo lenguaje visual que las cards del cliente:
/// fondo blanco, borde sutil, sombra suave, hover-lift.
export function StatCard({ icon: Icon, label, valor, hint, tone = 'primary', loading, className }: Props) {
  return (
    <div className={cn(
      'bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow',
      className,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="display-number text-2xl sm:text-3xl text-foreground mt-1">
            {loading ? <span className="inline-block h-7 w-16 rounded bg-muted animate-pulse" /> : valor}
          </p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', TONE_BG[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
