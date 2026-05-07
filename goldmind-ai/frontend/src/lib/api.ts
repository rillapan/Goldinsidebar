// ═══════════════════════════════════════════════════════════
// GoldMind AI — API Client (Axios)
// Centralized HTTP client with JWT interceptor
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = Cookies.get('gm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach device ID for multi-login detection
  let deviceId = localStorage.getItem('gm_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('gm_device_id', deviceId);
  }
  config.headers['X-Device-ID'] = deviceId;

  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401) {
      Cookies.remove('gm_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    if (code === 'MULTI_LOGIN_DETECTED') {
      Cookies.remove('gm_token');
      if (typeof window !== 'undefined') {
        alert('Akun Anda sedang digunakan di perangkat lain.');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
