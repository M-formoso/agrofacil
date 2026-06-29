import {
  Home, Tractor, Sprout, CalendarRange,
  Beaker, BarChart3, Wheat, CloudRain, CloudSun, Sparkles, UserPlus, FileText, Bell, Trophy,
  type LucideIcon,
} from 'lucide-react';
import type { RolEnCuenta } from '@/stores/authStore';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
  /** Roles que pueden ver este item. Vacío/undefined = todos. */
  roles?: RolEnCuenta[];
}

export interface NavGroup {
  id: string;
  /** Etiqueta del grupo. null = sin header (items "flotantes" arriba). */
  label: string | null;
  /** Si el grupo arranca colapsado por defecto. */
  defaultCollapsed?: boolean;
  items: NavItem[];
}

/**
 * La nav está agrupada por área. Cada grupo se puede colapsar/expandir
 * desde el sidebar; el estado se persiste en localStorage.
 */
export const navGroups: NavGroup[] = [
  {
    id: 'principal',
    label: null,
    items: [
      { to: '/', label: 'Inicio', icon: Home, keywords: ['vivero', 'dashboard'] },
    ],
  },
  {
    id: 'mi-campo',
    label: 'Mi campo',
    items: [
      { to: '/establecimientos', label: 'Establecimientos', icon: Tractor, keywords: ['campo', 'finca'] },
      { to: '/lotes',            label: 'Lotes',            icon: Sprout,  keywords: ['parcela', 'potrero'] },
      { to: '/campanias',        label: 'Campañas',         icon: CalendarRange, keywords: ['fina', 'gruesa'] },
    ],
  },
  {
    id: 'operacion',
    label: 'Operación',
    items: [
      { to: '/lluvias',   label: 'Lluvias',      icon: CloudRain,     keywords: ['mm', 'agua', 'calendario'] },
      { to: '/clima',     label: 'Clima',        icon: CloudSun,      keywords: ['pronostico', 'temperatura', 'humedad', 'viento', 'open-meteo'] },
      { to: '/asistente', label: 'Asistente IA', icon: Sparkles,      keywords: ['chat', 'claude', 'preguntar', 'ayuda', 'ia'], roles: ['ingeniero', 'operador'] },
    ],
  },
  {
    id: 'catalogos',
    label: 'Catálogos',
    defaultCollapsed: true,
    items: [
      { to: '/cultivos', label: 'Cultivos', icon: Wheat,  keywords: ['catalogo', 'variedades'], roles: ['ingeniero'] },
      { to: '/insumos',  label: 'Insumos',  icon: Beaker, keywords: ['fertilizante', 'herbicida', 'stock', 'inventario'] },
    ],
  },
  {
    id: 'analisis',
    label: 'Análisis',
    items: [
      { to: '/resumen',  label: 'Resumen',  icon: BarChart3, keywords: ['resultado', 'margen', 'punto eq'] },
      { to: '/ranking',  label: 'Ranking',  icon: Trophy,    keywords: ['comparar', 'mejor', 'peor', 'productivo', 'costos'] },
      { to: '/reportes', label: 'Reportes', icon: FileText,  keywords: ['compartir', 'pdf', 'link', 'comentarios'] },
      { to: '/alertas',  label: 'Alertas',  icon: Bell,      keywords: ['notificaciones', 'aviso', 'recordatorio'] },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    defaultCollapsed: true,
    items: [
      { to: '/propietarios', label: 'Propietarios', icon: UserPlus, keywords: ['acceso', 'productor', 'cliente', 'invitar'], roles: ['ingeniero'] },
    ],
  },
];

/** Plana sin grupos — útil para command palette y compatibilidad. */
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

export function filtrarPorRol(items: NavItem[], rol: RolEnCuenta | undefined): NavItem[] {
  if (!rol) return items;
  return items.filter((i) => !i.roles || i.roles.includes(rol));
}

export function filtrarGruposPorRol(groups: NavGroup[], rol: RolEnCuenta | undefined): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: filtrarPorRol(g.items, rol) }))
    .filter((g) => g.items.length > 0);
}
