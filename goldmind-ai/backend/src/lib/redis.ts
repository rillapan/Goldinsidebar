// ═══════════════════════════════════════════════════════════
// GoldMind AI — Redis Client
// Digunakan untuk: cache harga live, session management,
// dan deteksi multi-login
// ═══════════════════════════════════════════════════════════

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('🔴 Redis client connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// ─── HELPER FUNCTIONS ───────────────────────────────────

/**
 * Simpan session user ke Redis dengan TTL.
 * Key format: session:{userId}
 * Value: deviceId aktif saat ini
 */
export async function setUserSession(
  userId: string,
  deviceId: string,
  ttlSeconds: number = 86400 * 7 // 7 hari
): Promise<void> {
  await redis.set(`session:${userId}`, deviceId, 'EX', ttlSeconds);
}

/**
 * Ambil deviceId session aktif user.
 * Digunakan untuk validasi multi-login.
 */
export async function getUserSession(userId: string): Promise<string | null> {
  return redis.get(`session:${userId}`);
}

/**
 * Hapus session user (logout).
 */
export async function removeUserSession(userId: string): Promise<void> {
  await redis.del(`session:${userId}`);
}

/**
 * Simpan harga live XAUUSD ke Redis.
 * Key: price:xauusd
 * TTL: 120 detik (auto-refresh dari WebSocket)
 */
export async function setLivePrice(price: object): Promise<void> {
  await redis.set('price:xauusd', JSON.stringify(price), 'EX', 120);
}

/**
 * Ambil harga live XAUUSD dari cache.
 */
export async function getLivePrice(): Promise<object | null> {
  const data = await redis.get('price:xauusd');
  return data ? JSON.parse(data) : null;
}
