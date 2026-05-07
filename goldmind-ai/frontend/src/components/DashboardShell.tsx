'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', desc: 'Overview & sinyal aktif' },
  { href: '/signals', label: 'Sinyal', icon: '⚡', desc: 'Semua sinyal trading' },
  { href: '/bias', label: 'Daily Bias', icon: '📰', desc: 'Analisa fundamental harian' },
  { href: '/chat', label: 'AI Chat', icon: '🤖', desc: 'Tanya AI analyst' },
  { href: '/profile', label: 'Profil', icon: '👤', desc: 'Akun & membership' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, fetchUser, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user && user.status !== 'ACTIVE' && user.role !== 'ADMIN') {
      if (pathname !== '/renew') {
        router.push(user.status === 'PENDING' ? '/checkout' : '/renew');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const currentNav = navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'));

  return (
    <div className="min-h-screen bg-brand-dark flex">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-brand-border flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow">
              <span className="text-brand-dark font-black text-sm">G</span>
            </div>
            <span className="text-lg font-bold text-gradient-gold">GoldMind AI</span>
          </Link>
        </div>

        {/* Membership status pill */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            user.status === 'ACTIVE'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {user.status === 'ACTIVE' ? 'Membership Aktif' : 'Membership Tidak Aktif'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="text-gray-600 text-xs font-medium px-3 py-2 uppercase tracking-wider">Menu Utama</p>

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{item.label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${isActive ? 'text-amber-400/60' : 'text-gray-600 group-hover:text-gray-500'}`}>
                    {item.desc}
                  </p>
                </div>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
              </Link>
            );
          })}

          {user.role === 'ADMIN' && (
            <>
              <p className="text-gray-600 text-xs font-medium px-3 py-2 uppercase tracking-wider mt-3">Admin</p>
              <Link href="/admin" onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 border ${
                  pathname.startsWith('/admin')
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <span className="text-base">🛡️</span>
                <span className="font-medium">Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* User profile at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-brand-border">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-black text-sm flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout().then(() => router.push('/login'))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">↩</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top header */}
        <header className="sticky top-0 z-40 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-border flex-shrink-0">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-brand-border text-gray-400 hover:text-white hover:border-amber-500/30 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Page title */}
            <div className="flex items-center gap-2 flex-1">
              <span className="lg:hidden text-sm font-bold text-gradient-gold">GoldMind AI</span>
              {currentNav && (
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-base">{currentNav.icon}</span>
                  <span className="text-sm font-semibold text-white">{currentNav.label}</span>
                </div>
              )}
            </div>

            {/* Header right — live indicator */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">Bot Aktif</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-black text-xs shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
