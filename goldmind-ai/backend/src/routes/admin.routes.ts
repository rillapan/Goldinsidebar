// SINYAL COHIBA — Admin Routes
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';
import { sendTelegram, sendSignalNotification } from '../lib/notifications';

const router = Router();
router.use(verifyToken, requireAdmin);

// GET /api/admin/dashboard — Statistik utama
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalMembers, activeMembers, totalRevenue, signalStats] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { status: 'ACTIVE', role: 'MEMBER' } }),
      prisma.transaction.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.signal.groupBy({
        by: ['status'],
        where: { status: { in: ['TP_HIT', 'SL_HIT', 'PARTIAL_TP'] } },
        _count: { id: true },
      }),
    ]);

    type SignalStat = { status: string; _count: { id: number } };
    const totalClosed = (signalStats as SignalStat[]).reduce((a: number, s: SignalStat) => a + s._count.id, 0);
    const wins = (signalStats as SignalStat[]).filter((s: SignalStat) => s.status === 'TP_HIT' || s.status === 'PARTIAL_TP').reduce((a: number, s: SignalStat) => a + s._count.id, 0);

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        totalRevenue: totalRevenue._sum.amount || 0,
        winRate: totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0,
        totalSignals: totalClosed,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/admin/members — List semua member
router.get('/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, createdAt: true, lastLoginAt: true,
        memberships: { where: { isActive: true }, take: 1, select: { endDate: true } },
      },
    });
    const total = await prisma.user.count({ where: { role: 'MEMBER' } });
    res.json({ success: true, data: members, pagination: { page, limit, total } });
  } catch (error) { next(error); }
});

// POST /api/admin/bias/:id/publish — Publish Daily Bias
router.post('/bias/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bias = await prisma.dailyBias.update({
      where: { id: req.params.id },
      data: { isPublished: true, publishedAt: new Date() },
    });
    res.json({ success: true, data: bias });
  } catch (error) { next(error); }
});

// POST /api/admin/test-telegram — Kirim test message ke Telegram channel
router.post('/test-telegram', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await sendTelegram('🔔 <b>TEST</b> — Koneksi Telegram SINYAL COHIBA berhasil!');
    if (!ok) {
      res.status(500).json({ success: false, message: 'Telegram gagal — cek TELEGRAM_BOT_TOKEN dan TELEGRAM_CHANNEL_ID di .env' });
      return;
    }
    res.json({ success: true, message: 'Pesan test berhasil dikirim ke Telegram.' });
  } catch (error) { next(error); }
});

// POST /api/admin/test-signal-telegram — Kirim simulasi sinyal ke Telegram
router.post('/test-signal-telegram', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await sendSignalNotification({
      type: 'BUY',
      entryPrice: 3320.50,
      stopLoss: 3310.00,
      takeProfit: 3341.00,
      confidence: 78,
      timeframe: 'M15',
      reasoning: '[TEST] Harga rebound dari support 3318, RSI oversold, momentum bullish.',
    });
    res.json({ success: true, message: 'Simulasi sinyal BUY dikirim ke Telegram.' });
  } catch (error) { next(error); }
});

// GET /api/admin/transactions — List transaksi
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    });
    res.json({ success: true, data: transactions });
  } catch (error) { next(error); }
});

export default router;
