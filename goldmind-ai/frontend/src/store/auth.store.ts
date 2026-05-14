// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Auth Store (Zustand + Supabase Auth)
// register() dihapus — ditangani langsung di register/page.tsx.
// login() hanya menyimpan state — caller bertanggung jawab auth Supabase.
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { api } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  activeMembership?: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Simpan user ke store (dipanggil setelah Supabase login sukses)
  login: (user: User) => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Hanya update state — supabase.auth.signInWithPassword dipanggil di page
  login: (user: User) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const supabase = createClient();

    // Hapus session di backend Redis
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('[auth] Backend logout error (non-fatal):', err);
    }

    // Sign out dari Supabase (hapus token dari browser)
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[auth] Supabase signOut error:', err);
    }

    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Dipanggil saat app pertama load — cek session Supabase lalu ambil user dari backend
  fetchUser: async () => {
    const supabase = createClient();
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[auth] getSession error:', error.message);
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (!session) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Session valid — ambil data user dari backend (termasuk membership info)
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });

    } catch (err) {
      console.error('[auth] fetchUser error:', err);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
