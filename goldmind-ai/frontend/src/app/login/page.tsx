// TAHAP 2 — Halaman Login
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { redirectTo } = await login(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <span className="text-brand-dark font-bold">G</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Masuk ke GoldMind AI</h1>
          <p className="text-gray-500 mt-2 text-sm">Akses sinyal trading dan AI assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors" />
          </div>

          <button type="submit" disabled={loading} className="w-full btn-gold rounded-lg py-3 disabled:opacity-50">
            {loading ? 'Memproses...' : 'Login →'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Belum punya akun? <Link href="/register" className="text-amber-400 hover:underline">Daftar</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
