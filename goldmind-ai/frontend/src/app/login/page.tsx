'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { t } = useI18n();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect jika sudah ada session aktif
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

      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({ email, password });

      if (supabaseError) {
        if (supabaseError.message.includes('Invalid login credentials'))
          throw new Error(t.login.errors.invalidCredentials);
        if (supabaseError.message.includes('Email not confirmed'))
          throw new Error(t.login.errors.emailNotConfirmed);
        throw new Error(supabaseError.message);
      }

      if (!data.session) throw new Error(t.login.errors.sessionFailed);

      try {
        await api.post('/auth/sync-device');
      } catch (syncErr: any) {
        if (syncErr.isNetworkError)
          console.warn('[login] Backend tidak tersedia saat sync-device.');
        else
          console.error('[login] Device sync gagal:', syncErr.response?.data || syncErr.message);
      }

      let user: any;
      try {
        const res = await api.get('/auth/me');
        user = res.data.data;
      } catch (meErr: any) {
        if (meErr.isNetworkError) throw new Error(t.login.errors.backendDown);
        throw meErr;
      }

      if (!user) throw new Error(t.login.errors.profileNotFound);

      login(user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg =
        err.userMessage ||
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
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative overflow-hidden">

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-amber-600/4 blur-[100px]" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo + header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <img src="/img/logo.jpg" alt="SINYAL COHIBA" className="h-12 w-auto mx-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-white font-display">{t.login.title}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t.login.subtitle}</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                {t.login.emailLabel}
              </label>
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

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  {t.login.passwordLabel}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  {t.login.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" strokeWidth={1.8} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg pl-10 pr-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                    : <Eye className="h-4 w-4" strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-brand-border bg-brand-dark accent-amber-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer select-none">
                {t.login.rememberMe}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full btn-gold rounded-lg py-3 font-semibold disabled:opacity-50 transition-opacity"
            >
              {loading ? t.login.loading : t.login.submitButton}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-gray-600 text-xs uppercase tracking-wider">{t.login.or}</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg py-3 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H.957v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.621 0 3.063.556 4.21 1.644l3.152-3.152C17.45 2.09 14.97 1 12 1A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            {googleLoading ? t.login.googleLoading : t.login.googleButton}
          </button>

          {/* Register link */}
          <p className="text-center text-gray-500 text-sm">
            {t.login.noAccount}{' '}
            <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
              {t.login.register}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
