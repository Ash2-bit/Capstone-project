'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/api';
import { Plus, Edit3, Trash2, Check, X, AlertTriangle, Key, Mail, User as UserIcon } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Forms states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load current logged in user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('sapulidiku_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (_) {}
      }
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar admin/user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Semua kolom wajib diisi untuk membuat user baru.');
      return;
    }

    try {
      const res = await adminApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      });
      
      if (res.success) {
        setSuccess('Admin baru berhasil ditambahkan.');
        setName('');
        setEmail('');
        setPassword('');
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Gagal menambahkan user baru.');
    }
  };

  const handleUpdate = async (id) => {
    setError('');
    setSuccess('');

    if (!editingName.trim() || !editingEmail.trim()) {
      setError('Nama dan email wajib diisi.');
      return;
    }

    try {
      const data = {
        name: editingName.trim(),
        email: editingEmail.trim().toLowerCase(),
      };

      if (editingPassword.trim() !== '') {
        data.password = editingPassword;
      }

      const res = await adminApi.updateUser(id, data);
      if (res.success) {
        setSuccess('Data admin berhasil diperbarui.');
        setEditingId(null);
        setEditingName('');
        setEditingEmail('');
        setEditingPassword('');
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Gagal memperbarui data.');
    }
  };

  const handleDelete = async (userToDelete) => {
    // Check if trying to delete self
    const loggedInId = currentUser?.id?.toString();
    const deleteIdStr = userToDelete.id?.toString();
    
    if (loggedInId && loggedInId === deleteIdStr) {
      setError('Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userToDelete.name}"? Aksi ini tidak dapat dibatalkan.`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await adminApi.deleteUser(userToDelete.id);
      if (res.success) {
        setSuccess(`User "${userToDelete.name}" berhasil dihapus.`);
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Gagal menghapus user.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (_) {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold text-blue-500 tracking-widest uppercase">
          Hak Akses & Pengguna
        </span>
        <h1 className="text-2xl font-black text-white mt-1">Manajemen User Admin</h1>
        <p className="text-xs text-slate-400 mt-1">
          Tambahkan atau kelola pengguna admin yang memiliki akses penuh untuk memproses data laporan bencana, posko SAR, dan sesi clustering.
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
        {/* Left Form: Add New User */}
        <div className="bg-[#0b1329]/40 border border-slate-800 p-5 rounded-2xl h-fit space-y-4">
          <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
            Tambah Admin Baru
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="user_name" className="text-[10px] font-bold text-slate-400 block mb-1">Nama Lengkap *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  id="user_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="user_email" className="text-[10px] font-bold text-slate-400 block mb-1">Alamat Email *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="email"
                  id="user_email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="user_password" className="text-[10px] font-bold text-slate-400 block mb-1">Kata Sandi (Password) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Key className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  id="user_password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Simpan User Baru
            </button>
          </form>
        </div>

        {/* Right Table: List Users */}
        <div className="lg:col-span-2 bg-[#0b1329]/20 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#0a0f1d] border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
              Daftar Admin Aktif ({users.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Memuat data user...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-slate-700" />
              Belum ada user yang terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800 text-[10px]">
                    <th className="px-6 py-3">User / Admin</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Tanggal Dibuat</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.map((userItem) => {
                    const isSelf = currentUser?.id?.toString() === userItem.id?.toString();
                    
                    return (
                      <tr key={userItem.id} className="hover:bg-slate-800/10 transition-colors">
                        {/* Name & Email */}
                        <td className="px-6 py-4">
                          {editingId === userItem.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs text-slate-100 font-bold focus:outline-none w-full max-w-[200px]"
                                placeholder="Nama Lengkap"
                                required
                              />
                              <input
                                type="email"
                                value={editingEmail}
                                onChange={(e) => setEditingEmail(e.target.value)}
                                className="bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none w-full max-w-[200px]"
                                placeholder="Email"
                                required
                              />
                              <input
                                type="password"
                                value={editingPassword}
                                onChange={(e) => setEditingPassword(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-400 focus:outline-none w-full max-w-[200px] block"
                                placeholder="Password Baru (Biarkan kosong jika tidak diganti)"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-200">{userItem.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-900/30 rounded text-[8px] font-extrabold uppercase">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-semibold">{userItem.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Role Badge */}
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 rounded-full font-bold text-[9px] uppercase tracking-wider">
                            {userItem.role}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {formatDate(userItem.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {editingId === userItem.id ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdate(userItem.id)}
                                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-900/50 p-1.5 rounded-lg transition-all"
                                title="Simpan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName('');
                                  setEditingEmail('');
                                  setEditingPassword('');
                                }}
                                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50 p-1.5 rounded-lg transition-all"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingId(userItem.id);
                                  setEditingName(userItem.name);
                                  setEditingEmail(userItem.email);
                                  setEditingPassword('');
                                }}
                                className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 p-1.5 rounded-lg transition-all border border-slate-700/50"
                                title="Ubah"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(userItem)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-lg transition-all border ${
                                  isSelf
                                    ? 'bg-slate-900/30 text-slate-600 border-slate-800/50 cursor-not-allowed'
                                    : 'bg-red-950/40 hover:bg-red-900/40 text-red-400 border-red-900/30'
                                }`}
                                title={isSelf ? "Anda tidak dapat menghapus akun sendiri" : "Hapus"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
