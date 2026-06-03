'use client';

import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(
  () => import('./MapContainer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 animate-pulse">
        <p className="text-slate-400 font-medium">Memuat Peta...</p>
      </div>
    )
  }
);

export default function Map({ clusters, sarBases }) {
  return <InteractiveMap clusters={clusters} sarBases={sarBases} />;
}
