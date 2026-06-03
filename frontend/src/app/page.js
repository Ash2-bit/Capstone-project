'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicApi } from '../lib/api';
import Map from '../components/Map';
import { Activity, AlertTriangle, Database, Globe, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [mapData, setMapData] = useState({ clusters: [], sar_bases: [], session: null });
  const [loadingMap, setLoadingMap] = useState(false);

  // Fetch initial home statistics & sessions
  useEffect(() => {
    async function loadHomeData() {
      try {
        const res = await publicApi.getHomeStats();
        if (res.success) {
          setStats(res.data);
          // Set initial session if available
          if (res.data.sessions && res.data.sessions.length > 0) {
            setSelectedSessionId(res.data.sessions[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Fetch map data when selected session changes
  useEffect(() => {
    if (!selectedSessionId) return;

    async function loadMapData() {
      setLoadingMap(true);
      try {
        const res = await publicApi.getMapData(selectedSessionId);
        if (res.success) {
          setMapData(res);
        }
      } catch (error) {
        console.error('Failed to load map data:', error);
      } finally {
        setLoadingMap(false);
      }
    }
    loadMapData();
  }, [selectedSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Menghubungkan ke Sistem Sapulidiku...</p>
      </div>
    );
  }

  const activeSession = mapData.session;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Premium Header */}
      <header className="border-b border-slate-800 bg-[#0b1329]/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                SAPULIDIKU
              </span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-900/50 text-blue-300 border border-blue-800/30 uppercase tracking-widest">
                JS Edition
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Beranda
            </Link>
            <Link href="/report" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Laporkan Bencana
            </Link>
            <Link
              href="/admin/dashboard"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
            >
              Dashboard Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-800/50 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Analisis Klaster & Rekomendasi Posko SAR
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
              Akselerasi Koordinasi Penyelamatan Dengan{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Kecerdasan Buatan
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 mb-8 leading-relaxed">
              Sapulidiku mengelompokkan laporan dampak bencana secara spasial menggunakan algoritma K-Means / DBSCAN,
              menganalisis keparahan foto secara otomatis dengan Deep Learning, serta memberikan rekomendasi Posko SAR terdekat.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/report"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Kirim Laporan Publik
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 hover:border-slate-700/80 transition-all duration-200">
              <div className="bg-red-950/60 p-3.5 rounded-xl border border-red-900/30 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{stats?.totalReports || 0}</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Total Laporan Masuk</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 hover:border-slate-700/80 transition-all duration-200">
              <div className="bg-blue-950/60 p-3.5 rounded-xl border border-blue-900/30 text-blue-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{stats?.totalSessions || 0}</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Sesi Klaster Aktif</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 hover:border-slate-700/80 transition-all duration-200">
              <div className="bg-green-950/60 p-3.5 rounded-xl border border-green-900/30 text-green-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">{stats?.totalProvinces || 0}</h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Provinsi Tercover</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Map & Selector */}
      <section className="py-8 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  Sebaran Klaster Kebencanaan Spasial
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih sesi clustering di bawah untuk melihat sebaran daerah terdampak dan rekomendasi penanganan SAR.
                </p>
              </div>

              {/* Session Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="session-select" className="text-xs font-bold text-slate-400">Sesi:</label>
                <select
                  id="session-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="" disabled>Pilih Sesi Clustering</option>
                  {stats?.sessions?.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.provinces?.name} - {s.algorithm} ({s.start_date.split('T')[0]} s/d {s.end_date.split('T')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session Meta Information Block */}
            {activeSession && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-2xl mb-6 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Wilayah Analisis</span>
                  <span className="font-extrabold text-slate-200">{activeSession.province}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Algoritma Klaster</span>
                  <span className="font-extrabold text-blue-400 uppercase">{activeSession.algorithm}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Metrik Silhouette Score</span>
                  <span className="font-extrabold text-green-400">
                    {activeSession.silhouette_score !== null ? activeSession.silhouette_score.toFixed(4) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-0.5">Total Laporan Diproses</span>
                  <span className="font-extrabold text-white">{activeSession.total_reports_processed} Laporan</span>
                </div>
              </div>
            )}

            {/* Map Container Wrapper */}
            <div className="h-[500px] w-full relative">
              {loadingMap && (
                <div className="absolute inset-0 bg-[#090d16]/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-xl">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-3 text-xs text-slate-300 font-medium">Memperbarui Data Peta...</p>
                </div>
              )}

              {mapData.clusters?.length > 0 ? (
                <Map clusters={mapData.clusters} sarBases={mapData.sar_bases} />
              ) : (
                <div className="w-full h-full bg-slate-900/50 rounded-xl flex flex-col items-center justify-center border border-slate-800">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mb-2" />
                  <p className="text-slate-400 font-medium text-sm">Tidak ada klaster untuk ditampilkan.</p>
                  <p className="text-slate-500 text-xs mt-1">Pilih sesi lain atau buat sesi baru dari dashboard admin.</p>
                </div>
              )}
            </div>

            {/* Printable Report Button Link */}
            {selectedSessionId && mapData.clusters?.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/reports/${selectedSessionId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Buka Laporan Cetak Komprehensif
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#05070e] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Sapulidiku. Ditenagai oleh Next.js, Express.js, Prisma, dan Python Machine Learning Service.</p>
        </div>
      </footer>
    </div>
  );
}
