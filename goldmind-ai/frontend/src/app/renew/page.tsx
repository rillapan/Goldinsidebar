// TAHAP 6 — Halaman Renewal (saat membership expired)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export default function RenewPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRenew = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/create-invoice');
      window.location.href = res.data.data.invoiceUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="text-6xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold mb-3">Membership Telah Berakhir</h1>
        <p className="text-gray-400 mb-2">
          Halo <span className="text-white font-semibold">{user?.name || 'Member'}</span>,
          membership Anda telah expired.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Perpanjang sekarang untuk melanjutkan akses ke sinyal AI, Daily Bias, dan Chat Assistant.
        </p>

        <div className="glass-card p-6 mb-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-amber-400 font-semibold">Premium Plan</span>
            <span className="text-2xl font-bold text-white">Rp 299K<span className="text-gray-500 text-sm font-normal">/bulan</span></span>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI Signal Engine 24/5</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Daily Market Bias</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI Chat Assistant</li>
            <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Multi-channel notification</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        <button onClick={handleRenew} disabled={loading}
          className="w-full btn-gold rounded-xl py-4 text-lg disabled:opacity-50 mb-4">
          {loading ? 'Membuat Invoice...' : '🔄 Perpanjang Membership'}
        </button>

        <Link href="/" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          Kembali ke halaman utama
        </Link>
      </div>
    </main>
  );
}
