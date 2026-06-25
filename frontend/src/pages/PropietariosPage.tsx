import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Copy, KeyRound, Loader2, Plus, ShieldOff, UserPlus, Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet } from '@/components/ui/Sheet';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  propietariosService,
  type CrearPropietarioResponse,
  type Propietario,
} from '@/services/propietariosService';
import { extraerMensajeError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

const schemaCrear = z.object({
  nombre: z.string().trim().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
type FormCrear = z.input<typeof schemaCrear>;

const formatearFecha = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function PropietariosPage() {
  const qc = useQueryClient();
  const usuario = useAuthStore((s) => s.usuario);
  const [creating, setCreating] = useState(false);
  const [credencial, setCredencial] = useState<CrearPropietarioResponse | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['propietarios'],
    queryFn: () => propietariosService.listar(),
  });

  const crear = useMutation({
    mutationFn: (input: FormCrear) =>
      propietariosService.crear({
        nombre: input.nombre.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['propietarios'] });
      setCreating(false);
      if (res.passwordGenerada) {
        setCredencial(res);
      } else {
        toast.success(res.mensaje);
      }
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  if (usuario?.rolEnCuentaActiva !== 'ingeniero') {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          icon={ShieldOff}
          title="Sin acceso"
          description="Sólo el ingeniero de la cuenta puede gestionar propietarios."
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Quién más puede ver esta cuenta</p>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Propietarios</h1>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Dar acceso
        </Button>
      </header>

      <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80 leading-relaxed">
        Los propietarios ven sólo el detalle de su campo: lotes, resultados y costos. No pueden
        modificar configuración ni catálogos. La contraseña se genera al crearlos y se muestra una
        sola vez — pasásela por WhatsApp.
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin propietarios"
          description="Todavía no diste acceso a nadie. Creá un usuario propietario para que pueda entrar y ver el detalle de su campo."
          action={{ label: 'Dar primer acceso', onClick: () => setCreating(true) }}
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {data.map((p, i) => (
              <PropietarioRow key={p.usuarioId} propietario={p} index={i} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <SheetCrear
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        onSubmit={(d) => crear.mutate(d)}
        loading={crear.isPending}
      />

      <SheetCredencial
        credencial={credencial}
        onClose={() => setCredencial(null)}
      />
    </div>
  );
}

// ============================================================
// Fila de propietario con acciones (cambiar password, revocar)
// ============================================================
function PropietarioRow({ propietario, index }: { propietario: Propietario; index: number }) {
  const qc = useQueryClient();
  const [credencial, setCredencial] = useState<{ password: string; email: string } | null>(null);

  const cambiar = useMutation({
    mutationFn: () => propietariosService.cambiarPassword(propietario.usuarioId, {}),
    onSuccess: (res) => {
      if (res.passwordGenerada) {
        setCredencial({ password: res.passwordGenerada, email: propietario.email });
      } else {
        toast.success('Contraseña actualizada');
      }
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  const revocar = useMutation({
    mutationFn: () => propietariosService.revocar(propietario.usuarioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propietarios'] });
      toast.success('Acceso revocado');
    },
    onError: (e) => toast.error(extraerMensajeError(e)),
  });

  return (
    <>
      <motion.li
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ delay: index * 0.025 }}
        className="rounded-xl border border-border bg-surface p-4 flex items-center gap-4 flex-wrap"
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
          {propietario.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{propietario.nombre}</p>
          <p className="text-sm text-muted-foreground truncate">{propietario.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Creado {formatearFecha(propietario.creadoEn)} ·{' '}
            {propietario.ultimoLogin
              ? `Último ingreso ${formatearFecha(propietario.ultimoLogin)}`
              : 'Sin ingresos aún'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`Generar nueva contraseña para ${propietario.nombre}?`)) cambiar.mutate();
            }}
            disabled={cambiar.isPending}
          >
            {cambiar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Nueva clave
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm(`Revocar acceso de ${propietario.nombre}? No podrá ingresar más.`)) revocar.mutate();
            }}
            disabled={revocar.isPending}
            className="text-destructive hover:bg-destructive/10"
          >
            {revocar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
            Revocar
          </Button>
        </div>
      </motion.li>

      <Sheet
        open={!!credencial}
        onOpenChange={(o) => !o && setCredencial(null)}
        title="Nueva contraseña generada"
        description="Copiá la contraseña ahora — no se vuelve a mostrar."
      >
        {credencial && (
          <CredencialDisplay email={credencial.email} password={credencial.password} />
        )}
      </Sheet>
    </>
  );
}

// ============================================================
// Sheet — crear propietario
// ============================================================
function SheetCrear({
  open, onOpenChange, onSubmit, loading,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: FormCrear) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormCrear>({
    resolver: zodResolver(schemaCrear),
    defaultValues: { nombre: '', email: '', password: '' },
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Dar acceso a un propietario"
      description="Generamos credenciales para que pueda ingresar y ver el detalle de su campo."
    >
      <form
        onSubmit={handleSubmit((d) => {
          onSubmit(d);
          reset();
        })}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" placeholder="Juan Pérez" autoFocus {...register('nombre')} />
          {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="juan@ejemplo.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Contraseña <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="password"
            type="text"
            placeholder="Si la dejás vacía, la generamos nosotros"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
          <UserPlus className="h-3.5 w-3.5 inline-block mr-1 -mt-0.5" />
          Si el email ya tiene cuenta en AgroFácil, le agregaremos acceso a esta cuenta sin cambiar
          su contraseña actual.
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear acceso
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

// ============================================================
// Sheet — mostrar credenciales recién creadas
// ============================================================
function SheetCredencial({
  credencial, onClose,
}: {
  credencial: CrearPropietarioResponse | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={!!credencial}
      onOpenChange={(o) => !o && onClose()}
      title="Listo — acceso creado"
      description="Pasá estas credenciales al propietario por WhatsApp. La contraseña no se vuelve a mostrar."
    >
      {credencial && credencial.passwordGenerada && (
        <CredencialDisplay
          email={credencial.email}
          password={credencial.passwordGenerada}
          extra={
            <p className="text-sm text-foreground">
              {credencial.nombre} ya puede ingresar a AgroFácil con esta clave.
            </p>
          }
        />
      )}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={onClose}>Listo</Button>
      </div>
    </Sheet>
  );
}

function CredencialDisplay({
  email, password, extra,
}: {
  email: string;
  password: string;
  extra?: React.ReactNode;
}) {
  const [copiado, setCopiado] = useState<'email' | 'password' | 'whatsapp' | null>(null);

  const copiar = async (texto: string, tag: 'email' | 'password' | 'whatsapp') => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tag);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const mensajeWhatsapp = `Hola — ya te creé tu acceso a AgroFácil:\n\nEmail: ${email}\nContraseña: ${password}\n\nEntrá a la plataforma y cambiá la clave cuando puedas.`;

  return (
    <div className="space-y-4">
      {extra}
      <Fila label="Email" valor={email} copiado={copiado === 'email'} onCopy={() => copiar(email, 'email')} />
      <Fila label="Contraseña" valor={password} copiado={copiado === 'password'} onCopy={() => copiar(password, 'password')} mono />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => copiar(mensajeWhatsapp, 'whatsapp')}
      >
        {copiado === 'whatsapp' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiado === 'whatsapp' ? 'Mensaje copiado' : 'Copiar mensaje para WhatsApp'}
      </Button>
    </div>
  );
}

function Fila({
  label, valor, copiado, onCopy, mono,
}: {
  label: string;
  valor: string;
  copiado: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className={`flex-1 px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm ${mono ? 'font-mono' : ''}`}>
          {valor}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition"
          aria-label="Copiar"
        >
          {copiado ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
