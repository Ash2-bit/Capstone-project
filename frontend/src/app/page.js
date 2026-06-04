'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { publicApi } from '../lib/api';

// Dynamically import map (no SSR)
const InteractiveMap = dynamic(() => import('../components/MapContainer'), { ssr: false });

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1500;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('id-ID')}{suffix}</span>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [mapData, setMapData] = useState({ clusters: [], sar_bases: [], session: null });
  const [loadingMap, setLoadingMap] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sticky nav scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch initial stats
  useEffect(() => {
    async function loadHomeData() {
      try {
        const res = await publicApi.getHomeStats();
        if (res.success) {
          setStats(res.data);
          if (res.data.sessions?.length > 0) {
            setSelectedSessionId(res.data.sessions[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Fetch map data on session change
  useEffect(() => {
    if (!selectedSessionId) return;
    async function loadMapData() {
      setLoadingMap(true);
      try {
        const res = await publicApi.getMapData(selectedSessionId);
        if (res.success) setMapData(res);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoadingMap(false);
      }
    }
    loadMapData();
  }, [selectedSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-indigo-400 animate-spin" style={{ animationDuration: '0.7s', animationDirection: 'reverse' }}></div>
        </div>
        <p className="text-slate-400 font-medium text-sm tracking-wide">Menghubungkan ke Sistem Sapulidiku...</p>
      </div>
    );
  }

  const activeSession = mapData.session;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 overflow-x-hidden">

      {/* ── Ambient Glow Blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[50vh] -left-48 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-32 right-0 w-[400px] h-[400px] bg-blue-500/8 rounded-full blur-[90px]"></div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#090d16]/95 backdrop-blur-xl border-b border-slate-800/80 shadow-xl shadow-black/30 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              S
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'system-ui' }}>
              Sapulidiku
            </span>
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-semibold text-blue-400 transition-colors">Beranda</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Alur Kerja</a>
            <a href="#map-dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Peta Klaster</a>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              Laporkan Bencana
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZTI5M2IiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNCA0aC0ydi0yaDJ2MnptMC00aC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40 pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8 animate-fade-in">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Tanggap &amp; Solutif Terhadap Kebencanaan
        </div>

        {/* Heading */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mb-8"
          style={{ fontFamily: 'system-ui' }}
        >
          <span className="bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Sistem Pemetaan Spasial
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-300 bg-clip-text text-transparent">
            &amp; Pelaporan Bencana
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-12">
          Sapulidiku mengintegrasikan pelaporan masyarakat secara <span className="text-slate-200 font-semibold">real-time</span> dengan algoritma pemetaan AI untuk mengelompokkan area kerawanan bencana serta merekomendasikan markas SAR terdekat demi penanganan cepat.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#map-dashboard"
            className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Jelajahi Peta Klaster
          </a>
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 text-white font-bold px-8 py-4 rounded-2xl backdrop-blur-sm hover:-translate-y-1 transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Laporkan Kejadian Baru
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs">
          <span>Gulir ke bawah</span>
          <div className="w-5 h-8 border border-slate-600 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDuration: '1.5s' }}></div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. STATISTICS SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-0 pb-24 -mt-16 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card: Total Reports */}
            <div className="group relative bg-[#131a2c]/70 backdrop-blur-sm border border-[#1e3050] rounded-2xl p-8 text-center shadow-xl hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl mb-4 bg-gradient-to-br from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ stroke: 'url(#blueGrad)' }}>
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'system-ui' }}>
                <AnimatedCounter target={stats?.totalReports || 0} />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Total Laporan Masuk</div>
            </div>

            {/* Card: Provinces */}
            <div className="group relative bg-[#131a2c]/70 backdrop-blur-sm border border-[#1e3050] rounded-2xl p-8 text-center shadow-xl hover:-translate-y-2 hover:border-green-500/40 hover:shadow-green-500/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl mb-4">
                <svg className="w-10 h-10 mx-auto text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'system-ui' }}>
                <AnimatedCounter target={stats?.totalProvinces || 0} />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Provinsi Tercover</div>
            </div>

            {/* Card: Sessions */}
            <div className="group relative bg-[#131a2c]/70 backdrop-blur-sm border border-[#1e3050] rounded-2xl p-8 text-center shadow-xl hover:-translate-y-2 hover:border-indigo-500/40 hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-4xl mb-4">
                <svg className="w-10 h-10 mx-auto text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'system-ui' }}>
                <AnimatedCounter target={stats?.totalSessions || 0} />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Sesi Analisis AI</div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. HOW IT WORKS SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
              Alur Kerja Sistem
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5" style={{ fontFamily: 'system-ui' }}>
              <span className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                Alur Kerja Sistem Sapulidiku
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
              Bagaimana laporan bencana diolah secara cerdas untuk menghasilkan zonasi kerawanan dan tindakan SAR terarah.
            </p>
          </div>

          {/* Workflow Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (hidden on mobile) */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent hidden lg:block"></div>

            {[
              {
                num: '1',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                ),
                title: 'Pelaporan Publik',
                desc: 'Masyarakat mendokumentasikan dan melaporkan kejadian bencana secara langsung lengkap dengan foto bukti dan koordinat akurat GPS.',
                color: 'blue',
              },
              {
                num: '2',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                ),
                title: 'Klasterisasi Spasial',
                desc: 'Algoritma K-Means & DBSCAN mengelompokkan ribuan titik sebaran bencana menjadi zona-zona klaster kerawanan secara cerdas.',
                color: 'indigo',
              },
              {
                num: '3',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                ),
                title: 'Rekomendasi Rute SAR',
                desc: 'Sistem menghitung jarak tercepat dan mengurutkan markas tim SAR terdekat yang paling siap dideploy menuju pusat area klaster.',
                color: 'green',
              },
              {
                num: '4',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                title: 'Analisis Rekomendasi AI',
                desc: 'Kecerdasan buatan (LLM) menganalisis dampak kumulatif korban dan kerusakan untuk merumuskan aksi penyelamatan secara kritis.',
                color: 'yellow',
              },
            ].map((step) => (
              <div
                key={step.num}
                className={`group relative bg-[#131a2c]/50 border border-[#1e3050] rounded-2xl p-7 hover:bg-[#131a2c]/80 hover:border-${step.color}-500/30 hover:-translate-y-2 transition-all duration-300`}
              >
                {/* Step number bubble */}
                <div className={`absolute -top-5 left-7 w-10 h-10 bg-gradient-to-br ${
                  step.color === 'blue' ? 'from-blue-500 to-blue-700' :
                  step.color === 'indigo' ? 'from-indigo-500 to-indigo-700' :
                  step.color === 'green' ? 'from-emerald-500 to-emerald-700' :
                  'from-amber-500 to-amber-600'
                } rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg`}>
                  {step.num}
                </div>
                <div className={`mb-4 mt-2 ${
                  step.color === 'blue' ? 'text-blue-400' :
                  step.color === 'indigo' ? 'text-indigo-400' :
                  step.color === 'green' ? 'text-emerald-400' :
                  'text-amber-400'
                }`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {step.icon}
                  </svg>
                </div>
                <h3 className="font-black text-white text-lg mb-3" style={{ fontFamily: 'system-ui' }}>{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. MAP DASHBOARD SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section id="map-dashboard" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
              Peta Klaster Bencana
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5" style={{ fontFamily: 'system-ui' }}>
              <span className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                Dashboard Peta Hasil Klasterisasi
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
              Lihat sebaran klaster wilayah terdampak bencana dan optimasi alokasi unit penyelamatan di seluruh Indonesia.
            </p>
          </div>

          {/* Dashboard Container */}
          <div className="bg-[#0f1626]/80 border border-[#1e3050] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">

            {/* Dashboard Header */}
            <div className="bg-[#0b1120]/70 border-b border-[#1e3050] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]"></div>
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="font-bold text-slate-100">Visualisasi Spasial Bencana</span>
              </div>

              {/* Session Selector */}
              <div className="flex items-center gap-3">
                <label htmlFor="session-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Pilih Sesi:</label>
                <select
                  id="session-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="bg-[#0b1120] border border-[#1e3050] text-slate-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-w-[280px]"
                >
                  <option value="" disabled>-- Pilih Sesi Clustering --</option>
                  {stats?.sessions?.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.provinces?.name} — {s.algorithm?.toUpperCase()} ({s.start_date?.split('T')[0]} s/d {s.end_date?.split('T')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Meta Info */}
            {activeSession && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-[#1e3050]">
                {[
                  { label: 'Wilayah Analisis', value: activeSession.province, color: 'text-slate-200' },
                  { label: 'Algoritma Klaster', value: activeSession.algorithm?.toUpperCase(), color: 'text-blue-400' },
                  { label: 'Silhouette Score', value: activeSession.silhouette_score !== null ? activeSession.silhouette_score?.toFixed(4) : '—', color: 'text-green-400' },
                  { label: 'Total Laporan', value: `${activeSession.total_reports_processed} Laporan`, color: 'text-white' },
                ].map((item, i) => (
                  <div key={i} className={`px-6 py-4 border-r border-[#1e3050] last:border-r-0 ${i % 2 !== 0 ? 'border-t md:border-t-0' : ''}`}>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`font-black text-sm ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Map + Legend */}
            <div className="relative">
              <div className="relative h-[560px]">
                {loadingMap && (
                  <div className="absolute inset-0 bg-[#090d16]/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 rounded-b-3xl">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-300 font-medium">Memperbarui Data Peta...</p>
                  </div>
                )}

                {mapData.clusters?.length > 0 ? (
                  <InteractiveMap clusters={mapData.clusters} sarBases={mapData.sar_bases} />
                ) : (
                  <div className="w-full h-full bg-[#0b1120] flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <p className="text-slate-400 font-semibold">Tidak ada klaster untuk ditampilkan.</p>
                    <p className="text-slate-500 text-sm">Pilih sesi lain atau buat sesi baru dari dashboard admin.</p>
                  </div>
                )}
              </div>

              {/* Legend & Actions */}
              <div className="border-t border-[#1e3050] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0b1120]/60">
                {/* Severity Legend */}
                <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-400">
                  <span className="font-bold text-slate-300 mr-1">Tingkat Keparahan:</span>
                  {[
                    { color: 'bg-red-500', label: 'Berat', shadow: 'shadow-red-500/40' },
                    { color: 'bg-yellow-500', label: 'Sedang', shadow: 'shadow-yellow-500/40' },
                    { color: 'bg-emerald-500', label: 'Ringan', shadow: 'shadow-emerald-500/40' },
                    { color: 'bg-slate-400', label: 'Unknown', shadow: '' },
                    { color: 'bg-blue-500', label: 'Posko SAR', shadow: 'shadow-blue-500/40', square: true },
                  ].map((item) => (
                    <span key={item.label} className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 ${item.color} ${item.square ? 'rounded' : 'rounded-full'} shadow-md ${item.shadow}`}></span>
                      {item.label}
                    </span>
                  ))}
                </div>

                {/* Print Report Link */}
                {selectedSessionId && mapData.clusters?.length > 0 && (
                  <Link
                    href={`/reports/${selectedSessionId}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 rounded-xl transition-all whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Buka Laporan Cetak Komprehensif
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. PROFESSIONAL FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#060911] border-t border-[#1e3050] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-14">

            {/* Brand Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30">
                  S
                </div>
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'system-ui' }}>
                  Sapulidiku
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Sistem Pelaporan &amp; Klasterisasi Bencana berbasis kecerdasan buatan untuk optimasi respons tim SAR Indonesia.
              </p>
            </div>

            {/* Navigasi */}
            <div>
              <h4 className="font-black text-white text-sm uppercase tracking-widest mb-5">Navigasi</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Beranda', href: '/' },
                  { label: 'Alur Kerja', href: '#how-it-works' },
                  { label: 'Peta Klaster', href: '#map-dashboard' },
                  { label: 'Kirim Laporan', href: '/report' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 group">
                      <svg className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Teknologi */}
            <div>
              <h4 className="font-black text-white text-sm uppercase tracking-widest mb-5">Teknologi</h4>
              <ul className="space-y-3">
                {['Next.js 15 (Frontend)', 'Express.js (Backend)', 'Prisma ORM', 'Python FastAPI (ML)', 'Leaflet.js (Maps)', 'PostgreSQL / MySQL'].map((tech) => (
                  <li key={tech} className="text-slate-400 text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#1e3050]/70 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Sapulidiku. Seluruh hak cipta dilindungi.</p>
            <p className="text-slate-600">Ditenagai oleh Next.js, Express.js, Prisma &amp; Python ML Service</p>
            <Link href="/admin/dashboard" className="text-slate-400 hover:text-blue-400 font-medium transition-colors">
              Dashboard Admin →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
