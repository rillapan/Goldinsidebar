// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Auth Routes (Supabase Auth)
// POST /api/auth/profile      — Isi profil setelah register di Supabase
// POST /api/auth/sync-device  — Bind device ID ke Redis session
// POST /api/auth/logout       — Logout (hapus session Redis)
// GET  /api/auth/me           — Get current user data
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, verifySupabaseJwt } from '../middleware/auth.middleware';
import { createProfile, syncDevice, logout } from '../controller/auth.controller';

const router = Router();

// ─── POST /api/auth/profile ─────────────────────────────
// Dipanggil setelah user register di Supabase dan perlu isi data profil
router.post('/profile', verifySupabaseJwt, createProfile);

// ─── POST /api/auth/sync-device ─────────────────────────
// Bind device ID ke Redis untuk deteksi multi-login
router.post('/sync-device', verifyToken, syncDevice);

// ─── POST /api/auth/logout ──────────────────────────────
// Hapus session Redis agar device lock dilepas
router.post('/logout', verifyToken, logout);

// ─── GET /api/auth/me ───────────────────────────────────
// Ambil data user beserta status membership aktif

router.get('/me', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        memberships: {
          where: { isActive: true },
          orderBy: { endDate: 'desc' },
          take: 1,
          select: {
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
      return;
    }

    // ── Compute effective status ─────────────────────────
    // Sinkronkan status user berdasarkan membership record.
    // Ini memastikan frontend selalu mendapat status terkini.
    const activeMembership = user.memberships[0] || null;
    const now = new Date();
    let effectiveStatus = user.status;

    if (user.role !== 'ADMIN') {
      if (activeMembership && activeMembership.endDate > now) {
        // Membership masih valid → status harus ACTIVE
        if (user.status !== 'ACTIVE') {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: 'ACTIVE' },
          });
          console.log(`[auth/me] Auto-fix: user ${user.id} status → ACTIVE (membership valid)`);
          effectiveStatus = 'ACTIVE';
        }
      } else if (user.status === 'ACTIVE' && activeMembership && activeMembership.endDate <= now) {
        // Membership expired tapi status masih ACTIVE → expired
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'EXPIRED' },
        });
        // Juga deactivate membership record
        await prisma.membership.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        });
        console.log(`[auth/me] Auto-fix: user ${user.id} status → EXPIRED (membership ended)`);
        effectiveStatus = 'EXPIRED';
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        status: effectiveStatus,
        activeMembership,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
