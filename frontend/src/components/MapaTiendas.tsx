'use client';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Tienda {
  LATITUD_NUM: number;
  LONGITUD_NUM: number;
  TIENDA_ID: string;
  EXITO: number;
}

export default function MapaTiendas({ data }: { data: Tienda[] }) {
  const latProm = data.reduce((sum, t) => sum + t.LATITUD_NUM, 0) / data.length;
  const lonProm = data.reduce((sum, t) => sum + t.LONGITUD_NUM, 0) / data.length;
  const coordsSet = new Set<string>();

  return (
    <MapContainer 
      center={[latProm, lonProm]} 
      zoom={6} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '0.5rem' // Para que coincida con el border-radius del contenedor
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.map((tienda, idx) => {
        const coordKey = `${tienda.LATITUD_NUM},${tienda.LONGITUD_NUM}`;
        if (coordsSet.has(coordKey)) return null;
        coordsSet.add(coordKey);
        const color = tienda.EXITO === 1 ? 'green' : 'red';
        return (
          <CircleMarker
            key={idx}
            center={[tienda.LATITUD_NUM, tienda.LONGITUD_NUM] as [number, number]}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
            radius={5}
          >
            <Popup>Tienda: {tienda.TIENDA_ID}</Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}