import { Router, Request, Response } from 'express';
import { redis, getLivePrice } from '../lib/redis';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';

interface LivePriceData {
  symbol?: string;
  price?: number;
  close?: number;
  timestamp: string;
  day_change?: number;
}

const USD_TO_IDR = 16300;
const router = Router();

// ── GET /api/market/status ────────────────────────────────────
// Public — tidak butuh auth. Dipakai frontend untuk health check.
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const raw = await getLivePrice() as LivePriceData | null;

    if (!raw) {
      return res.json({
        status: 'stale',
        price: null,
        priceIDR: null,
        timestamp: null,
        staleSeconds: 9999,
      });
    }

    const staleSeconds = (Date.now() - new Date(raw.timestamp).getTime()) / 1000;
    const price = raw.close || raw.price;

    return res.json({
      status: staleSeconds > 90 ? 'stale' : 'live',
      price: price ?? null,
      priceIDR: price ? Math.round(price * USD_TO_IDR) : null,
      timestamp: raw.timestamp,
      staleSeconds: Math.round(staleSeconds),
    });
  } catch {
    return res.status(503).json({
      status: 'stale',
      price: null,
      priceIDR: null,
      timestamp: null,
      staleSeconds: 9999,
    });
  }
});

// ── Auth gate untuk endpoint premium ─────────────────────────
router.use(verifyToken, checkMembership);

// ── GET /api/market/candles ───────────────────────────────────
// Premium only. Mengembalikan 30 candle terakhir dari Redis sorted set.
router.get('/candles', async (_req: Request, res: Response) => {
  try {
    const raw = await redis.zrange('candles:xauusd:1m', -30, -1);

    const candles: LivePriceData[] = raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as LivePriceData;
        } catch {
          return null;
        }
      })
      .filter((c): c is LivePriceData => c !== null && !!(c.close || c.price));

    return res.json({ success: true, data: candles });
  } catch {
    return res.status(503).json({
      success: false,
      message: 'Data candle tidak tersedia saat ini.',
      data: [],
    });
  }
});

export default router;
