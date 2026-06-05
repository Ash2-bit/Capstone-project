'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '../../../lib/api';

// ─── Inline Markdown Parser (mirrors Laravel parseMarkdownToHtml) ─────────────
function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';

  const parseBold = (str) =>
    str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const htmlParts = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed === '---' || trimmed === '***') {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push('<hr style="border:0;border-top:1px solid #cbd5e1;margin:1.25rem 0;">');
      return;
    }
    if (trimmed.startsWith('### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.05rem;color:#1e3a8a;margin:1.25rem 0 0.5rem 0;">${parseBold(trimmed.slice(4))}</h3>`);
      return;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h2 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:1.15rem;color:#1e3a8a;margin:1.5rem 0 0.75rem 0;">${parseBold(trimmed.slice(3))}</h2>`);
      return;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.3rem;color:#1e3a8a;margin:1.75rem 0 1rem 0;">${parseBold(trimmed.slice(2))}</h1>`);
      return;
    }
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) { htmlParts.push('<ul style="margin:0.5rem 0;padding-left:1.25rem;list-style-type:disc;">'); inList = true; }
      htmlParts.push(`<li style="margin-bottom:0.3rem;">${parseBold(trimmed.slice(2))}</li>`);
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<p style="margin:0.4rem 0;padding-left:0.25rem;">${parseBold(line)}</p>`);
      return;
    }
    if (trimmed === '') {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      return;
    }
    if (inList) { htmlParts.push('</ul>'); inList = false; }
    htmlParts.push(`<p style="margin-bottom:0.75rem;line-height:1.5;text-align:justify;">${parseBold(line)}</p>`);
  });

  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('\n');
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Memformat Laporan Cetak...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ fontWeight: 700, color: '#dc2626' }}>Error</p>
          <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem' }}>{error}</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#3b82f6', fontSize: '0.875rem', fontWeight: 600 }}>← Kembali ke Beranda</a>
        </div>
      </div>
    );
  }

  const { session, clusters, totals } = data;
  const printDate = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const priorityColor = (p) => p === 'red' ? '#ef4444' : p === 'yellow' ? '#eab308' : '#10b981';
  const severityColor = (s) => s === 'berat' ? '#ef4444' : s === 'sedang' ? '#eab308' : s === 'ringan' ? '#10b981' : '#94a3b8';
  const photoBadgeStyle = (severity) => {
    if (severity === 'berat') return { background: '#fef2f2', color: '#dc2626' };
    if (severity === 'sedang') return { background: '#fefce8', color: '#ca8a04' };
    if (severity === 'ringan') return { background: '#f0fdf4', color: '#16a34a' };
    return { background: '#f1f5f9', color: '#64748b' };
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

  return (
    <>
      {/* Google Fonts + print styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.5; padding: 2rem; }
        @media print {
          body { background: #ffffff; padding: 0; color: #000; }
          .report-wrapper { box-shadow: none; padding: 0; max-width: 100%; }
          .action-bar { display: none !important; }
          .print-footer { display: block !important; }
          .cluster-block { page-break-inside: avoid; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reports-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 1rem; }
        .reports-table th, .reports-table td { border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left; vertical-align: top; }
        .reports-table th { background: #f1f5f9; font-weight: 700; color: #0f172a; }
        .btn-action { display: inline-flex; align-items: center; gap: 0.5rem; background: #3b82f6; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; text-decoration: none; transition: background 0.2s; }
        .btn-action:hover { background: #1e3a8a; }
        .btn-back { background: #64748b; }
        .btn-back:hover { background: #475569; }
        .sar-list { margin-top: 0.25rem; padding-left: 1.25rem; font-size: 0.8rem; list-style-type: decimal; }
        .sar-list li { margin-bottom: 0.3rem; }
        .photo-thumbnail-container { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .photo-card { border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; background: #f8fafc; width: 120px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .photo-card img { width: 100%; height: 80px; object-fit: cover; display: block; }
        .photo-card-info { padding: 0.35rem 0.5rem; font-size: 0.7rem; }
        .photo-card-badge { display: inline-block; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
      `}</style>

      <div className="report-wrapper" style={{ maxWidth: '1000px', margin: '0 auto', background: '#ffffff', padding: '3rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)' }}>

        {/* ── Action Bar ── */}
        <div className="action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #cbd5e1' }}>
          <a href="/" className="btn-action btn-back">← Kembali ke Dashboard</a>
          <button onClick={() => window.print()} className="btn-action">🖨 Cetak / Ekspor PDF</button>
        </div>

        {/* ── Report Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '2rem', color: '#1e3a8a', marginBottom: '0.5rem' }}>
              SAPULIDIKU
            </h1>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>Sistem Informasi Pelaporan &amp; Pemetaan Klaster Bencana Nasional</p>
            <p style={{ fontWeight: 600, marginTop: '0.25rem', color: '#475569', fontSize: '0.95rem' }}>Laporan Komprehensif Sesi Analisis Klaster Spasial</p>
          </div>
          <div style={{ textAlign: 'left', fontSize: '0.875rem', color: '#475569' }}>
            <table style={{ borderCollapse: 'collapse', marginTop: '0.5rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>ID Sesi</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>: #{session.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>Provinsi</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>: {session.province || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>Algoritma</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>: {session.algorithm?.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>Rentang Data</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>: {session.start_date} - {session.end_date}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0.5rem', fontWeight: 600, color: '#0f172a' }}>Tanggal Cetak</td>
                  <td style={{ padding: '0.25rem 0.5rem' }}>: {printDate} WIB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Cumulative Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { num: totals.totalReports, label: 'Titik Laporan', color: '#1e3a8a' },
            { num: totals.totalFatalities, label: 'Meninggal', color: '#ef4444' },
            { num: totals.totalInjured, label: 'Luka-Luka', color: '#eab308' },
            { num: totals.totalMissing, label: 'Hilang', color: '#64748b' },
            { num: totals.totalEvacuees, label: 'Mengungsi', color: '#10b981' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '0.375rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: s.color, marginBottom: '0.25rem' }}>{s.num}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Metrics Evaluasi ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem', background: '#fafafa', border: '1px solid #cbd5e1', borderRadius: '0.375rem', padding: '1rem' }}>
          {[
            { title: 'Silhouette Score', value: session.silhouette_score !== null ? parseFloat(session.silhouette_score).toFixed(4) : 'N/A' },
            { title: 'Davies-Bouldin Index', value: session.davies_bouldin_index !== null ? parseFloat(session.davies_bouldin_index).toFixed(4) : 'N/A' },
            { title: 'Calinski-Harabasz Index', value: session.calinski_harabasz_index !== null ? parseFloat(session.calinski_harabasz_index).toFixed(2) : 'N/A' },
          ].map((m) => (
            <div key={m.title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#475569' }}>{m.title}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* ── Cluster Details Section ── */}
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.35rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1.5rem', borderBottom: '2px solid #1e3a8a', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📂 Detail Informasi per Klaster Spasial
        </h2>

        {clusters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#475569', border: '1px dashed #cbd5e1', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</p>
            <p>Tidak ada klaster yang terbentuk pada sesi analisis ini.</p>
          </div>
        ) : (
          clusters.map((cluster) => {
            const pColor = priorityColor(cluster.priority_level);
            const badgeBg = cluster.priority_level === 'red' ? '#ef4444' : cluster.priority_level === 'yellow' ? '#eab308' : '#10b981';
            const badgeText = cluster.priority_level === 'yellow' ? '#000' : '#fff';

            return (
              <div key={cluster.id} className="cluster-block" style={{ marginBottom: '3rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', overflow: 'hidden', background: '#ffffff' }}>

                {/* Cluster Header */}
                <div style={{ background: '#f8fafc', padding: '1.25rem 1.5rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '0.8rem', height: '0.8rem', borderRadius: '50%', background: pColor }} />
                    {cluster.name}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: badgeBg, color: badgeText }}>
                    Prioritas: {cluster.priority_level}
                  </span>
                </div>

                <div style={{ padding: '1.5rem' }}>

                  {/* Cluster Meta Grid - 4 cols */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                    {[
                      { label: 'Titik Laporan', val: cluster.total_reports },
                      { label: 'Radius (Kilometer)', val: cluster.radius_meter ? `${(cluster.radius_meter / 1000).toFixed(1).replace('.', ',')} km` : 'N/A' },
                      { label: 'Centroid Lintang', val: parseFloat(cluster.centroid_lat).toFixed(6) },
                      { label: 'Centroid Bujur', val: parseFloat(cluster.centroid_long).toFixed(6) },
                    ].map((item) => (
                      <div key={item.label} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#475569', marginBottom: '0.25rem' }}>{item.label}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{item.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Dampak Korban Klaster */}
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', margin: '1.25rem 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    👥 Dampak Korban Klaster &amp; Persentase Kontribusi Sesi
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                    {[
                      { label: 'Meninggal', val: cluster.total_fatalities, total: totals.totalFatalities, color: '#ef4444' },
                      { label: 'Luka-Luka', val: cluster.total_injured, total: totals.totalInjured, color: '#eab308' },
                      { label: 'Hilang', val: cluster.total_missing, total: totals.totalMissing, color: '#64748b' },
                      { label: 'Mengungsi', val: cluster.total_evacuees, total: totals.totalEvacuees, color: '#10b981' },
                    ].map((item) => {
                      const pct = item.total > 0 ? Math.round((item.val / item.total) * 100) : 0;
                      return (
                        <div key={item.label} style={{ background: '#f8fafc', padding: '0.75rem 0.75rem 0.75rem 1rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0', borderLeft: `3px solid ${item.color}`, textAlign: 'left' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: item.color, marginBottom: '0.25rem' }}>{item.label}</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                            {item.val}/{item.total}
                            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#475569', marginLeft: '0.25rem' }}>({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Recommendation Box */}
                  {cluster.ai_recommendation && (
                    <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '0.375rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#6d28d9', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ✨ Analisis Taktis &amp; Rekomendasi AI
                      </div>
                      <div
                        style={{ fontSize: '0.875rem', color: '#3730a3', lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(cluster.ai_recommendation) }}
                      />
                    </div>
                  )}

                  {/* Reports List Table */}
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📋 Sebaran Titik Pelaporan Bencana
                  </div>

                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th style={{ width: '4%' }}>No</th>
                        <th style={{ width: '22%' }}>Pelapor &amp; Kontak</th>
                        <th style={{ width: '34%' }}>Detail Laporan &amp; Kerusakan</th>
                        <th style={{ width: '16%' }}>Tingkat Bahaya &amp; Dampak Korban</th>
                        <th style={{ width: '24%' }}>Rekomendasi SAR Terdekat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cluster.reports.map((report, rIdx) => (
                        <tr key={report.id}>
                          {/* No */}
                          <td>{rIdx + 1}</td>

                          {/* Pelapor & Kontak */}
                          <td>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <strong>{report.reporter_name}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.15rem' }}>
                              📞 {report.reporter_phone || '-'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem' }}>
                              📍 {report.reporter_address || 'Alamat tidak diisi'}
                            </div>
                            <div style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
                              >
                                🗺 Lihat Peta Presisi
                              </a>
                            </div>
                          </td>

                          {/* Detail Laporan & Foto */}
                          <td>
                            <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                              {report.category?.replace(/_/g, ' ')}
                            </div>
                            <p style={{ color: '#475569', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                              {report.description || 'Tidak ada deskripsi detail.'}
                            </p>

                            {/* Photos - menggunakan tampilan lama: card dengan AI badge & confidence */}
                            {report.photos && report.photos.length > 0 && (
                              <div className="photo-thumbnail-container">
                                {report.photos.map((photo, pIdx) => {
                                  const imgSrc = photo.url.startsWith('http') ? photo.url : `${apiUrl}${photo.url}`;
                                  const badgeStyle = photoBadgeStyle(photo.severity);
                                  return (
                                    <div key={pIdx} className="photo-card">
                                      <img src={imgSrc} alt="Bukti Lapangan" title={`Kerusakan: ${photo.severity || 'unknown'}`} />
                                      <div className="photo-card-info">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                                          <span style={{ color: '#64748b', fontSize: '0.65rem' }}>AI Deteksi:</span>
                                          <span className="photo-card-badge" style={badgeStyle}>{photo.severity || 'unknown'}</span>
                                        </div>
                                        {photo.confidence_score !== null && photo.confidence_score !== undefined && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.15rem' }}>
                                            <span>Conf:</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{(photo.confidence_score ).toFixed(1)}%</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          {/* Tingkat Bahaya & Dampak */}
                          <td>
                            <div style={{ fontWeight: 700, textTransform: 'uppercase', color: severityColor(report.overall_severity), marginBottom: '0.5rem' }}>
                              {report.overall_severity}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                              <div>Meninggal: <strong>{report.fatalities}</strong></div>
                              <div>Luka: <strong>{report.injured}</strong></div>
                              <div>Hilang: <strong>{report.missing}</strong></div>
                              <div>Evakuasi: <strong>{report.evacuees}</strong></div>
                            </div>
                          </td>

                          {/* Rekomendasi SAR - 3 terdekat */}
                          <td>
                            {report.recommendations && report.recommendations.length > 0 ? (
                              <ol className="sar-list">
                                {report.recommendations.slice(0, 3).map((rec, recIdx) => (
                                  <li key={recIdx}>
                                    {rec.sar_base_name} ({parseFloat(rec.distance_km).toFixed(2)} km)
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>Tidak ada posko penunjang</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              </div>
            );
          })
        )}

        {/* Print Footer */}
        <div className="print-footer" style={{ display: 'none', textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginTop: '3rem', borderTop: '1px solid #cbd5e1', paddingTop: '1rem' }}>
          <p>Laporan ini dibuat dan diunduh secara otomatis dari sistem SIG Sapulidiku &copy; {new Date().getFullYear()}.</p>
          <p>Koordinasi SAR Terpadu - Mitigasi Cepat, Respon Presisi.</p>
        </div>

      </div>
    </>
  );
}
