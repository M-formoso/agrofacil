# Crear Componente React

Crea un componente React TypeScript siguiendo las convenciones del proyecto AgroFácil.

## Parámetros
- **$ARGUMENTS**: Tipo y nombre del componente (ej: `"tabla LotesList"`, `"formulario LaborForm"`, `"card ResultadoLoteCard"`)

---

## Template — Componente de Tabla (Lista)

```tsx
// src/components/{modulo}/{Modulo}List.tsx
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { xxxService } from '@/services/xxxService';
import type { Xxx } from '@/types/xxx';
import { formatearHa, formatearUsd } from '@/utils/formatters';

export function XxxList() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['xxxs'],
    queryFn: () => xxxService.listar(),
  });

  const columns: ColumnDef<Xxx>[] = [
    { accessorKey: 'nombre', header: 'Nombre' },
    {
      accessorKey: 'superficieHa',
      header: 'Superficie',
      cell: ({ row }) => formatearHa(row.original.superficieHa),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/xxxs/${row.original.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/xxxs/${row.original.id}/editar`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (error) return <div className="text-destructive">Error al cargar datos</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Xxxs</h1>
        <Button asChild>
          <Link to="/xxxs/nuevo"><Plus className="mr-2 h-4 w-4" /> Nuevo</Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">No se encontraron resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

## Template — Formulario

```tsx
// src/components/{modulo}/{Modulo}Form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

import { xxxService } from '@/services/xxxService';
import type { Xxx, XxxFormData } from '@/types/xxx';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  superficieHa: z.coerce.number().positive('Debe ser mayor a 0'),
});

interface Props {
  initialData?: Xxx;
  mode: 'crear' | 'editar';
}

export function XxxForm({ initialData, mode }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const form = useForm<XxxFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ?? { nombre: '', superficieHa: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: XxxFormData) =>
      mode === 'crear' ? xxxService.crear(data) : xxxService.actualizar(initialData!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['xxxs'] });
      toast({ title: mode === 'crear' ? 'Creado' : 'Actualizado' });
      navigate('/xxxs');
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl><Input placeholder="Ej: Lote 4" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="superficieHa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Superficie (ha) *</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/xxxs')}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'crear' ? 'Crear' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Paleta AgroFácil (John Deere Green)
Usar las variables Tailwind del config (definidas en `tailwind.config.js`):
- **Primario (verde John Deere #047C00)**: `bg-primary hover:bg-primary-hover` / `text-primary`
- **Acento (light olive #0F7702)**: `bg-accent hover:bg-accent-hover`
- **Sidebar**: `bg-sidebar text-sidebar-foreground` (verde con texto blanco)
- **Fondo**: `bg-background`
- **Superficie (cards)**: `bg-surface`
- **Texto**: `text-text-primary` / `text-text-secondary`
- **Bordes**: `border-border`

Hex de referencia:
- `#047C00` — primary (campo)
- `#06820B` — primary light (John Deere Green)
- `#0F7702` — accent (light olive green)

## Reglas de UI específicas del dominio
- Cuando muestres rinde, costo o margen → siempre formatear con los helpers (`formatearQqHa`, `formatearUsd`, `formatearHa`).
- Cuando un valor sea **proyectado** (rinde estimado, no real) → mostrar badge "Proyectado" en gris/ámbar.
- Cuando un valor sea **definitivo** (post-cosecha) → badge verde.
- En la pantalla de Carga, **el botón de voz/foto va PRIMERO** (es el camino feliz), el form manual está debajo.

## Ejemplo de uso
```
/crear-componente-react tabla LotesList
/crear-componente-react formulario LaborForm
/crear-componente-react card ResultadoLoteCard
```
