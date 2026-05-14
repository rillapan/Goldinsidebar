// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Daily Bias Routes
// GET /api/bias/today    — Bias hari ini (premium)
// GET /api/bias/history  — Riwayat bias 30 hari terakhir
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';

const router = Router();

router.get('/today', verifyToken, checkMembership, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bias = await prisma.dailyBias.findFirst({
      where: { date: today, isPublished: true },
    });
    res.json({ success: true, data: bias || null });
  } catch (error) { next(error); }
});

router.get('/history', verifyToken, checkMembership, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const biases = await prisma.dailyBias.findMany({
      where: { date: { gte: thirtyDaysAgo }, isPublished: true },
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, data: biases });
  } catch (error) { next(error); }
});

export default router;
