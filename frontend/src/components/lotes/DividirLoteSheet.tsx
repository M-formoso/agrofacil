import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Scissors, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { lotesService } from '@/services/lotesService';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  loteId: string;
  loteNombre: string;
  superficieHa: number;
  onClose: () => void;
}

interface Parte {
  nombre: string;
  superficieHa: string;
}

export function DividirLoteSheet({ open, loteId, loteNombre, superficieHa, onClose }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [partes, setPartes] = useState<Parte[]>([]);
  const [archivarOriginal, setArchivarOriginal] = useState(true);

  // Cuando abre, arrancamos con dos partes iguales sugeridas.
  useEffect(() => {
    if (open) {
      const mitad = (superficieHa / 2).toFixed(2);
      setPartes([
        { nombre: `${loteNombre} Norte`, superficieHa: mitad },
        { nombre: `${loteNombre} Sur`, superficieHa: mitad },
      ]);
      setArchivarOriginal(true);
    }
  }, [open, loteNombre, superficieHa]);

  const sumaPartes = partes.reduce((s, p) => s + (Number(p.superficieHa) || 0), 0);
  const resto = superficieHa - sumaPartes;
  const excede = resto < -0.0001;
  const tieneVacios = partes.some((p) => !p.nombre.trim() || !p.superficieHa || Number(p.superficieHa) <= 0);

  const dividir = useMutation({
    mutationFn: () =>
      lotesService.dividir(loteId, {
        partes: partes.map((p) => ({
          nombre: p.nombre.trim(),
          superficieHa: Number(p.superficieHa),
        })),
        archivarOriginal,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['lotes'] });
      qc.invalidateQueries({ queryKey: ['lote', loteId] });
      qc.invalidateQueries({ queryKey: ['establecimiento'] });
      toast.success(`Lote dividido en ${res.nuevos.length} partes`);
      onClose();
      // Si archivamos el original, navegamos al primer nuevo.
      if (archivarOriginal && res.nuevos[0]) {
        navigate(`/lotes/${res.nuevos[0].id}`);
      }
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const agregarParte = () => {
    if (partes.length >= 20) return;
    setPartes([...partes, { nombre: `${loteNombre} ${partes.length + 1}`, superficieHa: '' }]);
  };

  const quitarParte = (i: number) => {
    if (partes.length <= 2) return;
    setPartes(partes.filter((_, idx) => idx !== i));
  };

  const actualizarParte = (i: number, campo: keyof Parte, valor: string) => {
    setPartes(partes.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Dividir lote"
      description={`Vas a partir "${loteNombre}" (${superficieHa.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ha) en N sub-lotes.`}
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs text-foreground/80 leading-relaxed">
          Los nuevos lotes heredan tenencia y arrendamiento del original. El
          histórico (campañas previas, labores e insumos) queda en el lote
          original — los nuevos arrancan limpios para futuras campañas.
        </div>

        <div className="space-y-2">
          {partes.map((p, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Parte {i + 1}
                </Label>
                <Input
                  placeholder="Nombre"
                  value={p.nombre}
                  onChange={(e) => actualizarParte(i, 'nombre', e.target.value)}
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Hectáreas
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={p.superficieHa}
                  onChange={(e) => actualizarParte(i, 'superficieHa', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => quitarParte(i)}
                disabled={partes.length <= 2}
                className="h-10 w-10 rounded-md hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current flex items-center justify-center shrink-0"
                aria-label="Quitar parte"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={agregarParte}
          disabled={partes.length >= 20}
          className="w-full h-10 rounded-md border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Plus className="h-4 w-4" /> Agregar otra parte
        </button>

        {/* Resumen */}
        <div className={cn(
          'rounded-lg p-3 flex items-center justify-between text-sm',
          excede ? 'bg-destructive/10 text-destructive border border-destructive/30' : 'bg-muted/40 border border-border',
        )}>
          <span>
            Suma de partes: <strong className="tabular-nums">{sumaPartes.toFixed(2)} ha</strong>
          </span>
          <span className="text-xs">
            Resto: <strong className={cn('tabular-nums', resto < 0 && 'text-destructive')}>
              {resto.toFixed(2)} ha
            </strong>
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={archivarOriginal}
            onChange={(e) => setArchivarOriginal(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span className="text-foreground">
            Archivar el lote original (queda como histórico, no se asignan campañas nuevas)
          </span>
        </label>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            type="button"
            onClick={() => dividir.mutate()}
            disabled={dividir.isPending || excede || tieneVacios || partes.length < 2}
          >
            {dividir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
            Dividir
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
