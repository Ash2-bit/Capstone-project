'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api';
import Link from 'next/link';
import { Plus, Database, Sparkles, AlertTriangle, Eye, Trash2, Calendar, Clock, BarChart } from 'lucide-react';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [provinceId, setProvinceId] = useState('');
  const [algorithm, setAlgorithm] = useState('K-Means');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ML Parameters states
  const [nClusters, setNClusters] = useState(3);
  const [eps, setEps] = useState(0.5);
  const [minSamples, setMinSamples] = useState(2);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, provRes] = await Promise.all([
        adminApi.getSessions(),
        adminApi.getProvinces(),
      ]);

      if (sessRes.success) setSessions(sessRes.data);
      if (provRes.success) setProvinces(provRes.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data sesi ML.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!provinceId || !algorithm || !startDate || !endDate) {
      return setError('Harap isi semua kolom wajib.');
    }

    setIsSubmitting(true);

    // Build algorithm parameters object based on selected algorithm
    const parameters = {};
    if (algorithm === 'K-Means') {
      parameters.n_clusters = parseInt(nClusters, 10);
    } else if (algorithm === 'DBSCAN') {
      parameters.eps = parseFloat(eps);
      parameters.min_samples = parseInt(minSamples, 10);
    }

    const payload = {
      province_id: provinceId,
      algorithm,
      parameters,
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const res = await adminApi.createSession(payload);
      if (res.success) {
        setSuccess('Sesi baru berhasil dibuat! Proses perhitungan klaster dan alokasi SAR sedang berjalan asinkron di latar belakang.');
        // Reset form
        setProvinceId('');
        setStartDate('');
        setEndDate('');
        setNClusters(3);
        setEps(0.5);
        setMinSamples(2);
        // Refresh list
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Gagal memulai sesi clustering.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi clustering ini beserta seluruh klaster di dalamnya?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await adminApi.deleteSession(id);
      if (res.success) {
        setSuccess('Sesi clustering berhasil dihapus.');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus sesi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
          Kecerdasan Buatan (ML)
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Sesi Clustering Spasial</h1>
        <p className="text-xs text-slate-400 mt-1">
          Jalankan pemetaan sebaran spasial bencana (K-Means atau DBSCAN) untuk mengelompokkan area terdampak dan alokasikan Posko SAR secara cerdas.
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-green-950/40 border border-green-800 text-green-300 rounded-xl text-xs font-semibold leading-relaxed">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs font-semibold">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Initiate New ML Session */}
        <div className="bg-[#0b1329]/40 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Jalankan Sesi Klaster Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="province" className="text-[10px] font-bold text-slate-400 block mb-1">Wilayah Provinsi *</label>
              <select
                id="province"
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              >
                <option value="" disabled>Pilih Provinsi</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id.toString()}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start_date" className="text-[10px] font-bold text-slate-400 block mb-1">Tanggal Mulai *</label>
                <input
                  type="date"
                  id="start_date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
              <div>
                <label htmlFor="end_date" className="text-[10px] font-bold text-slate-400 block mb-1">Tanggal Akhir *</label>
                <input
                  type="date"
                  id="end_date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="algorithm" className="text-[10px] font-bold text-slate-400 block mb-1">Algoritma Pengelompokan *</label>
              <select
                id="algorithm"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="K-Means">K-Means Spasial</option>
                <option value="DBSCAN">DBSCAN Kepadatan Spasial</option>
              </select>
            </div>

            {/* Dynamic Algorithm parameters inputs */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2 tracking-wider">
                Parameter Algoritma {algorithm}
              </span>

              {algorithm === 'K-Means' ? (
                <div>
                  <label htmlFor="n_clusters" className="text-[9px] font-bold text-slate-500 block mb-1">Jumlah Klaster (n_clusters)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    id="n_clusters"
                    value={nClusters}
                    onChange={(e) => setNClusters(parseInt(e.target.value || '1', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="eps" className="text-[9px] font-bold text-slate-500 block mb-1">Radius (Eps)</label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      id="eps"
                      value={eps}
                      onChange={(e) => setEps(e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="min_samples" className="text-[9px] font-bold text-slate-500 block mb-1">Min Laporan</label>
                    <input
                      type="number"
                      min="1"
                      id="min_samples"
                      value={minSamples}
                      onChange={(e) => setMinSamples(parseInt(e.target.value || '1', 10))}
                      className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              <Database className="w-4 h-4" /> {isSubmitting ? 'Memproses...' : 'Proses Sesi ML'}
            </button>
          </form>
        </div>

        {/* Right List Table: Historical Sessions */}
        <div className="lg:col-span-2 bg-[#0b1329]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0a0f1d] border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
              Riwayat Sesi Pemrosesan Klaster ({sessions.length})
            </h3>
            <button
              onClick={loadData}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] font-extrabold text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-750 transition-all flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Memuat data...</div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-700" />
              Belum ada sesi clustering ML yang diproses.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {sessions.map((sess) => {
                const isProcessed = sess.processed_at !== null;
                return (
                  <div key={sess.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col hover:border-slate-750 transition-colors text-xs space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-blue-500" />
                          <h4 className="font-extrabold text-slate-200 text-sm">{sess.provinces?.name}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">#{sess.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                          <span>Algoritma: {sess.algorithm}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {sess.start_date.split('T')[0]} s/d {sess.end_date.split('T')[0]}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isProcessed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-green-950/40 text-green-400 border border-green-900/30 uppercase tracking-widest">
                            ✓ Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-950/40 text-amber-400 border border-amber-900/30 uppercase tracking-widest animate-pulse">
                            ⏳ Diproses
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics block */}
                    {isProcessed && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 text-[10px]">
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase">Silhouette</span>
                          <span className="font-extrabold text-green-400">{sess.silhouette_score?.toFixed(4) || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase">DB Index</span>
                          <span className="font-extrabold text-slate-200">{sess.davies_bouldin_index?.toFixed(4) || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase">Laporan</span>
                          <span className="font-bold text-slate-200">{sess.total_reports_processed} item</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block uppercase">Waktu</span>
                          <span className="font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sess.processing_time_ms} ms
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                      <div>
                        {isProcessed && (
                          <Link
                            href={`/reports/${sess.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <BarChart className="w-3.5 h-3.5" /> Lihat Hasil PDF Cetak
                          </Link>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(sess.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
