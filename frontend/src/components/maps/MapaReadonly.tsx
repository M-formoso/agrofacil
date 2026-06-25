import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

interface Props {
  lat: number;
  lon: number;
  zoom?: number;
  height?: number;
  className?: string;
}

/** Mini-mapa de sólo lectura para mostrar la ubicación de un establecimiento o lote. */
export function MapaReadonly({ lat, lon, zoom = 14, height = 220, className }: Props) {
  return (
    <div className={`rounded-xl overflow-hidden border border-border bg-surface ${className ?? ''}`}>
      <div style={{ height }}>
        <MapContainer
          center={[lat, lon]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          dragging
          touchZoom
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]} />
        </MapContainer>
      </div>
      <div className="px-3 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5 tabular-nums">
          <MapPin className="h-3 w-3 text-primary" />
          {lat.toFixed(5)}, {lon.toFixed(5)}
        </span>
        <a
          href={`https://www.google.com/maps?q=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}
