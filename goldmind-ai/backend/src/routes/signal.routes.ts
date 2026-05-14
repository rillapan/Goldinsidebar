// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Signal Routes
// GET  /api/signals          — List sinyal (premium only)
// GET  /api/signals/active   — Sinyal yang masih aktif
// GET  /api/signals/history  — Riwayat sinyal + statistik
// GET  /api/signals/:id      — Detail sinyal
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';

const router = Router();

// Semua route di bawah ini butuh auth + membership aktif
router.use(verifyToken, checkMembership);

// ─── GET /api/signals ───────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.signal.count(),
    ]);

    res.json({
      success: true,
      data: signals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/signals/active ────────────────────────────

router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activeSignals = await prisma.signal.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: activeSignals,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/signals/history ───────────────────────────

router.get('/history', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [signals, stats] = await Promise.all([
      prisma.signal.findMany({
        where: {
          status: { in: ['TP_HIT', 'SL_HIT', 'PARTIAL_TP', 'MANUAL_CLOSE'] },
        },
        orderBy: { closedAt: 'desc' },
        take: 50,
      }),
      // Hitung statistik win rate
      prisma.signal.groupBy({
        by: ['status'],
        where: {
          status: { in: ['TP_HIT', 'SL_HIT', 'PARTIAL_TP'] },
        },
        _count: { id: true },
      }),
    ]);

    type SignalStat = { status: string; _count: { id: number } };
    // Kalkulasi win rate
    const totalClosed = (stats as SignalStat[]).reduce((acc: number, s: SignalStat) => acc + s._count.id, 0);
    const wins = (stats as SignalStat[])
      .filter((s: SignalStat) => s.status === 'TP_HIT' || s.status === 'PARTIAL_TP')
      .reduce((acc: number, s: SignalStat) => acc + s._count.id, 0);
    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

    res.json({
      success: true,
      data: {
        signals,
        statistics: {
          totalSignals: totalClosed,
          wins,
          losses: totalClosed - wins,
          winRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/signals/:id ───────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signal = await prisma.signal.findUnique({
      where: { id: req.params.id },
    });

    if (!signal) {
      res.status(404).json({
        success: false,
        message: 'Sinyal tidak ditemukan.',
      });
      return;
    }

    res.json({
      success: true,
      data: signal,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
