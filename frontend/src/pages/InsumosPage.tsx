import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Beaker } from 'lucide-react';
import { insumosAplicadosService } from '@/services/insumosAplicadosService';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatearUsd } from '@/utils/formatters';

const TIPO_COLOR: Record<string, string> = {
  semilla:      '#A8B948',
  fertilizante: '#0F7702',
  herbicida:    '#F2A03C',
  insecticida:  '#DC2626',
  fungicida:    '#3B82F6',
  otro:         '#64748B',
};

export function InsumosPage() {
  const { data } = useQuery({
    queryKey: ['insumos-aplicados', { limit: 100 }],
    queryFn: () => insumosAplicadosService.listar({ limit: 100 }),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Historial completo de aplicaciones</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Insumos aplicados</h1>
      </header>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={Beaker}
          title="Sin aplicaciones registradas"
          description="Los insumos se cargan desde el detalle del lote en campaña."
        />
      ) : (
        <ul className="space-y-2">
          {data.items.map((ins, i) => {
            const color = TIPO_COLOR[ins.tipo] ?? '#047C00';
            return (
              <motion.li
                key={ins.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-xl bg-surface border border-border px-4 py-3 flex items-center gap-4"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{ins.producto}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {ins.tipo} · {Number(ins.cantidad).toLocaleString('es-AR')} {ins.unidad}
                    {ins.formaPago ? ` · pago ${ins.formaPago}` : ''}
                  </p>
                </div>
                <p className="font-bold text-foreground tabular-nums">{formatearUsd(ins.costoTotalUsd)}</p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
