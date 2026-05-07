// Payment Success Redirect
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark">
      <div className="text-center glass-card p-12 max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold mb-3">Pembayaran Berhasil!</h1>
        <p className="text-gray-400 mb-8">
          Akun Anda sudah aktif. Selamat bergabung di GoldMind AI!
        </p>
        <Link href="/dashboard" className="btn-gold rounded-xl px-8 py-3 inline-block">
          Masuk Dashboard →
        </Link>
      </div>
    </main>
  );
}
