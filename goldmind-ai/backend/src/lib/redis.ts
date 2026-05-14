// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Redis Client
// Digunakan untuk: cache harga live, session management,
// dan deteksi multi-login
// ═══════════════════════════════════════════════════════════

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 0,      // fail fast per command, don't queue retries
  enableOfflineQueue: false,    // reject immediately when disconnected
  lazyConnect: false,           // connect on import so retryStrategy kicks in
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;               // reconnect in background up to every 5s
  },
});

redis.on('connect', () => {
  redisErrorLogged = false;
  console.log('[redis] Connected');
});

let redisErrorLogged = false;
redis.on('error', (err) => {
  if (!redisErrorLogged) {
    redisErrorLogged = true;
    console.warn('[redis] Tidak tersedia — server tetap jalan tanpa Redis:', err.message);
  }
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
  ttlSeconds: number = 86400 * 7
): Promise<void> {
  try {
    await redis.set(`session:${userId}`, deviceId, 'EX', ttlSeconds);
  } catch {
    console.warn('[redis] setUserSession gagal — session tidak disimpan (Redis tidak tersedia)');
  }
}

export async function getUserSession(userId: string): Promise<string | null> {
  try {
    return await redis.get(`session:${userId}`);
  } catch {
    // Redis down → return null = tidak ada session tersimpan = device check dilewati
    return null;
  }
}

export async function removeUserSession(userId: string): Promise<void> {
  try {
    await redis.del(`session:${userId}`);
  } catch {
    console.warn('[redis] removeUserSession gagal — Redis tidak tersedia');
  }
}

export async function setLivePrice(price: object): Promise<void> {
  try {
    await redis.set('price:xauusd', JSON.stringify(price), 'EX', 120);
  } catch {
    // Non-fatal — price cache bersifat opsional
  }
}

export async function getLivePrice(): Promise<object | null> {
  try {
    const data = await redis.get('price:xauusd');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
