import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L, { type LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix del bug clásico de leaflet con bundlers: los íconos por default no se cargan
// porque sus paths quedan rotos en el build. Forzamos URLs explícitas via Vite ?url.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Props {
  /** Lat/lon iniciales. Si no hay, se centra en Oliva, Córdoba. */
  lat?: number | null;
  lon?: number | null;
  onChange: (lat: number, lon: number) => void;
  className?: string;
  /** Altura del mapa. Por default 320px. */
  height?: number;
}

// Default: Oliva, Córdoba, zona núcleo
const DEFAULT_CENTER: [number, number] = [-32.0345, -63.5667];
const DEFAULT_ZOOM = 7;

/**
 * Selector de ubicación con mapa.
 * - Click en el mapa pone el marcador ahí.
 * - El marcador es arrastrable para refinar.
 * - Barra de búsqueda de direcciones usando Nominatim (OpenStreetMap, gratis).
 * - Botón "Mi ubicación" usa geolocalización del browser.
 */
export function MapPicker({ lat, lon, onChange, className, height = 320 }: Props) {
  const center: [number, number] = lat && lon ? [lat, lon] : DEFAULT_CENTER;
  const zoom = lat && lon ? 13 : DEFAULT_ZOOM;

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border bg-surface', className)}>
      <BuscadorDireccion onResultado={onChange} />
      <div style={{ height }} className="relative">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ManejadorClicksYMarcador
            lat={lat ?? null}
            lon={lon ?? null}
            onChange={onChange}
          />
        </MapContainer>
      </div>
      {lat && lon && (
        <div className="px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5 tabular-nums">
          <MapPin className="h-3 w-3 text-primary shrink-0" />
          {lat.toFixed(6)}, {lon.toFixed(6)}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Subcomponente: maneja clicks en el mapa + dibuja el marker
// ============================================================
function ManejadorClicksYMarcador({
  lat,
  lon,
  onChange,
}: {
  lat: number | null;
  lon: number | null;
  onChange: (lat: number, lon: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  // Cuando cambian las coords desde afuera (ej. botón "mi ubicación"), centrar el mapa
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], Math.max(map.getZoom(), 13));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  if (lat === null || lon === null) return null;

  return (
    <Marker
      position={[lat, lon]}
      draggable
      eventHandlers={{
        dragend(e) {
          const m = e.target as L.Marker;
          const pos = m.getLatLng() as LatLng;
          onChange(pos.lat, pos.lng);
        },
      }}
    />
  );
}

// ============================================================
// Buscador de direcciones via Nominatim (OpenStreetMap)
// API gratis, sin key. Limit 1 request/seg. Cumplimos eso fácil porque
// el usuario tipea y presiona Enter (no hay autocompletado en cada tecla).
// ============================================================
function BuscadorDireccion({ onResultado }: { onResultado: (lat: number, lon: number) => void }) {
  const [query, setQuery] = useState('');
  const [buscando, setBuscando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const buscar = async () => {
    const q = query.trim();
    if (!q || buscando) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBuscando(true);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', q);
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'ar');
      const res = await fetch(url.toString(), {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'es' },
      });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data.length > 0) {
        onResultado(Number(data[0].lat), Number(data[0].lon));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error(err);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border bg-surface">
      <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            buscar();
          }
        }}
        placeholder="Buscar dirección o localidad (ej: Oliva, Córdoba)"
        className="flex-1 h-9 px-2 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={buscar}
        disabled={!query.trim() || buscando}
        className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover disabled:opacity-50 inline-flex items-center gap-1.5"
      >
        {buscando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
      </button>
    </div>
  );
}
