'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Status = 'verifying' | 'creating_profile' | 'redirecting' | 'error';

const STEPS = [
  { key: 'verifying',        label: 'Memverifikasi email'  },
  { key: 'creating_profile', label: 'Menyiapkan akun'      },
  { key: 'redirecting',      label: 'Mengarahkan...'        },
];

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [status, setStatus]     = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let handled = false;

    const finalize = async () => {
      if (handled) return;
      handled = true;

      try {
        setStatus('creating_profile');

        // Kirim profil jika ada data pending dari register
        const pendingRaw = localStorage.getItem('gm_pending_profile');
        if (pendingRaw) {
          try {
            await api.post('/auth/profile', JSON.parse(pendingRaw));
            localStorage.removeItem('gm_pending_profile');
          } catch (profileErr: any) {
            const code = profileErr.response?.data?.error;
            if (code === 'EMAIL_ATAU_WA_SUDAH_ADA' || code === 'PHONE_TAKEN') {
              localStorage.removeItem('gm_pending_profile');
            }
            // error lain — lanjut saja, jangan stuck di sini
          }
        }

        // Ambil data user dari backend
        let user: any = null;
        try {
          const res = await api.get('/auth/me');
          user = res.data.data;
        } catch (meErr: any) {
          const s = meErr.response?.status;
          if (s !== 401 && s !== 404) throw meErr;
        }

        // User baru via Google OAuth — buat profil minimal
        if (!user) {
          const { data: { session: s } } = await supabase.auth.getSession();
          const meta = s?.user?.user_metadata ?? {};
          try {
            await api.post('/auth/profile', {
              full_name: meta.full_name || meta.name || s?.user?.email?.split('@')[0] || 'User',
              phone_number: '',
            });
            localStorage.removeItem('gm_pending_profile');
          } catch (profileErr: any) {
            const code = profileErr.response?.data?.error;
            if (code !== 'EMAIL_ATAU_WA_SUDAH_ADA' && code !== 'PHONE_TAKEN') {
              throw new Error('Gagal membuat profil. Hubungi admin.');
            }
          }
          const res2 = await api.get('/auth/me');
          user = res2.data.data;
        }

        if (!user) throw new Error('Profil tidak ditemukan. Hubungi admin.');

        login(user);
        setStatus('redirecting');

        await new Promise((r) => setTimeout(r, 800));
        router.push('/dashboard');

      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Terjadi kesalahan. Coba login manual.';
        setErrorMsg(msg);
        setStatus('error');
      }
    };

    // Dengarkan SIGNED_IN dari Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) finalize();
    });

    // PKCE: tukar code dari URL dengan session
    const params   = new URLSearchParams(window.location.search);
    const code       = params.get('code');
    const tokenHash  = params.get('token_hash');
    const type       = params.get('type') as 'signup' | 'recovery' | null;

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('[callback] exchangeCodeForSession error:', error.message, error);
          // "One-time token not found" → Google bot consumed the link
          // "both auth code and code verifier should be non-empty" → different browser
          setErrorMsg(
            error.message.includes('token not found') || error.message.includes('expired')
              ? 'Link sudah tidak berlaku (kemungkinan sudah pernah dibuka oleh email client). Silakan daftar ulang atau gunakan kode OTP dari email.'
              : 'Link konfirmasi tidak valid atau sudah kedaluwarsa.'
          );
          setStatus('error');
        }
        // success handled by onAuthStateChange
      }).catch((err) => {
        console.error('[callback] exchangeCodeForSession exception:', err);
        setErrorMsg('Konfirmasi email gagal. Coba klik link ulang.');
        setStatus('error');
      });
    } else if (tokenHash && type) {
      // Fallback: older Supabase flow sends token_hash + type
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
        if (error) {
          console.error('[callback] verifyOtp error:', error.message);
          setErrorMsg('Link konfirmasi tidak valid atau sudah kedaluwarsa.');
          setStatus('error');
        }
        // success handled by onAuthStateChange
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          finalize();
        } else {
          setErrorMsg('Link konfirmasi tidak valid atau sudah kedaluwarsa.');
          setStatus('error');
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = STEPS.findIndex((s) => s.key === status);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-brand-dark relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/img/logo.jpg" alt="Logo" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-gradient-gold">SINYAL COHIBA</span>
          </Link>
        </div>

        {status !== 'error' ? (
          /* ── LOADING / PROGRESS CARD ── */
          <div className="glass-card p-8 space-y-8">
            {/* Animated icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  {status === 'redirecting' ? (
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                {/* Spinning ring */}
                {status !== 'redirecting' && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">
                {status === 'redirecting' ? 'Email Terverifikasi!' : 'Memverifikasi Email'}
              </h2>
              <p className="text-gray-500 text-sm">
                {status === 'redirecting'
                  ? 'Akun kamu siap. Mengarahkan ke dashboard...'
                  : 'Mohon tunggu, sedang memproses konfirmasi email kamu.'}
              </p>
            </div>

            {/* Step progress */}
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const done    = currentStep > i;
                const active  = currentStep === i;
                const pending = currentStep < i;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {/* Step indicator */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300 ${
                      done    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' :
                      active  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' :
                                'bg-brand-border/50 border border-brand-border text-gray-600'
                    }`}>
                      {done ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    {/* Label */}
                    <span className={`text-sm transition-colors duration-300 ${
                      done    ? 'text-emerald-400' :
                      active  ? 'text-amber-400 font-medium' :
                                'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {/* Active pulse */}
                    {active && (
                      <span className="ml-auto flex gap-0.5">
                        {[0, 1, 2].map((j) => (
                          <span
                            key={j}
                            className="w-1 h-1 rounded-full bg-amber-400 animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── ERROR CARD ── */
          <div className="glass-card p-8 space-y-6">
            {/* Error icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>

            {/* Message */}
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-2">Verifikasi Gagal</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{errorMsg}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full btn-gold rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login Manual
              </Link>
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-brand-border text-gray-400 hover:text-white hover:border-amber-500/30 transition-all text-sm"
              >
                Daftar Ulang
              </Link>
            </div>

            {/* Help text */}
            <p className="text-center text-gray-600 text-xs">
              Link konfirmasi hanya berlaku 24 jam. Jika sudah lewat, daftar ulang dengan email yang sama.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
