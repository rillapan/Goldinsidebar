// Payment Failed Redirect
import Link from 'next/link';

export default function PaymentFailedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="text-center glass-card p-12 max-w-md">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-2xl font-bold mb-3">Pembayaran Gagal</h1>
        <p className="text-gray-400 mb-8">
          Terjadi masalah dengan pembayaran Anda. Silakan coba lagi.
        </p>
        <Link href="/checkout" className="btn-gold rounded-xl px-8 py-3 inline-block">
          Coba Lagi
        </Link>
      </div>
    </main>
  );
}
