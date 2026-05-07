// ═══════════════════════════════════════════════════════════
// GoldMind AI — Internal API Routes
// Digunakan HANYA oleh AI Engine (Python FastAPI service).
// Tidak diekspos ke publik — dilindungi X-Internal-Key header.
//
// POST /api/internal/signals — Terima sinyal baru dari AI engine
// POST /api/internal/bias    — Terima Daily Bias dari AI engine
// POST /api/internal/price   — Terima update harga live dari price feed
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma';
import { broadcastSignal, broadcastPrice } from '../lib/socket';
import {
  sendSignalNotification,
  sendDailyBiasNotification,
} from '../lib/notifications';

const router = Router();

// ─── MIDDLEWARE: Verifikasi X-Internal-Key ────────────────
// Endpoint ini hanya boleh dipanggil oleh AI engine dengan
// kunci yang sama persis seperti INTERNAL_API_KEY di .env.

function verifyInternalKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.headers['x-internal-key'] as string | undefined;
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized. X-Internal-Key tidak valid.',
    });
    return;
  }
  next();
}

router.use(verifyInternalKey);

// ─── POST /api/internal/signals ──────────────────────────
// Menerima sinyal dari Python AI Engine.
// Alur: simpan ke PostgreSQL → broadcast via Socket.IO → blast Telegram.

router.post('/signals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signal, entry, sl, tp, confidence, timeframe, reasoning } = req.body;

    // Validasi field wajib
    if (!signal || !entry || !sl || !tp || !confidence) {
      res.status(400).json({
        success: false,
        message: 'Field wajib: signal, entry, sl, tp, confidence.',
      });
      return;
    }

    // Simpan sinyal ke PostgreSQL
    const signalRecord = await prisma.signal.create({
      data: {
        type: signal as 'BUY' | 'SELL' | 'HOLD',
        entryPrice: parseFloat(entry),
        stopLoss: parseFloat(sl),
        takeProfit: parseFloat(tp),
        confidence: parseInt(confidence),
        timeframe: timeframe || 'M15',
        reasoning: reasoning || '',
        status: 'ACTIVE',
      },
    });

    // Broadcast ke semua member aktif via Socket.IO
    const io = req.app.get('io') as SocketIOServer | undefined;
    if (io) broadcastSignal(io, signalRecord);

    // Blast notifikasi Telegram (async — tidak menunda response)
    sendSignalNotification({
      type: signal,
      entryPrice: parseFloat(entry),
      stopLoss: parseFloat(sl),
      takeProfit: parseFloat(tp),
      confidence: parseInt(confidence),
      timeframe: timeframe || 'M15',
      reasoning: reasoning || '',
    }).catch(console.error);

    console.log(`✅ [INTERNAL/SIGNALS] ${signal} @ ${entry} — disimpan & dibroadcast`);
    res.status(201).json({ success: true, data: signalRecord });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/internal/bias ─────────────────────────────
// Menerima Daily Bias dari Python AI Engine.
// Alur: upsert ke PostgreSQL → auto-publish → blast WA + Telegram.

router.post('/bias', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, direction, confidence, reasoning, newsData } = req.body;

    if (!date || !direction || !confidence || !reasoning) {
      res.status(400).json({
        success: false,
        message: 'Field wajib: date, direction, confidence, reasoning.',
      });
      return;
    }

    // Normalisasi tanggal ke 00:00:00 UTC
    const biasDate = new Date(date);
    biasDate.setUTCHours(0, 0, 0, 0);

    // Upsert: update jika sudah ada bias hari ini, buat baru jika belum
    const biasRecord = await prisma.dailyBias.upsert({
      where: { date: biasDate },
      update: {
        direction: direction as 'BUY' | 'SELL' | 'WAIT',
        confidence: parseInt(confidence),
        reasoning,
        newsData: newsData || null,
        isPublished: true,
        publishedAt: new Date(),
      },
      create: {
        date: biasDate,
        direction: direction as 'BUY' | 'SELL' | 'WAIT',
        confidence: parseInt(confidence),
        reasoning,
        newsData: newsData || null,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Blast ke semua member aktif via WA + Telegram (async)
    sendDailyBiasNotification({
      direction,
      confidence: parseInt(confidence),
      reasoning,
      date: biasDate.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }),
    }).catch(console.error);

    console.log(`✅ [INTERNAL/BIAS] ${direction} (${confidence}%) — disimpan & dibroadcast`);
    res.status(201).json({ success: true, data: biasRecord });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/internal/price ────────────────────────────
// Menerima update harga XAUUSD dari Python price feed.
// Backend meneruskan ke semua frontend yang terhubung via Socket.IO.
// Endpoint ini dipanggil setiap kali ada tick baru (throttle di sisi Python).

router.post('/price', (req: Request, res: Response, next: NextFunction) => {
  try {
    const priceData = req.body;
    const io = req.app.get('io') as SocketIOServer | undefined;
    if (io) broadcastPrice(io, priceData);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
