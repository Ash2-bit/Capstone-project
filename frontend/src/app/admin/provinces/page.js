'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api';
import { Plus, Edit3, Trash2, Check, X, AlertTriangle } from 'lucide-react';

export default function AdminProvincesPage() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProvinces = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProvinces();
      if (res.success) {
        setProvinces(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar provinsi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newName.trim()) return;

    try {
      const res = await adminApi.createProvince(newName.trim());
      if (res.success) {
        setSuccess('Provinsi baru berhasil ditambahkan.');
        setNewName('');
        fetchProvinces();
      }
    } catch (err) {
      setError(err.message || 'Gagal menambahkan provinsi.');
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    setSuccess('');
    if (!editingName.trim()) return;

    try {
      const res = await adminApi.updateProvince(id, editingName.trim());
      if (res.success) {
        setSuccess('Provinsi berhasil diperbarui.');
        setEditingId(null);
        setEditingName('');
        fetchProvinces();
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui provinsi.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus provinsi ini? Semua data laporan dan sesi terkait di dalamnya akan ikut terhapus.')) return;
    setError('');
    setSuccess('');

    try {
      const res = await adminApi.deleteProvince(id);
      if (res.success) {
        setSuccess('Provinsi berhasil dihapus.');
        fetchProvinces();
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus provinsi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
          Master Data
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Manajemen Provinsi</h1>
        <p className="text-xs text-slate-400 mt-1">
          Tambahkan atau kelola nama provinsi di Indonesia yang menjadi lingkup koordinasi kebencanaan.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Add New Province */}
        <div className="bg-[#0b1329]/40 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
            Tambah Provinsi Baru
          </h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label htmlFor="new_name" className="text-[10px] font-bold text-slate-400 block mb-1">Nama Provinsi *</label>
              <input
                type="text"
                id="new_name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: JAWA BARAT"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah Provinsi
            </button>
          </form>
        </div>

        {/* Right Table: List Provinces */}
        <div className="md:col-span-2 bg-[#0b1329]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0a0f1d] border-b border-slate-800">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
              Daftar Provinsi Aktif ({provinces.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Memuat data...</div>
          ) : provinces.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-700" />
              Belum ada provinsi yang ditambahkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Nama Provinsi</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {provinces.map((prov) => (
                    <tr key={prov.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">#{prov.id}</td>
                      <td className="px-6 py-4">
                        {editingId === prov.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs text-slate-100 font-bold focus:outline-none"
                          />
                        ) : (
                          <span className="font-black text-slate-200">{prov.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingId === prov.id ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdate(prov.id)}
                              className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-900/50 p-1.5 rounded-lg transition-all"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditingName(''); }}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 p-1.5 rounded-lg transition-all"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => { setEditingId(prov.id); setEditingName(prov.name); }}
                              className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 p-1.5 rounded-lg transition-all border border-slate-700/50"
                              title="Ubah"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(prov.id)}
                              className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-1.5 rounded-lg transition-all border border-red-900/30"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
