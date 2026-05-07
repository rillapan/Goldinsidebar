// ═══════════════════════════════════════════════════════════
// GoldMind AI — JWT Authentication Middleware
// ═══════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { getUserSession } from '../lib/redis';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: string;
        status?: string;
      };
      deviceId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── 1. GENERATE TOKEN ─────────────────────────────────

export function generateToken(userId: string): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign({ userId }, JWT_SECRET, options);
}

// ─── 2. VERIFY TOKEN ────────────────────────────────────

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
        code: 'NO_TOKEN',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // ── Multi-login Detection ──
    const deviceId = req.headers['x-device-id'] as string | undefined;
    
    if (deviceId) {
      const activeDeviceId = await getUserSession(decoded.userId);
      
      if (activeDeviceId && activeDeviceId !== deviceId) {
        res.status(403).json({
          success: false,
          message: 'Akun sedang digunakan di perangkat lain.',
          code: 'MULTI_LOGIN_DETECTED',
        });
        return;
      }
    }

    req.user = { userId: decoded.userId };
    req.deviceId = deviceId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token telah kedaluwarsa. Silakan login ulang.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    next(error);
  }
}

// ─── 3. CHECK MEMBERSHIP ────────────────────────────────

export async function checkMembership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        role: true,
        memberships: {
          where: { isActive: true },
          orderBy: { endDate: 'desc' },
          take: 1,
          select: {
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
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Admin bypass
    if (user.role === 'ADMIN') {
      req.user = { userId: user.id, role: 'ADMIN', status: 'ACTIVE' };
      next();
      return;
    }

    const activeMembership = user.memberships[0];
    const now = new Date();

    if (activeMembership && activeMembership.endDate > now) {
      req.user = { userId: user.id, role: user.role, status: 'ACTIVE' };
      next();
      return;
    }

    const statusMessages: Record<string, { message: string; code: string }> = {
      PENDING: {
        message: 'Pembayaran belum selesai. Selesaikan pembayaran untuk mengakses fitur premium.',
        code: 'PAYMENT_PENDING',
      },
      EXPIRED: {
        message: 'Membership Anda telah berakhir. Perpanjang membership untuk melanjutkan akses.',
        code: 'MEMBERSHIP_EXPIRED',
      },
      SUSPENDED: {
        message: 'Akun Anda telah dinonaktifkan. Hubungi admin.',
        code: 'ACCOUNT_SUSPENDED',
      },
    };

    const statusInfo = statusMessages[user.status] || statusMessages.EXPIRED;

    res.status(403).json({
      success: false,
      message: statusInfo.message,
      code: statusInfo.code,
      redirectTo: user.status === 'PENDING' ? '/checkout' : '/renew',
    });
  } catch (error) {
    next(error);
  }
}

// ─── 4. REQUIRE ADMIN ───────────────────────────────────

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi.',
        code: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya admin yang bisa mengakses.',
        code: 'ADMIN_ONLY',
      });
      return;
    }

    if (req.user) {
      req.user.role = 'ADMIN';
    }
    next();
  } catch (error) {
    next(error);
  }
}
