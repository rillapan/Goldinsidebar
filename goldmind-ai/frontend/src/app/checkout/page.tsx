// TAHAP 2 — Halaman Checkout (Xendit Payment)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/create-invoice');
      const { invoiceUrl } = res.data.data;
      // Redirect ke halaman payment Xendit
      window.location.href = invoiceUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Aktifkan Membership</h1>
          <p className="text-gray-500 mt-2">Bayar sekali, akses semua fitur premium selama 30 hari</p>
        </div>

        <div className="glass-card p-8">
          {/* Plan Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-amber-400">Premium Plan</h3>
                <p className="text-gray-500 text-sm">Akses penuh 30 hari</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">Rp 299K</div>
                <div className="text-gray-500 text-sm">/bulan</div>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-gray-300">
              {[
                'AI Signal Engine — sinyal real-time 24/5',
                'Daily Market Bias — analisa fundamental harian',
                'AI Chat Assistant — tanya jawab analisa teknikal',
                'Notifikasi WA + Telegram + Email',
                'Akses riwayat sinyal & statistik win rate',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Metode pembayaran tersedia:</p>
            <div className="flex flex-wrap gap-2">
              {['QRIS', 'BCA', 'BNI', 'BRI', 'Mandiri', 'OVO', 'DANA', 'ShopeePay'].map((m) => (
                <span key={m} className="px-3 py-1 bg-brand-dark border border-brand-border rounded-lg text-xs text-gray-400">{m}</span>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>
          )}

          <button onClick={handlePay} disabled={loading}
            className="w-full btn-gold rounded-xl py-4 text-lg disabled:opacity-50">
            {loading ? 'Membuat Invoice...' : '💳 Bayar Sekarang — Rp 299.000'}
          </button>

          <p className="text-center text-gray-600 text-xs mt-4">
            Pembayaran diproses oleh Xendit. Akun aktif otomatis setelah bayar.
          </p>
        </div>
      </div>
    </main>
  );
}
