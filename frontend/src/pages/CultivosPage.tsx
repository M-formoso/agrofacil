import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wheat, Loader2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/Sheet';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/EmptyState';
import { cultivosService } from '@/services/cultivosService';
import { variedadesService, type Variedad } from '@/services/variedadesService';
import { extraerMensajeError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import type { Cultivo } from '@/types/agro';

const colorCultivo = (nombre: string) => {
  const map: Record<string, string> = {
    soja: '#A8B948', trigo: '#E8B53D', maíz: '#F2A03C',
    maiz: '#F2A03C', girasol: '#F4D03F', sorgo: '#B8482A',
  };
  return map[nombre.toLowerCase()] ?? '#047C00';
};

export function CultivosPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Cultivo | null>(null);
  const [nombre, setNombre] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['cultivos'],
    queryFn: () => cultivosService.listar({ limit: 100 }),
  });

  const crear = useMutation({
    mutationFn: (n: string) => cultivosService.crear(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivos'] });
      toast.success('Cultivo agregado');
      setNombre('');
      setCreating(false);
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) => cultivosService.actualizar(id, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivos'] });
      toast.success('Cultivo actualizado');
      setEditing(null);
      setNombre('');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => cultivosService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cultivos'] });
      toast.success('Cultivo eliminado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const abrirEditar = (c: Cultivo) => {
    setEditing(c);
    setNombre(c.nombre);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Catálogo compartido por toda la cuenta</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Cultivos</h1>
        </div>
        <Button onClick={() => { setNombre(''); setCreating(true); }}>
          <Plus className="h-4 w-4" /> Nuevo cultivo
        </Button>
      </header>

      {!data || data.items.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="Sin cultivos cargados"
          action={{ label: 'Agregar primer cultivo', onClick: () => setCreating(true) }}
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {data.items.map((c, i) => {
              const color = colorCultivo(c.nombre);
              const isOpen = expandido === c.id;
              return (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.025 }}
                  className="rounded-xl border bg-surface overflow-hidden"
                  style={{ borderColor: isOpen ? color : `${color}33` }}
                >
                  <div
                    className="group flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandido(isOpen ? null : c.id)}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-medium capitalize text-foreground flex-1">{c.nombre}</span>
                    <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); abrirEditar(c); }}
                        className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center"
                        aria-label="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar cultivo "${c.nombre}"?`)) eliminar.mutate(c.id);
                        }}
                        className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {isOpen && (
                    <VariedadesPanel cultivoId={c.id} color={color} />
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Sheet crear/editar cultivo */}
      <Sheet
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); setNombre(''); } }}
        title={editing ? 'Editar cultivo' : 'Nuevo cultivo'}
        description={editing ? 'Cambiá el nombre del cultivo.' : 'Agregá un cultivo al catálogo.'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = nombre.trim();
            if (!trimmed) return;
            if (editing) actualizar.mutate({ id: editing.id, n: trimmed });
            else crear.mutate(trimmed);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="cn">Nombre</Label>
            <Input id="cn" placeholder="Ej: arveja" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => { setCreating(false); setEditing(null); setNombre(''); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending || actualizar.isPending}>
              {(crear.isPending || actualizar.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

// ============================================================
// Panel inline de variedades por cultivo
// ============================================================
function VariedadesPanel({ cultivoId, color }: { cultivoId: string; color: string }) {
  const qc = useQueryClient();
  const [nuevaVariedad, setNuevaVariedad] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');

  const { data: variedades, isLoading } = useQuery({
    queryKey: ['variedades', cultivoId],
    queryFn: () => variedadesService.listar(cultivoId),
  });

  const crear = useMutation({
    mutationFn: (nombre: string) => variedadesService.crear(cultivoId, nombre),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variedades', cultivoId] });
      qc.invalidateQueries({ queryKey: ['variedades'] });
      setNuevaVariedad('');
      toast.success('Variedad agregada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const editar = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) => variedadesService.actualizar(id, n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variedades', cultivoId] });
      qc.invalidateQueries({ queryKey: ['variedades'] });
      setEditandoId(null);
      toast.success('Variedad actualizada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => variedadesService.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variedades', cultivoId] });
      qc.invalidateQueries({ queryKey: ['variedades'] });
      toast.success('Variedad eliminada');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        Variedades {variedades && variedades.length > 0 && `(${variedades.length})`}
      </p>

      {isLoading ? (
        <div className="h-10 shimmer rounded-md" />
      ) : variedades && variedades.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {variedades.map((v: Variedad) => (
            <li
              key={v.id}
              className="group inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full border text-xs bg-surface"
              style={{ borderColor: `${color}55` }}
            >
              {editandoId === v.id ? (
                <input
                  value={editandoNombre}
                  onChange={(e) => setEditandoNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (editandoNombre.trim()) editar.mutate({ id: v.id, n: editandoNombre.trim() });
                    } else if (e.key === 'Escape') {
                      setEditandoId(null);
                    }
                  }}
                  onBlur={() => setEditandoId(null)}
                  className="bg-transparent outline-none text-xs min-w-0 w-32"
                  autoFocus
                />
              ) : (
                <span className="text-foreground">{v.nombre}</span>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditandoId(v.id);
                  setEditandoNombre(v.nombre);
                }}
                className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Editar"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar variedad "${v.nombre}"?`)) eliminar.mutate(v.id);
                }}
                className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Sin variedades. Agregá una abajo (ej: DM 4615, Triunfo CL2).</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = nuevaVariedad.trim();
          if (!n) return;
          crear.mutate(n);
        }}
        className="flex items-center gap-2 pt-1"
      >
        <Input
          value={nuevaVariedad}
          onChange={(e) => setNuevaVariedad(e.target.value)}
          placeholder="Nueva variedad (ej: DM 4615)"
          className="h-9 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!nuevaVariedad.trim() || crear.isPending}
          className={cn('shrink-0')}
        >
          {crear.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Agregar
        </Button>
      </form>
    </div>
  );
}
