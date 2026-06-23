import { Injectable } from '@nestjs/common';
import {
  obtenerActual,
  obtenerPronostico,
  obtenerHistorico,
  type OpenMeteoCurrent,
  type OpenMeteoDailyDay,
  type OpenMeteoHistoricalDay,
} from './open-meteo.client';
import { describirCodigo, type WeatherInfo } from './weather-codes';

/**
 * Caché in-memory con TTL.
 * - Actual: 15 min (clima cambia rápido)
 * - Pronóstico: 1 hora (Open-Meteo actualiza cada ~3h)
 * - Histórico: 24 h (no cambia)
 *
 * Para producción multi-instancia conviene Redis. En MVP single-instance esto va bien.
 */
interface Entry<T> {
  data: T;
  hasta: number;
}
class Cache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private readonly ttlMs: number) {}
  get(key: string): T | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.hasta) {
      this.store.delete(key);
      return null;
    }
    return e.data;
  }
  set(key: string, data: T): void {
    this.store.set(key, { data, hasta: Date.now() + this.ttlMs });
  }
}

@Injectable()
export class ClimaService {
  private readonly cacheActual = new Cache<ActualResp>(15 * 60 * 1000);
  private readonly cachePronostico = new Cache<PronosticoResp>(60 * 60 * 1000);
  private readonly cacheHistorico = new Cache<HistoricoResp>(24 * 60 * 60 * 1000);

  async actual(lat: number, lon: number): Promise<ActualResp> {
    const key = `${redondear(lat)}_${redondear(lon)}`;
    const cached = this.cacheActual.get(key);
    if (cached) return cached;

    const raw = await obtenerActual(lat, lon);
    const resp = adaptarActual(raw);
    this.cacheActual.set(key, resp);
    return resp;
  }

  async pronostico(lat: number, lon: number): Promise<PronosticoResp> {
    const key = `${redondear(lat)}_${redondear(lon)}`;
    const cached = this.cachePronostico.get(key);
    if (cached) return cached;

    const dias = await obtenerPronostico(lat, lon, 7);
    const resp: PronosticoResp = { dias: dias.map(adaptarDia) };
    this.cachePronostico.set(key, resp);
    return resp;
  }

  async historico(lat: number, lon: number, desde: string, hasta: string): Promise<HistoricoResp> {
    const key = `${redondear(lat)}_${redondear(lon)}_${desde}_${hasta}`;
    const cached = this.cacheHistorico.get(key);
    if (cached) return cached;

    const dias = await obtenerHistorico(lat, lon, desde, hasta);
    const resp: HistoricoResp = { dias: dias.map(adaptarHistorico) };
    this.cacheHistorico.set(key, resp);
    return resp;
  }
}

// ============================================================
// Tipos públicos del módulo
// ============================================================

export interface ActualResp extends OpenMeteoCurrent {
  info: WeatherInfo;
}
export interface DiaPronostico extends OpenMeteoDailyDay {
  info: WeatherInfo;
}
export interface PronosticoResp {
  dias: DiaPronostico[];
}
export interface HistoricoResp {
  dias: OpenMeteoHistoricalDay[];
}

// ============================================================
// Helpers
// ============================================================

const redondear = (n: number) => Math.round(n * 100) / 100;

function adaptarActual(raw: OpenMeteoCurrent): ActualResp {
  return { ...raw, info: describirCodigo(raw.weatherCode) };
}
function adaptarDia(raw: OpenMeteoDailyDay): DiaPronostico {
  return { ...raw, info: describirCodigo(raw.weatherCode) };
}
function adaptarHistorico(raw: OpenMeteoHistoricalDay): OpenMeteoHistoricalDay {
  return raw;
}
