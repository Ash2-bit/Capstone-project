'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Map, Database, Home, FileText, Anchor, LogOut, User } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Secure all admin views
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sapulidiku_token');
      const savedUser = localStorage.getItem('sapulidiku_user');
      
      if (!token) {
        // Redirection to login if not authenticated
        router.push('/login');
      } else {
        setIsAuthenticated(true);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (_) {}
        }
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sapulidiku_token');
      localStorage.removeItem('sapulidiku_user');
      router.push('/login');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard Ringkasan',
      path: '/admin/dashboard',
      icon: Home,
    },
    {
      name: 'Manajemen Provinsi',
      path: '/admin/provinces',
      icon: Map,
    },
    {
      name: 'Manajemen Posko SAR',
      path: '/admin/sar-bases',
      icon: Anchor,
    },
    {
      name: 'Manajemen Laporan',
      path: '/admin/reports',
      icon: FileText,
    },
    {
      name: 'Sesi Clustering ML',
      path: '/admin/sessions',
      icon: Database,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-400 font-medium text-xs">Memvalidasi Sesi Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row">
      {/* 1. Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-[#0a0f1d] border-r border-slate-900 flex flex-col h-auto md:h-screen sticky top-0 z-40">
        
        {/* Sidebar Header Logo */}
        <div className="h-16 border-b border-slate-900 flex items-center gap-3 px-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent block">
              PANEL ADMIN
            </span>
            <span className="text-[9px] text-slate-500 font-semibold block">SAPULIDIKU KEBENCANAAN</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-900 bg-[#080c18] space-y-3">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-900/40 rounded-xl border border-slate-850/50">
              <div className="bg-blue-950 p-1.5 rounded-lg text-blue-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-[10px] text-slate-200 block truncate leading-tight">{user.name}</span>
                <span className="text-[8px] text-slate-500 block truncate leading-none mt-0.5">{user.email}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
