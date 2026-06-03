'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../lib/api';
import { AlertTriangle, Users, MapPin, Database, Clock, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState({
    reports: [],
    provinces: [],
    sarBases: [],
    sessions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [repRes, provRes, sarRes, sessRes] = await Promise.all([
          adminApi.getReports(),
          adminApi.getProvinces(),
          adminApi.getSarBases(),
          adminApi.getSessions(),
        ]);

        setData({
          reports: repRes.success ? repRes.data : [],
          provinces: provRes.success ? provRes.data : [],
          sarBases: sarRes.success ? sarRes.data : [],
          sessions: sessRes.success ? sessRes.data : [],
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-400 font-medium text-xs">Memuat Data Analitik...</p>
      </div>
    );
  }

  // Aggregate Stats
  const totalReports = data.reports.length;
  const pendingReports = data.reports.filter(r => r.status === 'pending').length;
  const analyzedReports = data.reports.filter(r => r.status === 'analyzed').length;
  const clusteredReports = data.reports.filter(r => r.status === 'clustered').length;
  const resolvedReports = data.reports.filter(r => r.status === 'resolved').length;

  const totalProvinces = data.provinces.length;
  const totalSarBases = data.sarBases.length;
  const totalSessions = data.sessions.length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
          Ringkasan Operasional
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Dashboard Analitik</h1>
        <p className="text-xs text-slate-400 mt-1">
          Pantau status penanganan dampak bencana secara spasial, pemrosesan deep learning, dan alokasi Posko SAR.
        </p>
      </div>

      {/* Grid 1: Basic Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Reports */}
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Laporan</span>
            <div className="bg-blue-950 p-2 rounded-xl text-blue-400 border border-blue-900/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">{totalReports}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Laporan dari masyarakat</p>
        </div>

        {/* Card 2: Provinces */}
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provinsi</span>
            <div className="bg-green-950 p-2 rounded-xl text-green-400 border border-green-900/30">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">{totalProvinces}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Wilayah operasional</p>
        </div>

        {/* Card 3: SAR Bases */}
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Posko SAR</span>
            <div className="bg-indigo-950 p-2 rounded-xl text-indigo-400 border border-indigo-900/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">{totalSarBases}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Posko penyelamatan</p>
        </div>

        {/* Card 4: Sesi Klaster */}
        <div className="bg-[#0b1329]/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sesi Klaster</span>
            <div className="bg-amber-950 p-2 rounded-xl text-amber-400 border border-amber-900/30">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white">{totalSessions}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Pemrosesan machine learning</p>
        </div>
      </div>

      {/* Grid 2: Detailed Stats of Reports Status */}
      <div className="bg-[#0a0f1d]/40 border border-slate-900 rounded-2xl p-6">
        <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider mb-4">
          Status Alur Penanganan Laporan Dampak Bencana
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-center mb-1 text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-xl font-black text-white">{pendingReports}</h4>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Pending (Belum Di-AI)</span>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-center mb-1 text-blue-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="text-xl font-black text-blue-400">{analyzedReports}</h4>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Analyzed (Selesai AI)</span>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-center mb-1 text-amber-500">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-xl font-black text-amber-500">{clusteredReports}</h4>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Clustered (Masuk Klaster)</span>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-center mb-1 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-xl font-black text-green-400">{resolvedReports}</h4>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1 block">Resolved (Selesai Penanganan)</span>
          </div>
        </div>
      </div>

      {/* Grid 3: Fast Navigation Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shortcut Left */}
        <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-300">Penanganan Cepat Laporan</h3>
          <p className="text-xs text-slate-400">
            Periksa laporan bencana terbaru dari masyarakat, ubah status penanganan, atau lihat foto hasil klasifikasi AI.
          </p>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2.5 rounded-xl border border-blue-900/30 transition-all"
          >
            Buka Daftar Laporan <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Shortcut Right */}
        <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-sm text-slate-300">Sesi Clustering Spasial ML</h3>
          <p className="text-xs text-slate-400">
            Jalankan algoritma clustering spasial K-Means / DBSCAN untuk memetakan konsentrasi keparahan bencana di lapangan.
          </p>
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1 text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-900/30 transition-all"
          >
            Buka Panel Sesi ML <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
