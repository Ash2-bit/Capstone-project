'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api';
import { Plus, Edit3, Trash2, Shield, MapPin, Phone, AlertTriangle } from 'lucide-react';

export default function AdminSarBasesPage() {
  const [sarBases, setSarBases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBases = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSarBases();
      if (res.success) {
        setSarBases(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat posko SAR.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setContactNumber('');
  };

  const handleEditClick = (base) => {
    setIsEditing(true);
    setEditingId(base.id);
    setName(base.name);
    setAddress(base.address);
    setLatitude(base.latitude.toString());
    setLongitude(base.longitude.toString());
    setContactNumber(base.contact_number || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !address || !latitude || !longitude) {
      return setError('Semua kolom bertanda bintang wajib diisi.');
    }

    const payload = {
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      contact_number: contactNumber || null,
    };

    try {
      if (isEditing) {
        const res = await adminApi.updateSarBase(editingId, payload);
        if (res.success) {
          setSuccess('Posko SAR berhasil diperbarui.');
          resetForm();
          fetchBases();
        }
      } else {
        const res = await adminApi.createSarBase(payload);
        if (res.success) {
          setSuccess('Posko SAR baru berhasil ditambahkan.');
          resetForm();
          fetchBases();
        }
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan posko SAR.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus posko SAR ini?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await adminApi.deleteSarBase(id);
      if (res.success) {
        setSuccess('Posko SAR berhasil dihapus.');
        fetchBases();
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus posko SAR.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
          Master Data
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Manajemen Posko SAR</h1>
        <p className="text-xs text-slate-400 mt-1">
          Kelola titik koordinat operasional dan kontak nomor Posko Basarnas / SAR yang ditugaskan untuk mitigasi.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form card */}
        <div className="bg-[#0b1329]/40 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-400" />
            {isEditing ? 'Ubah Posko SAR' : 'Tambah Posko SAR Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-[10px] font-bold text-slate-400 block mb-1">Nama Posko *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: POSKO BASARNAS REGIONAL A"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="text-[10px] font-bold text-slate-400 block mb-1">Alamat Posko *</label>
              <textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Masukkan alamat posko lengkap..."
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="text-[10px] font-bold text-slate-400 block mb-1">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-6.20000"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude" className="text-[10px] font-bold text-slate-400 block mb-1">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="106.80000"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact" className="text-[10px] font-bold text-slate-400 block mb-1">Nomor Kontak / Telepon</label>
              <input
                type="text"
                id="contact"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Contoh: (021) 555-1234"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-grow bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                {isEditing ? 'Simpan Perubahan' : 'Tambah Posko'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Table List */}
        <div className="lg:col-span-2 bg-[#0b1329]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0a0f1d] border-b border-slate-800">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
              Daftar Posko SAR Aktif ({sarBases.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Memuat data...</div>
          ) : sarBases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-700" />
              Belum ada Posko SAR yang terdaftar.
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {sarBases.map((base) => (
                <div key={base.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <h4 className="font-extrabold text-slate-200 text-sm">{base.name}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">#{base.id}</span>
                    </div>

                    <p className="text-slate-400 max-w-md">{base.address}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-650" />
                        {parseFloat(base.latitude).toFixed(6)}, {parseFloat(base.longitude).toFixed(6)}
                      </span>
                      {base.contact_number && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-650" />
                          {base.contact_number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-2 border-t border-slate-800/80 pt-3 sm:pt-0 sm:border-none">
                    <button
                      onClick={() => handleEditClick(base)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Ubah
                    </button>
                    <button
                      onClick={() => handleDelete(base.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
