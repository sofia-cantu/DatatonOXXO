'use client';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

interface Tienda {
  LATITUD_NUM: number;
  LONGITUD_NUM: number;
  TIENDA_ID: string;
  EXITO: number;
}

interface MapaTiendasProps {
  data: Tienda[];
  focusCoordinates?: {
    lat: number;
    lng: number;
    zoom?: number;
  } | null;
  highlightTiendaId?: string | number | null;
}

// Componente helper para controlar el mapa desde dentro
function MapController({ focusCoordinates }: { focusCoordinates?: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (focusCoordinates) {
      const zoom = focusCoordinates.zoom || 16; // Zoom 16 es bueno para ver calles
      map.setView([focusCoordinates.lat, focusCoordinates.lng], zoom, {
        animate: true,
        duration: 1.5 // Animación suave de 1.5 segundos
      });
    }
  }, [focusCoordinates, map]);

  return null;
}

export default function MapaTiendas({ data, focusCoordinates, highlightTiendaId }: MapaTiendasProps) {
  const latProm = data.reduce((sum, t) => sum + t.LATITUD_NUM, 0) / data.length;
  const lonProm = data.reduce((sum, t) => sum + t.LONGITUD_NUM, 0) / data.length;
  const coordsSet = new Set<string>();

  // Determinar el centro y zoom inicial
  const initialCenter = focusCoordinates ? [focusCoordinates.lat, focusCoordinates.lng] : [latProm, lonProm];
  const initialZoom = focusCoordinates ? (focusCoordinates.zoom || 16) : 6;

  return (
    <MapContainer
      center={initialCenter as [number, number]}
      zoom={initialZoom}
      style={{
        height: '100%',
        width: '100%',
        borderRadius: '0.5rem'
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapController focusCoordinates={focusCoordinates} />
      
      {data.map((tienda, idx) => {
        const coordKey = `${tienda.LATITUD_NUM},${tienda.LONGITUD_NUM}`;
        if (coordsSet.has(coordKey)) return null;
        coordsSet.add(coordKey);
        
        // Determinar color y tamaño basado en si está destacada
        const isHighlighted = highlightTiendaId && tienda.TIENDA_ID.toString() === highlightTiendaId.toString();
        const color = tienda.EXITO === 1 ? 'green' : 'red';
        const radius = isHighlighted ? 8 : 5;
        const opacity = isHighlighted ? 1 : 0.7;

        return (
          <CircleMarker
            key={idx}
            center={[tienda.LATITUD_NUM, tienda.LONGITUD_NUM] as [number, number]}
            pathOptions={{ 
              color, 
              fillColor: color, 
              fillOpacity: opacity,
              weight: isHighlighted ? 3 : 1
            }}
            radius={radius}
          >
            <Popup>
              <div>
                <strong>Tienda: {tienda.TIENDA_ID}</strong><br/>
                Estado: {tienda.EXITO === 1 ? 'Exitosa' : 'Mejorable'}<br/>
                Coordenadas: {tienda.LATITUD_NUM.toFixed(6)}, {tienda.LONGITUD_NUM.toFixed(6)}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}