'use client';

import dynamic from 'next/dynamic';

const ReportMapContainer = dynamic(
  () => import('./ReportMapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 animate-pulse min-h-[300px]">
        <p className="text-slate-400 font-medium">Memuat Peta Pemilih Lokasi...</p>
      </div>
    )
  }
);

export default function ReportMap({ latitude, longitude, onLocationSelect }) {
  return (
    <ReportMapContainer 
      latitude={latitude} 
      longitude={longitude} 
      onLocationSelect={onLocationSelect} 
    />
  );
}
