'use client';

import { useEffect, useState } from 'react';
import { adminApi, getStorageUrl } from '../../../lib/api';
import { AlertTriangle, Eye, Trash2, ShieldAlert, Sparkles, MapPin, Check, Phone, ArrowLeft } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit states for detail panel
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [fatalities, setFatalities] = useState(0);
  const [injured, setInjured] = useState(0);
  const [missing, setMissing] = useState(0);
  const [evacuees, setEvacuees] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports();
      if (res.success) {
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleViewDetail = async (id) => {
    setLoadingDetail(true);
    setSelectedReportId(id);
    setError('');
    setSuccess('');

    try {
      const res = await adminApi.getReportById(id);
      if (res.success) {
        const rep = res.data;
        setSelectedReport(rep);
        setStatus(rep.status);
        setSeverity(rep.overall_severity);
        setFatalities(rep.fatalities);
        setInjured(rep.injured);
        setMissing(rep.missing);
        setEvacuees(rep.evacuees);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat detail laporan.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      status,
      overall_severity: severity,
      fatalities,
      injured,
      missing,
      evacuees,
    };

    try {
      const res = await adminApi.updateReport(selectedReport.id, payload);
      if (res.success) {
        setSuccess('Laporan berhasil diperbarui.');
        // Refresh detail
        handleViewDetail(selectedReport.id);
        // Refresh list
        fetchReports();
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui laporan.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan bencana ini?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await adminApi.deleteReport(id);
      if (res.success) {
        setSuccess('Laporan berhasil dihapus.');
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport(null);
          setSelectedReportId(null);
        }
        fetchReports();
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus laporan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
            Operasional Kebencanaan
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Manajemen Laporan</h1>
          <p className="text-xs text-slate-400 mt-1">
            Validasi laporan masuk dari publik, lihat foto prediksi keparahan AI, dan koordinasikan dengan tim SAR.
          </p>
        </div>

        {selectedReport && (
          <button
            onClick={() => { setSelectedReport(null); setSelectedReportId(null); }}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali Ke Daftar
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3 bg-green-950/40 border border-green-800 text-green-300 rounded-xl text-xs font-semibold">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs font-semibold">
          ⚠ {error}
        </div>
      )}

      {/* Main Grid View */}
      {selectedReport ? (
        /* ====================================================
           DETAIL REPORT PANEL VIEW
           ==================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Columns: Photo Analysis & SAR Recs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chronology Detail */}
            <div className="bg-[#0b1329]/40 border border-slate-800 p-6 rounded-2xl space-y-3">
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300">
                {selectedReport.category === 'building_damage' ? 'Kerusakan Bangunan' : 'Kerusakan Infrastruktur'}
              </span>
              <h3 className="text-lg font-black text-slate-100">{selectedReport.reporter_name}</h3>
              
              {selectedReport.reporter_phone && (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5" /> Telp: {selectedReport.reporter_phone}
                </div>
              )}
              {selectedReport.reporter_address && (
                <p className="text-xs text-slate-400 font-medium">
                  Alamat Pelapor: {selectedReport.reporter_address}
                </p>
              )}

              <p className="text-xs text-slate-350 bg-slate-900/60 p-4 rounded-xl leading-relaxed italic mt-4">
                "{selectedReport.description || 'Tidak ada deskripsi kejadian.'}"
              </p>

              <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-2">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                Lokasi: {parseFloat(selectedReport.latitude).toFixed(6)}, {parseFloat(selectedReport.longitude).toFixed(6)}
              </div>
            </div>

            {/* Photos & AI predictions list */}
            <div className="bg-[#0b1329]/40 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Analisis Foto Kerusakan AI (FastAPI Model-V1)
              </h3>

              {selectedReport.report_photos?.length === 0 ? (
                <p className="text-xs text-slate-550 italic">Tidak ada lampiran foto kerusakan.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.report_photos?.map((photo) => (
                    <div key={photo.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="aspect-video w-full relative bg-slate-950">
                        <img
                          src={getStorageUrl(photo.photo_path)}
                          alt="Bencana"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-semibold">Tingkat Parah AI:</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            photo.severity === 'berat' ? 'bg-red-950 text-red-400 border border-red-900/35' :
                            photo.severity === 'sedang' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/35' :
                            photo.severity === 'ringan' ? 'bg-green-950 text-green-400 border border-green-900/35' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {photo.severity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-semibold">Confidence Score:</span>
                          <span className="font-extrabold text-slate-200">
                            {photo.confidence_score !== null ? `${photo.confidence_score.toFixed(1)}%` : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                          <span>Versi Model:</span>
                          <span>{photo.model_version || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations nearest SAR */}
            <div className="bg-[#0b1329]/40 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-500" />
                Rekomendasi Alokasi Penyelamatan Posko SAR Terdekat
              </h3>

              {selectedReport.sar_recommendations?.length === 0 ? (
                <div className="p-4 bg-slate-900/20 border border-slate-850 rounded-xl text-xs text-slate-500 italic text-center">
                  Rekomendasi belum dihitung. Jalankan clustering spasial untuk menghasilkan rekomendasi Posko SAR otomatis.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedReport.sar_recommendations
                    ?.sort((a, b) => a.rank - b.rank)
                    .map((rec) => (
                      <div key={rec.id} className="bg-slate-900/40 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-black text-slate-200 block">
                            {rec.rank}. {rec.sar_bases?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{rec.sar_bases?.address}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Jarak</span>
                          <span className="font-black text-blue-400 text-sm">{rec.distance_km.toFixed(2)} km</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Update details & impact */}
          <div className="bg-[#0b1329]/40 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
              Ubah Status & Dampak Laporan
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor="status" className="text-[10px] font-bold text-slate-400 block mb-1">Status Laporan *</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="pending">Pending (Menunggu AI)</option>
                  <option value="analyzed">Analyzed (Selesai AI)</option>
                  <option value="clustered">Clustered (Masuk Klaster)</option>
                  <option value="resolved">Resolved (Selesai Mitigasi)</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="text-[10px] font-bold text-slate-400 block mb-1">Tingkat Keparahan Bencana *</label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="unknown">Unknown</option>
                  <option value="ringan">Ringan</option>
                  <option value="sedang">Sedang</option>
                  <option value="berat">Berat</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fatalities" className="text-[10px] font-bold text-slate-400 block mb-1">Korban Meninggal</label>
                  <input
                    type="number"
                    min="0"
                    id="fatalities"
                    value={fatalities}
                    onChange={(e) => setFatalities(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="injured" className="text-[10px] font-bold text-slate-400 block mb-1">Korban Luka-Luka</label>
                  <input
                    type="number"
                    min="0"
                    id="injured"
                    value={injured}
                    onChange={(e) => setInjured(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="missing" className="text-[10px] font-bold text-slate-400 block mb-1">Orang Hilang</label>
                  <input
                    type="number"
                    min="0"
                    id="missing"
                    value={missing}
                    onChange={(e) => setMissing(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="evacuees" className="text-[10px] font-bold text-slate-400 block mb-1">Jumlah Pengungsi</label>
                  <input
                    type="number"
                    min="0"
                    id="evacuees"
                    value={evacuees}
                    onChange={(e) => setEvacuees(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                <Check className="w-4 h-4" /> Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ====================================================
           REPORTS TABLE LIST VIEW
           ==================================================== */
        <div className="bg-[#0b1329]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Memuat data...</div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-700" />
              Belum ada laporan bencana masuk dari masyarakat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Reporter</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Provinsi</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">💀 Fatal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-550">#{report.id}</td>
                      <td className="px-4 py-4 font-bold text-slate-200">{report.reporter_name}</td>
                      <td className="px-4 py-4 font-medium text-slate-450">
                        {report.category === 'building_damage' ? 'Bangunan' : 'Infrastruktur'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-300">
                        {report.provinces?.name || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          report.overall_severity === 'berat' ? 'bg-red-950 text-red-400 border border-red-900/35' :
                          report.overall_severity === 'sedang' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/35' :
                          report.overall_severity === 'ringan' ? 'bg-green-950 text-green-400 border border-green-900/35' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {report.overall_severity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          report.status === 'resolved' ? 'bg-green-900/30 text-green-400 border border-green-900/20' :
                          report.status === 'clustered' ? 'bg-amber-900/30 text-amber-400 border border-amber-900/20' :
                          report.status === 'analyzed' ? 'bg-blue-900/30 text-blue-400 border border-blue-900/20' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-black text-center text-slate-200">{report.fatalities}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(report.id)}
                            className="bg-slate-800/60 hover:bg-slate-700/85 text-slate-200 p-1.5 rounded-lg border border-slate-700/60 transition-all"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-1.5 rounded-lg border border-red-900/30 transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
