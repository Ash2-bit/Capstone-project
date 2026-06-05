'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../lib/api';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sapulidiku_token');
      if (token) {
        router.push('/admin/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      return setError('Email dan password wajib diisi.');
    }

    setLoading(true);

    try {
      const res = await adminApi.login(email.trim(), password);

      if (res.success && res.token) {
        // Save auth state
        localStorage.setItem('sapulidiku_token', res.token);
        localStorage.setItem('sapulidiku_user', JSON.stringify(res.user));
        
        // Redirect to dashboard
        router.push('/admin/dashboard');
      } else {
        setError(res.message || 'Login gagal.');
      }
    } catch (err) {
      setError(err.message || 'Koneksi ke backend gagal. Pastikan Express server menyala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20 mb-2">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">
            SAPULIDIKU KEBENCANAAN
          </h2>
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Sistem Otentikasi Dashboard Admin
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b1329]/50 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
          
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs font-semibold flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="text-[10px] font-bold text-slate-400 block mb-1">ALAMAT EMAIL</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 block mb-1">PASSWORD</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                loading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 hover:scale-[0.99] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Ke Dashboard <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
            ← Kembali Ke Portal Publik
          </Link>
        </div>

      </div>
    </div>
  );
}
