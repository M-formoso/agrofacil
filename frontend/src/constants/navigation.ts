import {
  Home, Tractor, Sprout, CalendarRange, ClipboardList,
  Beaker, BarChart3, Wheat, CloudRain, CloudSun, Sparkles, UserPlus, FileText, Bell,
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

export const navItems: NavItem[] = [
  { to: '/',                  label: 'Inicio',          icon: Home,          keywords: ['vivero', 'dashboard'] },
  { to: '/establecimientos',  label: 'Establecimientos', icon: Tractor,      keywords: ['campo', 'finca'] },
  { to: '/lotes',             label: 'Lotes',            icon: Sprout,       keywords: ['parcela', 'potrero'] },
  { to: '/campanias',         label: 'Campañas',         icon: CalendarRange, keywords: ['fina', 'gruesa'] },
  { to: '/carga',             label: 'Carga',            icon: ClipboardList, keywords: ['labores', 'insumos', 'voz', 'foto'], roles: ['ingeniero', 'operador'] },
  { to: '/lluvias',           label: 'Lluvias',          icon: CloudRain,     keywords: ['mm', 'agua', 'calendario'] },
  { to: '/clima',             label: 'Clima',            icon: CloudSun,      keywords: ['pronostico', 'temperatura', 'humedad', 'viento', 'open-meteo'] },
  { to: '/asistente',         label: 'Asistente IA',     icon: Sparkles,      keywords: ['chat', 'claude', 'preguntar', 'ayuda', 'ia'], roles: ['ingeniero', 'operador'] },
  { to: '/cultivos',          label: 'Cultivos',         icon: Wheat,         keywords: ['catalogo'], roles: ['ingeniero'] },
  { to: '/insumos',           label: 'Insumos',          icon: Beaker,        keywords: ['fertilizante', 'herbicida'], roles: ['ingeniero'] },
  { to: '/resumen',           label: 'Resumen',          icon: BarChart3,     keywords: ['resultado', 'margen', 'punto eq'] },
  { to: '/reportes',          label: 'Reportes',         icon: FileText,      keywords: ['compartir', 'pdf', 'link', 'comentarios'] },
  { to: '/alertas',           label: 'Alertas',          icon: Bell,          keywords: ['notificaciones', 'aviso', 'recordatorio'] },
  { to: '/propietarios',      label: 'Propietarios',     icon: UserPlus,      keywords: ['acceso', 'productor', 'cliente', 'invitar'], roles: ['ingeniero'] },
];

export function filtrarPorRol(items: NavItem[], rol: RolEnCuenta | undefined): NavItem[] {
  if (!rol) return items;
  return items.filter((i) => !i.roles || i.roles.includes(rol));
}
