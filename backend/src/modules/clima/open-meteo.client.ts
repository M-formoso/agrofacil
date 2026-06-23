/**
 * Cliente para Open-Meteo — API pública, gratis, sin API key, uso comercial OK.
 * Docs: https://open-meteo.com/en/docs
 *
 * Endpoints usados:
 *  - Forecast:   https://api.open-meteo.com/v1/forecast
 *  - Histórico:  https://archive-api.open-meteo.com/v1/archive
 *
 * No usamos SDK — fetch directo. Timezone fijo en America/Argentina/Cordoba
 * porque es el público objetivo. Si necesitamos otros tz se hace param.
 */

const BASE_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const BASE_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
const TZ = 'America/Argentina/Cordoba';

export interface OpenMeteoCurrent {
  temperatura: number;
  sensacion: number;
  humedad: number;
  vientoKmh: number;
  vientoDir: number;
  lluvia: number;
  weatherCode: number;
  esDeNoche: boolean;
  tiempo: string;        // ISO timestamp
}

export interface OpenMeteoDailyDay {
  fecha: string;          // YYYY-MM-DD
  tMax: number;
  tMin: number;
  lluvia: number;
  probLluvia: number;
  vientoMax: number;
  uvMax: number;
  weatherCode: number;
  amanecer: string;
  atardecer: string;
}

export interface OpenMeteoHistoricalDay {
  fecha: string;
  lluvia: number;
  tMedia: number;
  tMax: number;
  tMin: number;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Open-Meteo respondió ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function obtenerActual(lat: number, lon: number): Promise<OpenMeteoCurrent> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: TZ,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'weather_code',
      'is_day',
    ].join(','),
    wind_speed_unit: 'kmh',
  });
  const data = (await fetchJson(`${BASE_FORECAST}?${params}`)) as {
    current: Record<string, number | string>;
  };
  const c = data.current;
  return {
    temperatura: Number(c.temperature_2m),
    sensacion: Number(c.apparent_temperature),
    humedad: Number(c.relative_humidity_2m),
    vientoKmh: Number(c.wind_speed_10m),
    vientoDir: Number(c.wind_direction_10m),
    lluvia: Number(c.precipitation),
    weatherCode: Number(c.weather_code),
    esDeNoche: Number(c.is_day) === 0,
    tiempo: String(c.time),
  };
}

export async function obtenerPronostico(lat: number, lon: number, dias = 7): Promise<OpenMeteoDailyDay[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: TZ,
    forecast_days: String(dias),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'uv_index_max',
      'weather_code',
      'sunrise',
      'sunset',
    ].join(','),
    wind_speed_unit: 'kmh',
  });
  const data = (await fetchJson(`${BASE_FORECAST}?${params}`)) as {
    daily: Record<string, (number | string)[]>;
  };
  const d = data.daily;
  const len = (d.time as string[]).length;
  const out: OpenMeteoDailyDay[] = [];
  for (let i = 0; i < len; i += 1) {
    out.push({
      fecha: String(d.time[i]),
      tMax: Number(d.temperature_2m_max[i]),
      tMin: Number(d.temperature_2m_min[i]),
      lluvia: Number(d.precipitation_sum[i]),
      probLluvia: Number(d.precipitation_probability_max[i] ?? 0),
      vientoMax: Number(d.wind_speed_10m_max[i] ?? 0),
      uvMax: Number(d.uv_index_max[i] ?? 0),
      weatherCode: Number(d.weather_code[i]),
      amanecer: String(d.sunrise[i] ?? ''),
      atardecer: String(d.sunset[i] ?? ''),
    });
  }
  return out;
}

export async function obtenerHistorico(
  lat: number,
  lon: number,
  desde: string,
  hasta: string,
): Promise<OpenMeteoHistoricalDay[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: TZ,
    start_date: desde,
    end_date: hasta,
    daily: [
      'precipitation_sum',
      'temperature_2m_mean',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
  });
  const data = (await fetchJson(`${BASE_ARCHIVE}?${params}`)) as {
    daily: Record<string, (number | string)[]>;
  };
  const d = data.daily;
  const len = (d.time as string[]).length;
  const out: OpenMeteoHistoricalDay[] = [];
  for (let i = 0; i < len; i += 1) {
    out.push({
      fecha: String(d.time[i]),
      lluvia: Number(d.precipitation_sum[i] ?? 0),
      tMedia: Number(d.temperature_2m_mean[i] ?? 0),
      tMax: Number(d.temperature_2m_max[i] ?? 0),
      tMin: Number(d.temperature_2m_min[i] ?? 0),
    });
  }
  return out;
}
