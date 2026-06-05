'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
           <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
         </div>`,
  className: 'custom-pin-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function ReportMapContainer({ latitude, longitude, onLocationSelect }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 animate-pulse min-h-[300px]">
        <p className="text-slate-400 font-medium">Memuat Peta Pemilih Lokasi...</p>
      </div>
    );
  }

  const defaultCenter = latitude && longitude ? [latitude, longitude] : [-2.5489, 118.0149]; // Center of Indonesia
  const defaultZoom = latitude && longitude ? 15 : 5;

  return (
    <div className="w-full h-full min-h-[300px] border border-slate-700 rounded-xl overflow-hidden shadow-inner relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickHandler onLocationSelect={onLocationSelect} />

        {latitude && longitude && (
          <Marker position={[latitude, longitude]} icon={pinIcon} />
        )}
      </MapContainer>
    </div>
  );
}
