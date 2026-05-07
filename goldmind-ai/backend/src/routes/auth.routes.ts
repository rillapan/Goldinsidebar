// ═══════════════════════════════════════════════════════════
// GoldMind AI — Auth Routes
// POST /api/auth/register — Registrasi user baru
// POST /api/auth/login    — Login user
// POST /api/auth/logout   — Logout (hapus session Redis)
// GET  /api/auth/me       — Get current user data
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { generateToken, verifyToken } from '../middleware/auth.middleware';
import { setUserSession, removeUserSession } from '../lib/redis';

const router = Router();

// ─── POST /api/auth/register ────────────────────────────

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validasi input dasar
    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'Semua field (name, email, phone, password) wajib diisi.',
      });
      return;
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Buat user baru dengan status PENDING (belum bayar)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        status: 'PENDING',
        role: 'MEMBER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Set session di Redis
    const deviceId = (req.headers['x-device-id'] as string) || uuidv4();
    await setUserSession(user.id, deviceId);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan lakukan pembayaran untuk mengaktifkan akun.',
      data: {
        user,
        token,
        deviceId,
        redirectTo: '/checkout', // Arahkan ke halaman pembayaran
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/login ───────────────────────────────

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
      return;
    }

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        passwordHash: true,
        status: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Cek apakah akun suspended
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi admin.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Generate token & set session
    const token = generateToken(user.id);
    const deviceId = (req.headers['x-device-id'] as string) || uuidv4();
    await setUserSession(user.id, deviceId);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        activeDeviceId: deviceId,
      },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        user: userData,
        token,
        deviceId,
        redirectTo: user.status === 'ACTIVE' ? '/dashboard' : '/checkout',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/logout ──────────────────────────────

router.post('/logout', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Hapus session dari Redis
    await removeUserSession(userId);

    // Clear active device di DB
    await prisma.user.update({
      where: { id: userId },
      data: { activeDeviceId: null },
    });

    res.json({
      success: true,
      message: 'Logout berhasil.',
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/auth/me ───────────────────────────────────

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

    res.json({
      success: true,
      data: {
        ...user,
        activeMembership: user.memberships[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
