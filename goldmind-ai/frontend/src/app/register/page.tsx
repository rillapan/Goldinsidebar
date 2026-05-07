// TAHAP 2 — Halaman Registrasi
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { redirectTo } = await register(form);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
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
          <h1 className="text-2xl font-bold">Buat Akun GoldMind AI</h1>
          <p className="text-gray-500 mt-2 text-sm">Mulai dapatkan sinyal trading AI terbaik</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {(['name', 'email', 'phone', 'password'] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm text-gray-400 mb-1.5 capitalize">
                {field === 'phone' ? 'Nomor WhatsApp' : field === 'name' ? 'Nama Lengkap' : field}
              </label>
              <input
                id={`register-${field}`}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                placeholder={field === 'phone' ? '08xxxxxxxxxx' : ''}
                required
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar & Lanjut Bayar →'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-amber-400 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
