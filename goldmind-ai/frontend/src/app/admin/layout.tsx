// FITUR 7 — Admin Dashboard Layout
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  ShieldCheck,
  Users,
  Zap,
  Newspaper,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

const adminNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Overview', icon: ShieldCheck },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/signals', label: 'Sinyal', icon: Zap },
  { href: '/admin/bias', label: 'Daily Bias', icon: Newspaper },
  { href: '/admin/transactions', label: 'Transaksi', icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, fetchUser, logout } = useAuthStore();

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) router.push('/login');
      else if (user?.role !== 'ADMIN') router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-brand-card/80 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/img/logo.jpg" alt="Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-gradient-gold">SINYAL COHIBA</span>
            </Link>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">ADMIN</span>
          </div>
          <button onClick={() => logout().then(() => router.push('/login'))} className="text-sm text-gray-500 hover:text-red-400">
            Logout
          </button>
        </div>
      </header>

      {/* Admin Nav */}
      <nav className="border-b border-brand-border bg-brand-card/30">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                pathname === item.href
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}>
              <item.icon className="w-4 h-4" />{item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
