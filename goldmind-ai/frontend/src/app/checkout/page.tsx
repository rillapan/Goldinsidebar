'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { X, Shield, Zap, CheckCircle2, Loader2 } from 'lucide-react';

// ── Xendit Payment Popup ──────────────────────────────────
function XenditPopup({
  invoiceUrl,
  onClose,
  onSuccess,
}: {
  invoiceUrl: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Listen for postMessage dari Xendit (success / failure)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Xendit mengirim event setelah pembayaran selesai
      if (
        e.data?.event === 'payment_success' ||
        e.data?.status === 'PAID' ||
        (typeof e.data === 'string' && e.data.includes('PAID'))
      ) {
        onSuccess();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  // Polling: cek status invoice tiap 5 detik (fallback)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/payments/status');
        if (res.data?.data?.status === 'PAID') {
          onSuccess();
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        style={{ height: 'min(700px, 90vh)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Pembayaran Aman</p>
              <p className="text-xs text-gray-500">Diproses oleh Xendit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL Secured</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Iframe Area */}
        <div className="flex-1 relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-dark">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-gray-400 text-sm">Memuat halaman pembayaran...</p>
            </div>
          )}
          <iframe
            src={invoiceUrl}
            className="w-full h-full border-0"
            onLoad={() => setIframeLoaded(true)}
            allow="payment"
            title="Xendit Payment"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-brand-border bg-brand-dark/50 flex-shrink-0">
          <p className="text-center text-gray-600 text-xs">
            Akun akan aktif otomatis setelah pembayaran berhasil diverifikasi
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Success State ─────────────────────────────────────────
function PaymentSuccess({ onDashboard }: { onDashboard: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-card border border-emerald-500/30 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl shadow-emerald-500/10 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h2>
        <p className="text-gray-400 text-sm mb-8">
          Selamat! Akses Premium SINYAL COHIBA Anda telah aktif selama 30 hari.
          Sinyal real-time sekarang tersedia.
        </p>
        <button
          onClick={onDashboard}
          className="w-full btn-gold rounded-xl py-3.5 font-semibold text-base"
        >
          Lihat Dashboard →
        </button>
      </div>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/create-invoice');
      const { invoiceUrl } = res.data.data;
      setInvoiceUrl(invoiceUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat invoice. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = useCallback(() => {
    setInvoiceUrl(null);
    setPaid(true);
  }, []);

  const features = [
    'AI Signal Engine — sinyal real-time 24/5',
    'Daily Market Bias — analisa fundamental harian',
    'AI Chat Assistant — tanya jawab analisa teknikal',
    'Notifikasi WA + Telegram + Email instan',
    'Riwayat sinyal & statistik win rate',
  ];

  const paymentMethods = ['QRIS', 'BCA', 'BNI', 'BRI', 'Mandiri', 'OVO', 'DANA', 'ShopeePay'];

  return (
    <>
      {/* ── Xendit Payment Popup ── */}
      {invoiceUrl && (
        <XenditPopup
          invoiceUrl={invoiceUrl}
          onClose={() => setInvoiceUrl(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* ── Payment Success ── */}
      {paid && <PaymentSuccess onDashboard={() => router.push('/dashboard')} />}

      {/* ── Checkout Page ── */}
      <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative">
        {/* Glow effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold">30 Hari Premium Access</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Aktifkan Membership</h1>
            <p className="text-gray-500 text-sm">Bayar sekali, akses semua fitur premium selama 30 hari</p>
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
                {features.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-3">Metode pembayaran tersedia:</p>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <span key={m} className="px-3 py-1 bg-brand-dark border border-brand-border rounded-lg text-xs text-gray-400 font-medium">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full btn-gold rounded-xl py-4 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuat Invoice...
                </>
              ) : (
                'Bayar Sekarang — Rp 299.000'
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Shield className="w-3.5 h-3.5 text-gray-600" />
              <p className="text-gray-600 text-xs">
                Pembayaran diproses oleh Xendit. Akun aktif otomatis setelah bayar.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
