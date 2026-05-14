'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/utils/supabase/client';
import { connectSocket } from '@/lib/socket';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { getStoredTheme, setTheme } from '@/lib/theme';
import {
  LayoutDashboard,
  Zap,
  Newspaper,
  Bot,
  BookOpen,
  UserCircle,
  ShieldCheck,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';

const navIcons: LucideIcon[] = [LayoutDashboard, Zap, Newspaper, Bot, BookOpen, UserCircle];
const navHrefs = ['/dashboard', '/signals', '/bias', '/chat', '/journal', '/profile'];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, fetchUser, logout } = useAuthStore();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build nav items from translations
  const navItems = t.dashboard.navItems.map((item, i) => ({
    href: navHrefs[i],
    label: item.label,
    icon: navIcons[i],
    desc: item.desc,
  }));

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    // EXPIRED / SUSPENDED → halaman perpanjangan
    // PENDING → tetap di dashboard, overlay upgrade muncul di konten
    // ACTIVE → akses penuh ke semua fitur
    if (!isLoading && user && user.role !== 'ADMIN') {
      if (user.status === 'EXPIRED' && pathname !== '/renew') {
        router.push('/renew');
      }
      if (user.status === 'SUSPENDED' && pathname !== '/renew') {
        router.push('/renew');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Hubungkan socket setelah user terautentikasi.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          connectSocket(session.access_token);
        }
      });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{t.dashboard.loadingText}</p>
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
            <img src="/img/logo.jpg" alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold text-gradient-gold">SINYAL COHIBA</span>
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
            {user.status === 'ACTIVE' ? t.dashboard.membershipActive : t.dashboard.membershipInactive}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="text-gray-600 text-xs font-medium px-3 py-2 uppercase tracking-wider">{t.dashboard.mainMenu}</p>

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
                <item.icon className="w-5 h-5 flex-shrink-0" />
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
              <p className="text-gray-600 text-xs font-medium px-3 py-2 uppercase tracking-wider mt-3">{t.dashboard.admin}</p>
              <Link href="/admin" onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 border ${
                  pathname.startsWith('/admin')
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="font-medium">{t.dashboard.adminPanel}</span>
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
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{t.dashboard.logout}</span>
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
              <Menu className="w-4 h-4" />
            </button>

            {/* Page title */}
            <div className="flex items-center gap-2 flex-1">
              <span className="lg:hidden text-sm font-bold text-gradient-gold">SINYAL COHIBA</span>
              {currentNav && (
                <div className="hidden lg:flex items-center gap-2">
                  {currentNav && <currentNav.icon className="w-5 h-5 text-amber-400" />}
                  <span className="text-sm font-semibold text-white">{currentNav.label}</span>
                </div>
              )}
            </div>

            {/* Header right — language toggle + live indicator */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">{t.dashboard.botActive}</span>
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
