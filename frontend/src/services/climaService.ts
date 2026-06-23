import { apiClient } from '@/lib/apiClient';
import { buildQuery } from './_apiHelpers';

export interface WeatherInfo {
  condition: string;
  descripcion: string;
  icono: string;
}

export interface ClimaActual {
  temperatura: number;
  sensacion: number;
  humedad: number;
  vientoKmh: number;
  vientoDir: number;
  lluvia: number;
  weatherCode: number;
  esDeNoche: boolean;
  tiempo: string;
  info: WeatherInfo;
}

export interface DiaPronostico {
  fecha: string;
  tMax: number;
  tMin: number;
  lluvia: number;
  probLluvia: number;
  vientoMax: number;
  uvMax: number;
  weatherCode: number;
  amanecer: string;
  atardecer: string;
  info: WeatherInfo;
}

export interface Pronostico {
  dias: DiaPronostico[];
}

export interface DiaHistorico {
  fecha: string;
  lluvia: number;
  tMedia: number;
  tMax: number;
  tMin: number;
}

export const climaService = {
  actual: (lat: number, lon: number) =>
    apiClient.get<ClimaActual>(`/clima/actual${buildQuery({ lat, lon })}`).then((r) => r.data),

  pronostico: (lat: number, lon: number) =>
    apiClient.get<Pronostico>(`/clima/pronostico${buildQuery({ lat, lon })}`).then((r) => r.data),

  historico: (lat: number, lon: number, desde: string, hasta: string) =>
    apiClient
      .get<{ dias: DiaHistorico[] }>(`/clima/historico${buildQuery({ lat, lon, desde, hasta })}`)
      .then((r) => r.data),
};
