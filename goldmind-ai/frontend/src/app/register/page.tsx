'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  const [step, setStep]           = useState<Step>('form');
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [otp, setOtp]             = useState(['', '', '', '', '', '']);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (supabaseError) {
        if (supabaseError.message.includes('User already registered')) {
          throw new Error(t.register.errors.alreadyRegistered);
        }
        if (supabaseError.message.includes('Password should be')) {
          throw new Error(t.register.errors.passwordTooShort);
        }
        if (supabaseError.message.toLowerCase().includes('rate limit')) {
          throw new Error(t.register.errors.rateLimited);
        }
        throw new Error(supabaseError.message);
      }

      if (!data.user) throw new Error(t.register.errors.registrationFailed);

      const profilePayload = { full_name: fullName, phone_number: '' };

      // User already confirmed (e.g. email confirmation disabled) — go directly
      if (data.session) {
        try {
          await api.post('/auth/profile', profilePayload);
        } catch (profileErr: any) {
          const code = profileErr.response?.data?.error;
          if (code !== 'EMAIL_ATAU_WA_SUDAH_ADA') {
            throw new Error(t.register.errors.profileFailed);
          }
        }
        window.location.href = '/dashboard';
        return;
      }

      // Email confirmation required — show OTP input
      localStorage.setItem('gm_pending_profile', JSON.stringify(profilePayload));
      setStep('otp');
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);

    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || t.register.errors.registrationFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits filled
    if (next.every(Boolean) && next.join('').length === 6) {
      handleVerifyOtp(next.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      setTimeout(() => handleVerifyOtp(pasted), 50);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (verifyError) {
        if (verifyError.message.toLowerCase().includes('expired') || verifyError.message.toLowerCase().includes('invalid')) {
          throw new Error(t.register.errors.otpInvalid);
        }
        throw new Error(verifyError.message);
      }

      // Kode benar — buat profil
      const pendingRaw = localStorage.getItem('gm_pending_profile');
      if (pendingRaw) {
        try {
          await api.post('/auth/profile', JSON.parse(pendingRaw));
          localStorage.removeItem('gm_pending_profile');
        } catch (profileErr: any) {
          const code = profileErr.response?.data?.error;
          if (code !== 'EMAIL_ATAU_WA_SUDAH_ADA' && code !== 'PHONE_TAKEN') {
            throw new Error(t.register.errors.emailVerifiedProfileFailed);
          }
          localStorage.removeItem('gm_pending_profile');
        }
      }

      window.location.href = '/dashboard';

    } catch (err: any) {
      setError(err.message || t.register.errors.verifyFailed);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw new Error(error.message);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || t.register.errors.resendFailed);
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    'w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors';

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-dark relative">
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
          <h1 className="text-2xl font-bold">
            {step === 'form' ? t.register.title : t.register.otpTitle}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'form'
              ? t.register.subtitle
              : `${t.register.otpSubtitle} ${email}`}
          </p>
        </div>

        <div className="glass-card p-8 space-y-5">
          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {t.register.nameLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.register.namePlaceholder}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {t.register.emailLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.register.emailPlaceholder}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {t.register.passwordLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.register.passwordPlaceholder}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.register.loading : t.register.submitButton}
              </button>
            </form>
          ) : (
            /* ── OTP STEP ── */
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email icon */}
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* OTP boxes */}
              <div
                className="flex gap-2 justify-center"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-14 text-center text-xl font-bold bg-brand-dark border border-brand-border rounded-lg text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors disabled:opacity-50"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp(otp.join(''))}
                disabled={loading || otp.some((d) => !d)}
                className="w-full btn-gold rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.register.verifying : t.register.verifyButton}
              </button>

              {/* Resend */}
              <div className="text-center">
                <span className="text-gray-500 text-sm">{t.register.noCode} </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="text-amber-400 hover:underline text-sm disabled:text-gray-600 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resending
                    ? t.register.resending
                    : resendCooldown > 0
                    ? `${t.register.resendCountdown} (${resendCooldown}s)`
                    : t.register.resendCode}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {t.register.changeEmail}
              </button>
            </div>
          )}

          {step === 'form' && (
            <p className="text-center text-gray-500 text-sm">
              {t.register.hasAccount}{' '}
              <Link href="/login" className="text-amber-400 hover:underline">{t.register.loginLink}</Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
