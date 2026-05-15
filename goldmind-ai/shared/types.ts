// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Shared Type Definitions
// Digunakan oleh Frontend dan Backend
// ═══════════════════════════════════════════════════════════

// ─── ENUMS ──────────────────────────────────────────────

export type UserRole = 'MEMBER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type SignalStatus = 'ACTIVE' | 'TP_HIT' | 'SL_HIT' | 'PARTIAL_TP' | 'CANCELLED' | 'MANUAL_CLOSE';
export type BiasDirection = 'BUY' | 'SELL' | 'WAIT';
export type TransactionStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'QRIS' | 'VIRTUAL_ACCOUNT' | 'EWALLET' | 'BANK_TRANSFER';

// ─── USER ───────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  telegramId?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  activeMembership?: Membership | null;
}

// ─── MEMBERSHIP ─────────────────────────────────────────

export interface Membership {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// ─── SIGNAL ─────────────────────────────────────────────

export interface Signal {
  id: string;
  type: SignalType;
  status: SignalStatus;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  currentSl?: number;
  partialTp?: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  exitPrice?: number;
  pnlPips?: number;
  closedAt?: string;
  createdAt: string;
}

// ─── TRANSACTION ────────────────────────────────────────

export interface Transaction {
  id: string;
  userId: string;
  xenditInvoiceId: string;
  xenditInvoiceUrl?: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  status: TransactionStatus;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

// ─── DAILY BIAS ─────────────────────────────────────────

export interface DailyBias {
  id: string;
  date: string;
  direction: BiasDirection;
  confidence: number;
  reasoning: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

// ─── CHAT ───────────────────────────────────────────────

export interface ChatSession {
  id: string;
  userId: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  priceContext?: object;
  createdAt: string;
}

// ─── MARKET / LIVE PRICE ─────────────────────────────────

export interface PriceData {
  symbol: string;
  price?: number;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  timestamp: string;
  day_change?: number;
}

export interface MarketStatus {
  status: 'live' | 'stale';
  price: number | null;
  priceIDR: number | null;
  timestamp: string | null;
  staleSeconds: number;
}

// ─── API RESPONSES ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
  redirectTo?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── ROUTE DEFINITIONS ─────────────────────────────────

export interface RouteDefinition {
  path: string;
  role: 'public' | 'member' | 'admin';
  fungsi: string;
}

export const ROUTES: RouteDefinition[] = [
  // Public routes
  { path: '/', role: 'public', fungsi: 'Landing page — testimoni, win rate, chart historis, CTA' },
  { path: '/register', role: 'public', fungsi: 'Halaman registrasi — form nama, email, WA, password' },
  { path: '/login', role: 'public', fungsi: 'Halaman login' },
  { path: '/checkout', role: 'public', fungsi: 'Halaman checkout & pilih metode bayar (Xendit)' },
  { path: '/payment/success', role: 'public', fungsi: 'Konfirmasi pembayaran berhasil' },
  { path: '/payment/failed', role: 'public', fungsi: 'Notifikasi pembayaran gagal' },
  
  // Member routes (membutuhkan auth + membership ACTIVE)
  { path: '/dashboard', role: 'member', fungsi: 'Halaman utama member — sinyal aktif + Daily Bias + harga live' },
  { path: '/signals', role: 'member', fungsi: 'List sinyal trading real-time + history' },
  { path: '/signals/:id', role: 'member', fungsi: 'Detail sinyal — entry, SL, TP, reasoning, status' },
  { path: '/bias', role: 'member', fungsi: 'Daily Bias hari ini + riwayat 30 hari' },
  { path: '/chat', role: 'member', fungsi: 'AI Chat Assistant — analisa teknikal interaktif' },
  { path: '/profile', role: 'member', fungsi: 'Profil user — data akun, history pembayaran' },
  { path: '/renew', role: 'member', fungsi: 'Halaman renewal membership (saat expired)' },
  
  // Admin routes
  { path: '/admin', role: 'admin', fungsi: 'Dashboard admin — statistik, member, revenue' },
  { path: '/admin/members', role: 'admin', fungsi: 'Manajemen member — list, status, detail' },
  { path: '/admin/signals', role: 'admin', fungsi: 'Monitoring sinyal — history, win rate' },
  { path: '/admin/bias', role: 'admin', fungsi: 'Manajemen Daily Bias — edit/approve/publish' },
  { path: '/admin/transactions', role: 'admin', fungsi: 'Log transaksi — pembayaran, invoice' },
];
