'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Map, Database, Home, FileText, Anchor, LogOut, User, Users, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Collapse state for desktop, initialized from localStorage if available
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Mobile drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load configuration and validate auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('sapulidiku_sidebar_collapsed');
      if (savedCollapsed) {
        setIsCollapsed(savedCollapsed === 'true');
      }

      const token = localStorage.getItem('sapulidiku_token');
      const savedUser = localStorage.getItem('sapulidiku_user');
      
      if (!token) {
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

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sapulidiku_sidebar_collapsed', String(newVal));
      }
      return newVal;
    });
  };

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
    {
      name: 'Manajemen User',
      path: '/admin/users',
      icon: Users,
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
      
      {/* 1. Mobile Top Header Bar */}
      <header className="md:hidden h-16 border-b border-slate-900 bg-[#0a0f1d] flex items-center justify-between px-4 sticky top-0 z-35">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Sapulidiku Logo"
            className="h-9 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none transition-all"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* 2. Mobile Menu Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. Responsive Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#0a0f1d] border-r border-slate-900 flex flex-col h-screen z-50 transform md:transform-none transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-64 md:sticky md:top-0
        `}
      >
        {/* Sidebar Header Logo */}
        <div className={`h-16 border-b border-slate-900 flex items-center justify-between ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            {isCollapsed ? (
              <img
                src="/logo.png"
                alt="Sapulidiku Logo"
                className="h-8 w-8 object-contain flex-shrink-0"
              />
            ) : (
              <img
                src="/logo.png"
                alt="Sapulidiku Logo"
                className="h-9 w-auto object-contain flex-shrink-0 max-w-[160px]"
              />
            )}
          </div>
          
          {/* Desktop Collapse Toggle Button */}
          <button 
            onClick={toggleCollapse}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all hover:bg-slate-800"
            title={isCollapsed ? "Buka Menu" : "Kecilkan Menu"}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
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
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-xs font-bold transition-all duration-200 
                  ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="transition-opacity duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-900 bg-[#080c18] space-y-3">
          {user && (
            <div className={`flex items-center bg-slate-900/40 rounded-xl border border-slate-850/50 ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-1.5'}`}>
              <div className="bg-blue-950 p-1.5 rounded-lg text-blue-400 flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden transition-opacity duration-300">
                  <span className="font-bold text-[10px] text-slate-200 block truncate leading-tight">{user.name}</span>
                  <span className="text-[8px] text-slate-500 block truncate leading-none mt-0.5">{user.email}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Keluar (Logout)" : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 transition-all duration-200
              ${isCollapsed ? 'justify-center p-3' : 'gap-2.5 px-4 py-2.5'}
            `}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="transition-opacity duration-300">Keluar (Logout)</span>}
          </button>
        </div>
      </aside>

      {/* 4. Main Content Container */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
