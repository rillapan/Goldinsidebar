import { Router, Request, Response } from 'express';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

router.use(verifyToken, checkMembership);

// GET /api/journal — ambil semua entri jurnal milik user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const journals = await prisma.tradingJournal.findMany({
      where: { userId },
      orderBy: { tradeDate: 'desc' },
    });
    res.json({ success: true, data: journals });
  } catch (err) {
    console.error('[journal.get]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data jurnal.' });
  }
});

// POST /api/journal — catat trade baru
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { lotSize, entryPrice, takeProfit, stopLoss, result, notes, tradeDate } = req.body;

    if (!lotSize || !entryPrice || !result) {
      return res.status(400).json({ success: false, message: 'lotSize, entryPrice, dan result wajib diisi.' });
    }

    if (!['WIN', 'LOSS', 'BE'].includes(result)) {
      return res.status(400).json({ success: false, message: 'result harus WIN, LOSS, atau BE.' });
    }

    // Hitung P&L: 1 lot = 100 oz, distance * lot * 100
    let pnlUsd = 0;
    if (result === 'WIN' && takeProfit != null) {
      pnlUsd = Math.abs(takeProfit - entryPrice) * lotSize * 100;
    } else if (result === 'LOSS' && stopLoss != null) {
      pnlUsd = -Math.abs(entryPrice - stopLoss) * lotSize * 100;
    }

    const journal = await prisma.tradingJournal.create({
      data: {
        userId,
        lotSize: parseFloat(lotSize),
        entryPrice: parseFloat(entryPrice),
        takeProfit: takeProfit != null ? parseFloat(takeProfit) : null,
        stopLoss: stopLoss != null ? parseFloat(stopLoss) : null,
        result,
        pnlUsd,
        notes: notes || null,
        tradeDate: tradeDate ? new Date(tradeDate) : new Date(),
      },
    });

    res.status(201).json({ success: true, data: journal });
  } catch (err) {
    console.error('[journal.post]', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan jurnal.' });
  }
});

// DELETE /api/journal/:id — hapus entri
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const entry = await prisma.tradingJournal.findFirst({ where: { id, userId } });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entri tidak ditemukan.' });
    }

    await prisma.tradingJournal.delete({ where: { id } });
    res.json({ success: true, message: 'Entri berhasil dihapus.' });
  } catch (err) {
    console.error('[journal.delete]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus entri.' });
  }
});

export default router;
