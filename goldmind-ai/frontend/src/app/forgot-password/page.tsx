'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (resetError) throw new Error(resetError.message);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim email. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <img src="/img/logo.jpg" alt="SINYAL COHIBA" className="h-12 w-auto mx-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-white font-display">
            {sent ? 'Email Terkirim' : 'Lupa Password?'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {sent
              ? `Link reset password sudah dikirim ke ${email}`
              : 'Masukkan email kamu dan kami akan kirimkan link reset password.'}
          </p>
        </div>

        <div className="glass-card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center">
                <Mail className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Cek inbox (dan folder spam) kamu. Klik link di email untuk reset password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" strokeWidth={1.8} />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold rounded-lg py-3 font-semibold disabled:opacity-50 transition-opacity"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
