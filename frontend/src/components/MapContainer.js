'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Reusable SVG markers for premium styling
const createCustomIcon = (color, isSar = false) => {
  const html = isSar
    ? `<div style="background-color: #3b82f6; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
       </div>`
    : `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
         <div style="background-color: white; width: 8px; height: 8px; border-radius: 50%;"></div>
       </div>`;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const colors = {
  red: '#ef4444',
  yellow: '#f59e0b',
  green: '#10b981',
  blue: '#3b82f6',
  unknown: '#94a3b8',
};

export default function InteractiveMap({ clusters = [], sarBases = [] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[500px] bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 animate-pulse">
        <p className="text-slate-400 font-medium">Memuat Peta Interaktif...</p>
      </div>
    );
  }

  // Calculate center of map based on available clusters/reports
  let mapCenter = [-2.5489, 118.0149]; // Default center of Indonesia
  let mapZoom = 5;

  if (clusters.length > 0) {
    const validCoords = clusters.filter(c => c.centroid_lat && c.centroid_long);
    if (validCoords.length > 0) {
      const latSum = validCoords.reduce((acc, c) => acc + parseFloat(c.centroid_lat), 0);
      const lngSum = validCoords.reduce((acc, c) => acc + parseFloat(c.centroid_long), 0);
      mapCenter = [latSum / validCoords.length, lngSum / validCoords.length];
      mapZoom = 9;
    }
  }

  return (
    <div className="w-full h-full min-h-[500px] border border-slate-700 rounded-xl overflow-hidden relative shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Render SAR Bases */}
        {sarBases.map((base) => (
          <Marker
            key={`sar-${base.id}`}
            position={[parseFloat(base.latitude), parseFloat(base.longitude)]}
            icon={createCustomIcon('#3b82f6', true)}
          >
            <Popup>
              <div className="p-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-900 text-blue-200 mb-2">
                  Basis Posko SAR
                </span>
                <h4 className="font-bold text-slate-100 text-sm">{base.name}</h4>
                <p className="text-xs text-slate-300 mt-1">Latitude: {parseFloat(base.latitude).toFixed(6)}</p>
                <p className="text-xs text-slate-300">Longitude: {parseFloat(base.longitude).toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Render Clusters & Reports */}
        {clusters.map((cluster) => {
          const color = colors[cluster.priority_level] || colors.unknown;

          return (
            <div key={`cluster-group-${cluster.id}`}>
              {/* Circle highlighting the cluster boundary */}
              {cluster.centroid_lat && cluster.centroid_long && (
                <Circle
                  center={[parseFloat(cluster.centroid_lat), parseFloat(cluster.centroid_long)]}
                  radius={parseFloat(cluster.radius_meter || '1000')}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                />
              )}

              {/* Render each report in the cluster */}
              {cluster.reports?.map((report) => {
                const reportColor = colors[cluster.priority_level] || colors.unknown;

                return (
                  <div key={`report-layer-${report.id}`}>
                    <Marker
                      position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
                      icon={createCustomIcon(reportColor)}
                    >
                      <Popup>
                        <div className="p-2 w-64 max-h-[350px] overflow-y-auto">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              cluster.priority_level === 'red' ? 'bg-red-900 text-red-200' :
                              cluster.priority_level === 'yellow' ? 'bg-yellow-900 text-yellow-200' :
                              'bg-green-900 text-green-200'
                            }`}>
                              Prioritas: {cluster.priority_level}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              ID: #{report.id}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-slate-100 text-sm mt-1">{report.reporter_name}</h4>
                          <p className="text-xs text-slate-300 font-medium bg-slate-800 p-1 rounded mt-1">
                            Kategori: {report.category === 'building_damage' ? 'Kerusakan Bangunan' : 'Kerusakan Infrastruktur'}
                          </p>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-3 italic">
                            "{report.description || 'Tidak ada deskripsi'}"
                          </p>

                          {/* Photos if any */}
                          {report.photos && report.photos.length > 0 && (
                            <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                              {report.photos.map((p, idx) => (
                                <img
                                  key={idx}
                                  src={p.url.startsWith('http') ? p.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${p.url}`}
                                  alt="Report Photo"
                                  className="w-16 h-12 object-cover rounded border border-slate-600 flex-shrink-0"
                                />
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-1.5 rounded mt-2 border border-slate-700 text-[10px]">
                            <div>💀 Fatal: {report.fatalities}</div>
                            <div>🤕 Luka: {report.injured}</div>
                            <div>🔍 Hilang: {report.missing}</div>
                            <div>⛺ Evakuasi: {report.evacuees}</div>
                          </div>

                          {/* Recommendations to SAR bases */}
                          {report.recommendations && report.recommendations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                              <h5 className="font-bold text-slate-200 text-[10px] uppercase">Rekomendasi Posko Terdekat:</h5>
                              <ol className="text-[10px] text-slate-300 mt-1 pl-3 list-decimal space-y-0.5">
                                {report.recommendations.slice(0, 2).map((rec, rIdx) => (
                                  <li key={rIdx}>
                                    <span className="font-semibold">{rec.sar_base_name}</span> ({rec.distance_km.toFixed(1)} km)
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>

                    {/* 3. Render connection lines (Polyline) to the Rank 1 recommended SAR base */}
                    {report.recommendations?.length > 0 && (
                      <Polyline
                        positions={[
                          [parseFloat(report.latitude), parseFloat(report.longitude)],
                          [
                            parseFloat(report.recommendations[0].sar_base_latitude),
                            parseFloat(report.recommendations[0].sar_base_longitude)
                          ]
                        ]}
                        pathOptions={{
                          color: '#3b82f6',
                          weight: 1.5,
                          opacity: 0.4,
                          dashArray: '4, 8'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
