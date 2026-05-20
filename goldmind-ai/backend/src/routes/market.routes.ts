import { Router, Request, Response } from 'express';
import axios from 'axios';
import { redis, getLivePrice } from '../lib/redis';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';

interface LivePriceData {
  symbol?: string;
  price?: number;
  close?: number;
  timestamp: string;
  day_change?: number;
}

const router = Router();

// ── USD/IDR Rate helpers ──────────────────────────────────────

const RATE_CACHE_KEY = 'rate:usd_idr';
const RATE_CACHE_TTL = 1200; // 20 menit
const RATE_FALLBACK  = 16300;

async function getCachedRate(): Promise<number | null> {
  try {
    const cached = await redis.get(RATE_CACHE_KEY);
    return cached ? parseFloat(cached) : null;
  } catch {
    return null;
  }
}

async function fetchAndCacheRate(): Promise<number> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return RATE_FALLBACK;

  try {
    const { data } = await axios.get<{ price: string }>(
      `https://api.twelvedata.com/price?symbol=USD/IDR&apikey=${apiKey}`,
      { timeout: 5000 }
    );
    const rate = parseFloat(data.price);
    if (!isNaN(rate) && rate > 1000) {
      await redis.set(RATE_CACHE_KEY, rate.toString(), 'EX', RATE_CACHE_TTL);
      return rate;
    }
  } catch {
    // API gagal — gunakan fallback
  }
  return RATE_FALLBACK;
}

async function getLiveUsdIdrRate(): Promise<{ rate: number; cached: boolean }> {
  const cached = await getCachedRate();
  if (cached) return { rate: cached, cached: true };
  const rate = await fetchAndCacheRate();
  return { rate, cached: false };
}

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
    const { rate } = await getLiveUsdIdrRate();

    return res.json({
      status: staleSeconds > 90 ? 'stale' : 'live',
      price: price ?? null,
      priceIDR: price ? Math.round(price * rate) : null,
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

// ── GET /api/market/exchange-rate ─────────────────────────────
// Public — mengembalikan kurs USD/IDR saat ini dari cache Redis.
// Di-refresh otomatis setiap 20 menit via Twelve Data API.
router.get('/exchange-rate', async (_req: Request, res: Response) => {
  try {
    const { rate, cached } = await getLiveUsdIdrRate();
    return res.json({
      success: true,
      rate,
      symbol: 'USD/IDR',
      cached,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return res.json({
      success: true,
      rate: RATE_FALLBACK,
      symbol: 'USD/IDR',
      cached: false,
      updatedAt: new Date().toISOString(),
    });
  }
});

// ── GET /api/market/calculator ────────────────────────────────
// Public — kalkulasi profit/risk lot emas XAUUSD dengan kurs live.
// Query params:
//   modal     : number (IDR, wajib)
//   lot       : number (default 0.01)
//   targetPips: number (default 20)
//   slPips    : number (default 20)
router.get('/calculator', async (req: Request, res: Response) => {
  try {
    const modal      = parseFloat(String(req.query.modal || '0'));
    const lot        = parseFloat(String(req.query.lot       || '0.01'));
    const targetPips = parseFloat(String(req.query.targetPips || '20'));
    const slPips     = parseFloat(String(req.query.slPips     || '20'));

    if (modal < 0 || lot <= 0 || targetPips <= 0 || slPips <= 0) {
      return res.status(400).json({ success: false, message: 'Parameter tidak valid.' });
    }

    const { rate: usdIdrRate } = await getLiveUsdIdrRate();

    // Nilai per pip (USD)
    // 1 pip XAUUSD = $0.10 pada 0.01 lot → rumus: (lot / 0.01) * 0.10
    const pipValueUSD = (lot / 0.01) * 0.10;

    // Modal dalam USD
    const modalUSD = modal / usdIdrRate;

    // Estimasi profit/risk per arah (USD)
    const profitPerTradeUSD = targetPips * pipValueUSD;
    const riskPerTradeUSD   = slPips     * pipValueUSD;

    // Proyeksi (20 hari kerja per bulan)
    const profitPerDayUSD   = profitPerTradeUSD;
    const profitPerMonthUSD = profitPerDayUSD * 20;
    const profitPerYearUSD  = profitPerMonthUSD * 12;

    // Konversi ke IDR
    const toIDR = (usd: number) => Math.round(usd * usdIdrRate);

    return res.json({
      success: true,
      input: { modal, lot, targetPips, slPips },
      rate: {
        usdIdr: usdIdrRate,
        symbol: 'USD/IDR',
      },
      result: {
        pipValueUSD:       parseFloat(pipValueUSD.toFixed(2)),
        modalUSD:          parseFloat(modalUSD.toFixed(2)),
        profitPerTradeUSD: parseFloat(profitPerTradeUSD.toFixed(2)),
        riskPerTradeUSD:   parseFloat(riskPerTradeUSD.toFixed(2)),
        rrRatio:           parseFloat((targetPips / slPips).toFixed(2)),
        profitPerDayUSD:   parseFloat(profitPerDayUSD.toFixed(2)),
        profitPerMonthUSD: parseFloat(profitPerMonthUSD.toFixed(2)),
        profitPerYearUSD:  parseFloat(profitPerYearUSD.toFixed(2)),
        profitPerDayIDR:   toIDR(profitPerDayUSD),
        profitPerMonthIDR: toIDR(profitPerMonthUSD),
        profitPerYearIDR:  toIDR(profitPerYearUSD),
        riskPerTradeIDR:   toIDR(riskPerTradeUSD),
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Kalkulasi gagal.' });
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
