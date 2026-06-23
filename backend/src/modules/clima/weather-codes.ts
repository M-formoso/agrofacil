/**
 * Códigos WMO (World Meteorological Organization) → descripción humana + ícono.
 * Open-Meteo devuelve weather_code según este estándar.
 */

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'rain_heavy'
  | 'snow'
  | 'rain_showers'
  | 'thunderstorm'
  | 'thunderstorm_hail';

export interface WeatherInfo {
  condition: WeatherCondition;
  descripcion: string;
  /** Identificador de ícono — el frontend mapea a un componente lucide-react. */
  icono: string;
}

const TABLA: Record<number, WeatherInfo> = {
  0: { condition: 'clear',          descripcion: 'Despejado',                icono: 'sun' },
  1: { condition: 'clear',          descripcion: 'Mayormente despejado',     icono: 'sun' },
  2: { condition: 'partly_cloudy',  descripcion: 'Parcialmente nublado',     icono: 'cloud-sun' },
  3: { condition: 'cloudy',         descripcion: 'Nublado',                  icono: 'cloud' },
  45:{ condition: 'fog',            descripcion: 'Niebla',                   icono: 'cloud-fog' },
  48:{ condition: 'fog',            descripcion: 'Niebla con escarcha',      icono: 'cloud-fog' },
  51:{ condition: 'drizzle',        descripcion: 'Llovizna ligera',          icono: 'cloud-drizzle' },
  53:{ condition: 'drizzle',        descripcion: 'Llovizna moderada',        icono: 'cloud-drizzle' },
  55:{ condition: 'drizzle',        descripcion: 'Llovizna intensa',         icono: 'cloud-drizzle' },
  56:{ condition: 'drizzle',        descripcion: 'Llovizna helada ligera',   icono: 'cloud-drizzle' },
  57:{ condition: 'drizzle',        descripcion: 'Llovizna helada intensa',  icono: 'cloud-drizzle' },
  61:{ condition: 'rain',           descripcion: 'Lluvia ligera',            icono: 'cloud-rain' },
  63:{ condition: 'rain',           descripcion: 'Lluvia moderada',          icono: 'cloud-rain' },
  65:{ condition: 'rain_heavy',     descripcion: 'Lluvia intensa',           icono: 'cloud-rain-wind' },
  66:{ condition: 'rain',           descripcion: 'Lluvia helada ligera',     icono: 'cloud-rain' },
  67:{ condition: 'rain_heavy',     descripcion: 'Lluvia helada intensa',    icono: 'cloud-rain-wind' },
  71:{ condition: 'snow',           descripcion: 'Nieve ligera',             icono: 'cloud-snow' },
  73:{ condition: 'snow',           descripcion: 'Nieve moderada',           icono: 'cloud-snow' },
  75:{ condition: 'snow',           descripcion: 'Nieve intensa',            icono: 'cloud-snow' },
  77:{ condition: 'snow',           descripcion: 'Granos de nieve',          icono: 'cloud-snow' },
  80:{ condition: 'rain_showers',   descripcion: 'Chubascos ligeros',        icono: 'cloud-rain' },
  81:{ condition: 'rain_showers',   descripcion: 'Chubascos moderados',      icono: 'cloud-rain' },
  82:{ condition: 'rain_showers',   descripcion: 'Chubascos violentos',      icono: 'cloud-rain-wind' },
  85:{ condition: 'snow',           descripcion: 'Chubascos de nieve',       icono: 'cloud-snow' },
  86:{ condition: 'snow',           descripcion: 'Chubascos intensos nieve', icono: 'cloud-snow' },
  95:{ condition: 'thunderstorm',   descripcion: 'Tormenta',                 icono: 'cloud-lightning' },
  96:{ condition: 'thunderstorm_hail', descripcion: 'Tormenta con granizo',  icono: 'cloud-lightning' },
  99:{ condition: 'thunderstorm_hail', descripcion: 'Tormenta granizo fuerte', icono: 'cloud-lightning' },
};

const DEFAULT: WeatherInfo = { condition: 'cloudy', descripcion: 'Sin datos', icono: 'cloud' };

export function describirCodigo(code: number | null | undefined): WeatherInfo {
  if (code === null || code === undefined) return DEFAULT;
  return TABLA[code] ?? DEFAULT;
}
