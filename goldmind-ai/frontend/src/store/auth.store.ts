// ═══════════════════════════════════════════════════════════
// GoldMind AI — Auth Store (Zustand)
// Global state management for authentication
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

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
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<{ redirectTo: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: Cookies.get('gm_token') || null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token, deviceId, redirectTo } = res.data.data;

    Cookies.set('gm_token', token, { expires: 7 });
    localStorage.setItem('gm_device_id', deviceId);

    set({ user, token, isAuthenticated: true, isLoading: false });
    return { redirectTo };
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token, deviceId, redirectTo } = res.data.data;

    Cookies.set('gm_token', token, { expires: 7 });
    localStorage.setItem('gm_device_id', deviceId);

    set({ user, token, isAuthenticated: true, isLoading: false });
    return { redirectTo };
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    Cookies.remove('gm_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  fetchUser: async () => {
    const token = Cookies.get('gm_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true, isLoading: false });
    } catch {
      Cookies.remove('gm_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
