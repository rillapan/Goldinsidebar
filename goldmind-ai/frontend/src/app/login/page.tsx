// TAHAP 2 — Halaman Login (Supabase Auth)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Jika sudah ada session aktif, langsung ke dashboard
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw new Error(oauthError.message);
    } catch (err: any) {
      setError(err.message || t.login.errors.googleFail);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Login via Supabase — verifikasi email + password
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        // Terjemahkan pesan error Supabase
        if (supabaseError.message.includes('Invalid login credentials')) {
          throw new Error(t.login.errors.invalidCredentials);
        }
        if (supabaseError.message.includes('Email not confirmed')) {
          throw new Error(t.login.errors.emailNotConfirmed);
        }
        throw new Error(supabaseError.message);
      }

      if (!data.session) {
        throw new Error(t.login.errors.sessionFailed);
      }

      // 2. Sync device ke Redis
      // Non-fatal: jika backend down, login Supabase tetap berhasil.
      // Single-device enforcement masih bisa berjalan dari middleware backend.
      try {
        await api.post('/auth/sync-device');
      } catch (syncErr: any) {
        if (syncErr.isNetworkError) {
          // Backend tidak jalan — catat tapi jangan hentikan alur login
          console.warn('[login] Backend tidak tersedia saat sync-device, lanjut tanpa sync.');
        } else {
          console.error('[login] Device sync gagal:', syncErr.response?.data || syncErr.message);
        }
      }

      // 3. Ambil data user dari backend (termasuk status membership)
      let user: any;
      try {
        const res = await api.get('/auth/me');
        user = res.data.data;
      } catch (meErr: any) {
        if (meErr.isNetworkError) {
          throw new Error(t.login.errors.backendDown);
        }
        throw meErr;
      }

      if (!user) {
        throw new Error(t.login.errors.profileNotFound);
      }

      // 4. Simpan ke Zustand store
      login(user);

      // 5. Redirect ke dashboard — PENDING users melihat upgrade overlay di sana
      router.push('/dashboard');

    } catch (err: any) {
      console.error('[login] Error:', err);
      const msg =
        err.userMessage ||                     // Network error dari api.ts interceptor
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t.login.errors.genericFail;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative">
      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <img src="/img/logo.jpg" alt="Logo" className="h-10 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold">{t.login.title}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t.login.emailLabel}</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">{t.login.passwordLabel}</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full btn-gold rounded-lg py-3 disabled:opacity-50"
          >
            {loading ? t.login.loading : t.login.submitButton}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-gray-600 text-xs">{t.login.or}</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg py-3 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {googleLoading ? t.login.googleLoading : t.login.googleButton}
          </button>

          <p className="text-center text-gray-500 text-sm">
            {t.login.noAccount}{' '}
            <Link href="/register" className="text-amber-400 hover:underline">{t.login.register}</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
