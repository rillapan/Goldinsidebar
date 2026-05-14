// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Shared Constants
// ═══════════════════════════════════════════════════════════

export const APP_NAME = 'SINYAL COHIBA';
export const APP_DESCRIPTION = 'AI Trading Signal & Membership Platform untuk XAUUSD';
export const MEMBERSHIP_PRICE = 299000; // Rp 299.000
export const MEMBERSHIP_DURATION_DAYS = 30;

// Renewal reminder days
export const REMINDER_H7 = 7;
export const REMINDER_H3 = 3;

// Signal confidence threshold
export const MIN_CONFIDENCE_THRESHOLD = 65;

// Rate limiting
export const API_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // max 100 requests per window
};

export const CHAT_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 menit
  max: 10, // max 10 pesan per menit
};
