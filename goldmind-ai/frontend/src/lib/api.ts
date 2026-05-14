// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — API Client (Axios + Supabase Auth)
// Token diambil dari Supabase session, bukan cookie manual.
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import { createClient } from '@/utils/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Lazy singleton — satu Supabase client per browser tab, bukan per-request.
let _supabase: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (!_supabase) _supabase = createClient();
  return _supabase;
};

// ─── REQUEST INTERCEPTOR ────────────────────────────────
// Ambil access_token dari Supabase session, masukkan ke Authorization header.
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session }, error } = await getSupabase().auth.getSession();

    if (error) {
      console.error('[api] Gagal ambil session Supabase:', error.message);
    } else if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('[api] getSession exception:', err);
  }

  // Device ID untuk deteksi multi-login
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('gm_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('gm_device_id', deviceId);
    }
    config.headers['X-Device-ID'] = deviceId;
  }

  return config;
});

// ─── RESPONSE INTERCEPTOR ───────────────────────────────
// Urutan penanganan error:
//   1. Network error (ERR_CONNECTION_REFUSED, timeout) → tidak redirect
//   2. 401 Unauthorized → paksa signOut + redirect /login
//   3. MULTI_LOGIN_DETECTED → alert + signOut + redirect
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // ── Network error: error.response tidak ada ──────────
    // Terjadi jika backend tidak berjalan atau timeout.
    // Jangan redirect ke /login — backend down ≠ user logout.
    if (!error.response) {
      const isConnectionRefused =
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_CONNECTION_REFUSED' ||
        error.code === 'ECONNREFUSED';

      const label = isConnectionRefused
        ? `Backend tidak dapat dijangkau di ${API_URL}. Pastikan server berjalan.`
        : `Network error: ${error.message}`;

      console.error('[api] Network error:', label, '| code:', error.code);

      // Tandai error agar caller bisa membedakan dari HTTP error
      error.isNetworkError = true;
      error.userMessage = label;
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = error.response?.data?.code || error.response?.data?.error;

    // ── 401 Unauthorized ─────────────────────────────────
    // Jangan paksa logout jika kita sedang di halaman auth sendiri
    // (login, register, callback) — mencegah redirect loop saat
    // interceptor belum bisa membaca session yang baru saja dibuat.
    if (status === 401) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthPage =
        currentPath.startsWith('/login') ||
        currentPath.startsWith('/register') ||
        currentPath.startsWith('/auth/');

      if (!isAuthPage) {
        console.error('[api] 401 Unauthorized — paksa logout Supabase');
        try {
          await getSupabase().auth.signOut();
        } catch (signOutErr) {
          console.error('[api] Supabase signOut gagal:', signOutErr);
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // ── Multi-login ───────────────────────────────────────
    if (code === 'MULTI_LOGIN_DETECTED') {
      console.error('[api] Multi-login terdeteksi — paksa logout');
      try {
        await getSupabase().auth.signOut();
      } catch {}
      if (typeof window !== 'undefined') {
        alert('Akun Anda sedang digunakan di perangkat lain. Silakan login ulang.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
