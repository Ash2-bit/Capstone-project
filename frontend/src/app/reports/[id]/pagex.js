'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi, getStorageUrl } from '../../../lib/api';
import { Activity, Printer, Calendar, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrintableReportPage() {
  const params = useParams();
  const sessionId = params.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    async function loadReport() {
      try {
        const res = await publicApi.getPrintableReport(sessionId);
        if (res.success) {
          setData(res);
        } else {
          setError('Gagal memuat detail laporan.');
        }
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan sistem.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Calculates victim ratio and formats to string, e.g. "15/504 (3%)"
   */
  const getRatioString = (value, total) => {
    if (!total) return `${value}/0 (0%)`;
    const percent = ((value / total) * 100).toFixed(0);
    return `${value}/${total} (${percent}%)`;
  };

  /**
   * Helper to parse and render raw Markdown text from Gemini AI LLM.
   */
  const renderMarkdown = (text) => {
    if (!text) return null;

    const parseBold = (str) => {
      // Replace **text** with <strong>text</strong>
      return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    return text.split('\n').map((line, idx) => {
      const content = line.trim();
      if (!content) return <div key={idx} className="h-1"></div>;

      // Header ###
      if (content.startsWith('###')) {
        const clean = content.replace(/^###\s*/, '');
        return (
          <h5 key={idx} className="font-black text-xs text-blue-400 print:text-blue-700 uppercase tracking-widest mt-4 mb-1.5">
            {clean}
          </h5>
        );
      }

      // Header ##
      if (content.startsWith('##')) {
        const clean = content.replace(/^##\s*/, '');
        return (
          <h4 key={idx} className="font-black text-xs text-slate-200 print:text-black uppercase tracking-wider mt-5 mb-2.5 border-b border-slate-800/80 print:border-slate-300 pb-1">
            {clean}
          </h4>
        );
      }

      // List Item
      if (content.startsWith('-') || content.startsWith('*')) {
        const clean = content.replace(/^[-*]\s*/, '');
        return (
          <li
            key={idx}
            className="list-disc ml-4 text-[11px] text-slate-300 print:text-slate-800 leading-relaxed mt-1"
            dangerouslySetInnerHTML={{ __html: parseBold(clean) }}
          />
        );
      }

      // Standard Paragraph
      return (
        <p
          key={idx}
          className="text-[11px] text-slate-350 print:text-slate-800 leading-relaxed mt-1.5"
          dangerouslySetInnerHTML={{ __html: parseBold(content) }}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-400 font-medium text-xs">Memformat Laporan Cetak...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
        <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-red-300 max-w-md text-center">
          <p className="font-bold">Error</p>
          <p className="text-xs mt-1">{error}</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold mt-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const { session, clusters, totals } = data;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 print:bg-white print:text-black">
      {/* Top action bar - hidden in print */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 print:hidden">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25"
        >
          <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
        </button>
      </div>

      {/* Main Report Container */}
      <div className="max-w-4xl mx-auto bg-slate-800/40 border border-slate-700/50 rounded-3xl p-8 print:p-0 print:border-none print:bg-white print:shadow-none shadow-2xl">

        {/* Header */}
        <div className="border-b border-slate-700 pb-6 mb-6 print:border-black flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase print:text-blue-600">
              LAPORAN RESMI KLASTER SPASIAL & REKOMENDASI SAR
            </span>
            <h1 className="text-2xl font-black text-white mt-1 print:text-black">
              SAPULIDIKU KEBENCANAAN
            </h1>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Periode Laporan: {session.start_date} s/d {session.end_date}
            </p>
          </div>
          <div className="text-right sm:text-right text-xs">
            <span className="text-slate-400 font-semibold block print:text-slate-600">Wilayah Provinsi</span>
            <span className="font-extrabold text-white text-sm print:text-black">{session.province}</span>
          </div>
        </div>

        {/* Aggregate Stats Section */}
        <div className="mb-8">
          <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider mb-3 print:text-black flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400 print:text-blue-600" />
            1. Ringkasan Dampak Kebencanaan Spasial
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 print:bg-slate-100 print:border-black">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">Total Klaster</span>
              <span className="text-lg font-black text-white mt-0.5 block print:text-black">{clusters.length}</span>
            </div>
            <div className="text-center border-l border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">Total Laporan</span>
              <span className="text-lg font-black text-white mt-0.5 block print:text-black">{totals.totalReports}</span>
            </div>
            <div className="text-center border-l border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">💀 Fatalities</span>
              <span className="text-lg font-black text-red-400 mt-0.5 block print:text-black">{totals.totalFatalities}</span>
            </div>
            <div className="text-center border-l border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">🤕 Luka-Luka</span>
              <span className="text-lg font-black text-yellow-400 mt-0.5 block print:text-black">{totals.totalInjured}</span>
            </div>
            <div className="text-center border-l border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">🔍 Hilang</span>
              <span className="text-lg font-black text-amber-500 mt-0.5 block print:text-black">{totals.totalMissing}</span>
            </div>
            <div className="text-center border-l border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase print:text-slate-600">⛺ Pengungsi</span>
              <span className="text-lg font-black text-blue-400 mt-0.5 block print:text-black">{totals.totalEvacuees}</span>
            </div>
          </div>
        </div>

        {/* Algorithm Analytics details */}
        <div className="mb-8">
          <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider mb-3 print:text-black flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400 print:text-blue-600" />
            2. Analitik Kinerja Algoritma Klaster
          </h3>

          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 print:bg-slate-50 print:border-black">
            <div>
              <span className="text-slate-400 font-semibold block print:text-slate-600">Model Algoritma:</span>
              <span className="font-bold text-white uppercase print:text-black">{session.algorithm}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block print:text-slate-600">Silhouette Score:</span>
              <span className="font-bold text-green-400 print:text-black">{session.silhouette_score !== null ? session.silhouette_score.toFixed(6) : '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block print:text-slate-600">Davies-Bouldin Index:</span>
              <span className="font-bold text-slate-200 print:text-black">{session.davies_bouldin_index !== null ? session.davies_bouldin_index.toFixed(6) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Detailed Cluster Listing */}
        <div className="mb-8">
          <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-wider mb-4 print:text-black">
            3. Daftar Detail Klaster Spasial Kejadian
          </h3>

          <div className="space-y-8">
            {clusters.map((cluster, cIdx) => (
              <div key={cluster.id} className="border border-slate-700/80 rounded-2xl overflow-hidden print:border-black print:break-inside-avoid">
                {/* Cluster Header */}
                <div className={`p-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 print:border-black ${cluster.priority_level === 'red' ? 'bg-red-950/20' :
                    cluster.priority_level === 'yellow' ? 'bg-yellow-950/20' :
                      'bg-green-950/20'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full inline-block ${cluster.priority_level === 'red' ? 'bg-red-500' :
                        cluster.priority_level === 'yellow' ? 'bg-yellow-500' :
                          'bg-green-500'
                      }`}></span>
                    <h4 className="font-black text-slate-100 text-sm print:text-black">
                      Klaster: {cluster.name}
                    </h4>
                  </div>

                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${cluster.priority_level === 'red' ? 'bg-red-900 text-red-200 print:bg-red-200 print:text-red-900' :
                      cluster.priority_level === 'yellow' ? 'bg-yellow-900 text-yellow-200 print:bg-yellow-200 print:text-yellow-900' :
                        'bg-green-900 text-green-200 print:bg-green-200 print:text-green-900'
                    }`}>
                    Prioritas {cluster.priority_level}
                  </span>
                </div>

                {/* Cluster Stats (Centroid, Radius, reports count) */}
                <div className="p-4 bg-slate-900/20 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border-b border-slate-800 print:border-black">
                  <div>
                    <span className="text-slate-400 font-semibold block print:text-slate-600">Centroid Koordinat</span>
                    <span className="font-semibold text-slate-200 print:text-black">
                      {parseFloat(cluster.centroid_lat).toFixed(6)}, {parseFloat(cluster.centroid_long).toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block print:text-slate-600">Estimasi Radius</span>
                    <span className="font-semibold text-slate-200 print:text-black">
                      {cluster.radius_meter ? `${cluster.radius_meter.toFixed(0)} meter` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block print:text-slate-600">Jumlah Laporan</span>
                    <span className="font-bold text-slate-200 print:text-black">{cluster.total_reports} Laporan</span>
                  </div>

                  {/* Victim ratios row */}
                  <div className="col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800/40 print:border-slate-300">
                    <div>
                      <span className="text-slate-400 font-semibold block print:text-slate-600">Meninggal (Rasio)</span>
                      <span className="font-bold text-red-400 print:text-black">
                        💀 {getRatioString(cluster.total_fatalities, totals.totalFatalities)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block print:text-slate-600">Luka-Luka (Rasio)</span>
                      <span className="font-bold text-yellow-400 print:text-black">
                        🤕 {getRatioString(cluster.total_injured, totals.totalInjured)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block print:text-slate-600">Hilang (Rasio)</span>
                      <span className="font-bold text-amber-500 print:text-black">
                        🔍 {getRatioString(cluster.total_missing, totals.totalMissing)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block print:text-slate-600">Mengungsi (Rasio)</span>
                      <span className="font-bold text-blue-400 print:text-black">
                        ⛺ {getRatioString(cluster.total_evacuees, totals.totalEvacuees)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI recommendation if generated - rendered as structured Markdown */}
                {cluster.ai_recommendation && (
                  <div className="p-4 bg-blue-950/20 border-b border-slate-800/80 text-xs leading-relaxed text-slate-350 print:bg-slate-100 print:border-black print:text-black">
                    <span className="font-extrabold text-[10px] text-blue-400 uppercase block mb-2 print:text-blue-700 tracking-wider">
                      Rekomendasi AI Penyelamatan (LLM):
                    </span>
                    <div className="space-y-1">
                      {renderMarkdown(cluster.ai_recommendation)}
                    </div>
                  </div>
                )}

                {/* Reports contained inside */}
                <div className="p-4 space-y-4">
                  <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest print:text-black mb-2">Daftar Rincian Laporan Klaster</h5>

                  {cluster.reports.map((report, rIdx) => (
                    <div key={report.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 print:border-slate-300 print:bg-white text-xs space-y-3">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-slate-100 text-sm print:text-black">{report.reporter_name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-medium">#{report.id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 print:bg-slate-200 print:text-slate-850">
                          {report.category === 'building_damage' ? 'Kerusakan Bangunan' : 'Kerusakan Infrastruktur'}
                        </span>
                      </div>

                      <p className="text-slate-350 print:text-slate-700 leading-relaxed italic">
                        "{report.description || 'Tidak ada deskripsi kejadian.'}"
                      </p>

                      {/* Render photos with AI severity badge and confidence score */}
                      {report.photos && report.photos.length > 0 && (
                        <div className="flex flex-wrap gap-3 py-1.5">
                          {report.photos.map((photo, pIdx) => (
                            <div key={pIdx} className="border border-slate-800/80 print:border-slate-300 rounded-xl overflow-hidden bg-slate-950/40 print:bg-slate-100 w-28 flex flex-col flex-shrink-0 shadow">
                              <div className="aspect-video w-full relative">
                                <img
                                  src={photo.url.startsWith('http') ? photo.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}${photo.url}`}
                                  alt="Dampak kerusakan"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-1.5 text-[9px] text-center space-y-0.5">
                                <div className="font-bold text-slate-450 print:text-slate-700 flex justify-between items-center text-[8px]">
                                  <span>AI Deteksi:</span>
                                  <span className={`px-1 rounded font-black text-[7px] uppercase ${photo.severity === 'berat' ? 'bg-red-950 text-red-400 print:bg-red-100 print:text-red-700' :
                                      photo.severity === 'sedang' ? 'bg-yellow-950 text-yellow-400 print:bg-yellow-100 print:text-yellow-700' :
                                        photo.severity === 'ringan' ? 'bg-green-950 text-green-400 print:bg-green-100 print:text-green-700' :
                                          'bg-slate-800 text-slate-400'
                                    }`}>
                                    {photo.severity || 'unknown'}
                                  </span>
                                </div>
                                {photo.confidence_score !== null && (
                                  <div className="text-slate-500 font-semibold text-[8px] flex justify-between items-center pt-0.5 border-t border-slate-900/30">
                                    <span>Confidence:</span>
                                    <span className="text-slate-300 print:text-slate-900">{photo.confidence_score.toFixed(2)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/50 p-2 rounded border border-slate-800 text-[10px] print:bg-slate-50 print:border-slate-300">
                        <div>💀 Korban Meninggal: <span className="font-bold text-slate-200 print:text-black">{report.fatalities}</span></div>
                        <div>🤕 Korban Luka-Luka: <span className="font-bold text-slate-200 print:text-black">{report.injured}</span></div>
                        <div>🔍 Orang Hilang: <span className="font-bold text-slate-200 print:text-black">{report.missing}</span></div>
                        <div>⛺ Jumlah Pengungsi: <span className="font-bold text-slate-200 print:text-black">{report.evacuees}</span></div>
                      </div>

                      {/* SAR Recommendations list */}
                      {report.recommendations && report.recommendations.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80 print:border-slate-200">
                          <span className="font-bold text-[9px] text-slate-400 uppercase tracking-wider block mb-1">Daftar Rekomendasi Alokasi Penyelamatan Posko SAR:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {report.recommendations.slice(0, 3).map((rec, recIdx) => (
                              <div key={recIdx} className="bg-slate-800/20 p-2 rounded border border-slate-800/50 print:border-slate-200 text-[10px] flex justify-between items-center">
                                <div>
                                  <span className="font-extrabold text-blue-400 print:text-blue-700">{recIdx + 1}. {rec.sar_base_name}</span>
                                </div>
                                <div className="font-semibold text-slate-300 print:text-black">
                                  Jarak: {rec.distance_km.toFixed(1)} km
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures / Official block */}
        <div className="mt-16 pt-8 border-t border-slate-700 print:border-black grid grid-cols-2 text-center text-xs print:break-inside-avoid">
          <div>
            <p className="text-slate-400 print:text-slate-600">Dibuat Otomatis Oleh:</p>
            <p className="font-black text-white mt-8 print:text-black">SISTEM SAPULIDIKU</p>
            <p className="text-[10px] text-slate-500">Kecerdasan Spasial AI</p>
          </div>
          <div>
            <p className="text-slate-400 print:text-slate-600">Disetujui Oleh,</p>
            <p className="font-black text-white mt-8 print:text-black">KEPALA POSKO SAR PROVINSI</p>
            <p className="text-[10px] text-slate-500">Tanda Tangan Elektronik Aktif</p>
          </div>
        </div>

      </div>
    </div>
  );
}
