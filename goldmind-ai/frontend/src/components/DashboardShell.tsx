'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
  Send,
  UserCircle,
  ShieldCheck,
  LogOut,
  Menu,
  type LucideIcon,
} from 'lucide-react';

const SIDEBAR_COLLAPSED = '3.25rem';  // 52px — icon only
const SIDEBAR_EXPANDED  = '15rem';    // 240px — icon + label

const sidebarVariants = {
  open:   { width: SIDEBAR_EXPANDED },
  closed: { width: SIDEBAR_COLLAPSED },
};

const labelVariants = {
  open:   { opacity: 1, x: 0,   display: 'block' },
  closed: { opacity: 0, x: -8,  transitionEnd: { display: 'none' } },
};

const transition = { type: 'tween', ease: 'easeOut', duration: 0.2 } as const;

const navIcons: LucideIcon[] = [LayoutDashboard, Zap, Newspaper, Bot, BookOpen, Send, UserCircle];
const navHrefs = ['/dashboard', '/signals', '/bias', '/chat', '/journal', '/telegram', '/profile'];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, fetchUser, logout } = useAuthStore();
  const { t } = useI18n();

  // Desktop hover state
  const [hovered, setHovered] = useState(false);
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = t.dashboard.navItems.map((item, i) => ({
    href:  navHrefs[i],
    label: item.label,
    desc:  item.desc,
    icon:  navIcons[i],
  }));

  useEffect(() => { setTheme(getStoredTheme()); }, []);
  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
    if (!isLoading && user && user.role !== 'ADMIN') {
      if ((user.status === 'EXPIRED' || user.status === 'SUSPENDED') && pathname !== '/renew') {
        router.push('/renew');
      }
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: { access_token: string } | null } }) => {
        if (session?.access_token) connectSocket(session.access_token);
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

  const currentNav = navItems.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + '/'),
  );

  // ── Shared nav item renderer ──────────────────────────────────────────
  function NavItem({
    item,
    showLabel,
    onClick,
  }: {
    item: typeof navItems[number];
    showLabel: boolean;
    onClick?: () => void;
  }) {
    const isActive =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        title={!showLabel ? item.label : undefined}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
          transition-all duration-200 group overflow-hidden relative
          ${isActive
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }
        `}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence initial={false}>
          {showLabel && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="font-medium leading-tight whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        )}
      </Link>
    );
  }

  // ── DESKTOP SIDEBAR (collapsible hover) ──────────────────────────────
  const DesktopSidebar = (
    <motion.aside
      initial="closed"
      animate={hovered ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={transition}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        hidden lg:flex flex-col fixed inset-y-0 left-0 z-50
        bg-brand-card border-r border-brand-border overflow-hidden
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-brand-border flex-shrink-0 h-[54px]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
          <img src="/img/logo.jpg" alt="Logo" className="h-7 w-7 rounded-md object-contain flex-shrink-0" />
          <AnimatePresence initial={false}>
            {hovered && (
              <motion.span
                key="brand"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-bold text-gradient-gold whitespace-nowrap"
              >
                SINYAL COHIBA
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Membership pill */}
      <div className="px-2 pt-3 pb-1 flex-shrink-0">
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium overflow-hidden ${
          user.status === 'ACTIVE'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <AnimatePresence initial={false}>
            {hovered && (
              <motion.span
                key="status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {user.status === 'ACTIVE' ? t.dashboard.membershipActive : t.dashboard.membershipInactive}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} showLabel={hovered} />
        ))}

        {user.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-brand-border" />
            <Link
              href="/admin"
              title={!hovered ? t.dashboard.adminPanel : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                transition-all duration-200 overflow-hidden border
                ${pathname.startsWith('/admin')
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }
              `}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {hovered && (
                  <motion.span
                    key="admin"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {t.dashboard.adminPanel}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </>
        )}
      </nav>

      {/* User profile + logout */}
      <div className="flex-shrink-0 p-2 border-t border-brand-border">
        <div className="flex items-center gap-2.5 px-2 py-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-black text-xs flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence initial={false}>
            {hovered && (
              <motion.div
                key="userinfo"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs text-white font-semibold truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => logout().then(() => router.push('/login'))}
          title={!hovered ? t.dashboard.logout : undefined}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <AnimatePresence initial={false}>
            {hovered && (
              <motion.span
                key="logout"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {t.dashboard.logout}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );

  // ── MOBILE SIDEBAR (overlay drawer) ──────────────────────────────────
  const MobileSidebar = (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={transition}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-brand-card border-r border-brand-border flex flex-col lg:hidden"
            >
              {/* Logo */}
              <div className="p-5 border-b border-brand-border flex-shrink-0">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <img src="/img/logo.jpg" alt="Logo" className="h-8 w-auto object-contain" />
                  <span className="text-lg font-bold text-gradient-gold">SINYAL COHIBA</span>
                </Link>
              </div>

              {/* Membership pill */}
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

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} showLabel onClick={() => setMobileOpen(false)} />
                ))}
                {user.role === 'ADMIN' && (
                  <>
                    <div className="my-2 border-t border-brand-border" />
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
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

              {/* User + logout */}
              <div className="flex-shrink-0 p-4 border-t border-brand-border">
                <div className="flex items-center gap-3 mb-3 px-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-brand-dark font-black text-sm flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => logout().then(() => router.push('/login'))}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{t.dashboard.logout}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-dark flex">
      {DesktopSidebar}
      {MobileSidebar}

      {/* Main content — margin-left matches collapsed sidebar width on desktop */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[3.25rem]">

        {/* Top header */}
        <header className="sticky top-0 z-40 bg-brand-dark/80 backdrop-blur-xl border-b border-brand-border flex-shrink-0">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-brand-border text-gray-400 hover:text-white hover:border-amber-500/30 transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Page title */}
            <div className="flex items-center gap-2 flex-1">
              <span className="lg:hidden text-sm font-bold text-gradient-gold">SINYAL COHIBA</span>
              {currentNav && (
                <div className="hidden lg:flex items-center gap-2">
                  <currentNav.icon className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-semibold text-white">{currentNav.label}</span>
                </div>
              )}
            </div>

            {/* Right — language toggle + live indicator + avatar */}
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

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
