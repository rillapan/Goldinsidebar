import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { prisma } from '../lib/prisma';
import { getUserSession } from '../lib/redis';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        supabaseId?: string;
        role?: string;
        status?: string;
      };
      deviceId?: string;
    }
  }
}

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  aud: string;
  role: string;
  iss?: string;
}

// ── JWKS cache ─────────────────────────────────────────────
// Supabase project baru (2024+) pakai ES256 (asymmetric).
// Fetch public key SEKALI dari JWKS endpoint, cache seumur process.
// Tidak butuh package tambahan — pakai Node.js built-in crypto.

let _cachedJwksKey: string | null = null;

async function fetchJwksPublicKey(token: string): Promise<string | null> {
  if (_cachedJwksKey) return _cachedJwksKey;

  try {
    const decoded = jwt.decode(token, { complete: true });
    const iss = (decoded?.payload as any)?.iss as string | undefined;
    if (!iss) return null;

    // iss = "https://xxx.supabase.co/auth/v1" → JWKS ada di bawah iss langsung
    const jwksUrl = `${iss.replace(/\/$/, '')}/.well-known/jwks.json`;
    const res = await fetch(jwksUrl);
    if (!res.ok) return null;

    const jwks = await res.json() as { keys: object[] };
    const jwk = jwks.keys?.[0];
    if (!jwk) return null;

    const pubKey = createPublicKey({ key: jwk as any, format: 'jwk' });
    _cachedJwksKey = pubKey.export({ type: 'spki', format: 'pem' }) as string;
    console.log('[auth] JWKS public key fetched & cached (ES256 ready)');
    return _cachedJwksKey;
  } catch (err: any) {
    console.error('[auth] JWKS fetch gagal:', err.message);
    return null;
  }
}

// ── Pilih kunci & algoritma berdasarkan header token ───────
export async function resolveKey(token: string, symmetricSecret: string): Promise<{
  key: string | Buffer;
  algorithms: jwt.Algorithm[];
} | null> {
  const header = jwt.decode(token, { complete: true })?.header;
  const alg = header?.alg as string | undefined;

  if (alg === 'ES256') {
    const pubKey = await fetchJwksPublicKey(token);
    if (!pubKey) return null;
    return { key: pubKey, algorithms: ['ES256'] };
  }

  // Default HS256 — project lama / legacy JWT secret
  return { key: symmetricSecret, algorithms: ['HS256'] };
}

// ── verifySupabaseJwt ───────────────────────────────────────
// Verifikasi JWT Supabase TANPA lookup DB.
// Dipakai khusus POST /auth/profile (user belum ada di DB saat pertama register).
export const verifySupabaseJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'TOKEN_MISSING' });
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET!;
    const keyInfo = await resolveKey(token, jwtSecret);

    if (!keyInfo) {
      console.error('[auth] verifySupabaseJwt — gagal resolve JWKS key');
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }

    console.log(`[auth] verifySupabaseJwt — alg: ${keyInfo.algorithms[0]}, token: ${token.substring(0, 20)}...`);

    const payload = jwt.verify(token, keyInfo.key, {
      algorithms: keyInfo.algorithms,
    }) as SupabaseJwtPayload;

    req.user = {
      userId: '',
      supabaseId: payload.sub,
      email: payload.email,
    };

    next();
  } catch (error: any) {
    console.error(`[auth] verifySupabaseJwt gagal [${error.name}]: ${error.message}`);
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
};

// ── verifyToken ─────────────────────────────────────────────
// Verifikasi JWT + lookup user di DB + cek single-device (Redis).
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'TOKEN_MISSING' });
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET!;
    const keyInfo = await resolveKey(token, jwtSecret);

    if (!keyInfo) {
      console.error('[auth] verifyToken — gagal resolve JWKS key');
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }

    console.log(`[auth] verifyToken — alg: ${keyInfo.algorithms[0]}, token: ${token.substring(0, 20)}...`);

    const payload = jwt.verify(token, keyInfo.key, {
      algorithms: keyInfo.algorithms,
    }) as SupabaseJwtPayload;

    const user = await prisma.user.findUnique({
      where: { supabase_id: payload.sub },
    });

    if (!user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND' });
    }

    const deviceId = req.headers['x-device-id'] as string;
    const storedDeviceId = await getUserSession(payload.sub);

    if (storedDeviceId && deviceId && storedDeviceId !== deviceId) {
      return res.status(403).json({ error: 'MULTI_LOGIN_DETECTED' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      supabaseId: payload.sub,
    };
    req.deviceId = deviceId;

    next();
  } catch (error: any) {
    console.error(`[auth] verifyToken gagal [${error.name}]: ${error.message}`);
    return res.status(401).json({ error: 'INVALID_TOKEN' });
  }
};

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
          select: { endDate: true, isActive: true },
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

    // ── 1. ADMIN selalu lolos ────────────────────────────
    if (user.role === 'ADMIN') {
      req.user = { ...req.user, userId: user.id, role: 'ADMIN', status: 'ACTIVE' };
      next();
      return;
    }

    // ── 2. User status ACTIVE → bisa akses semua layanan ─
    //    Status ACTIVE di-set oleh webhook setelah pembayaran sukses.
    //    Ini adalah sumber kebenaran utama (primary gate).
    if (user.status === 'ACTIVE') {
      req.user = { ...req.user, userId: user.id, role: user.role, status: 'ACTIVE' };
      next();
      return;
    }

    // ── 3. Fallback: cek record membership (double-check) ─
    //    Jika status belum ter-update tapi ternyata ada membership valid,
    //    tetap loloskan dan otomatis perbaiki status user.
    const activeMembership = user.memberships[0];
    const now = new Date();

    if (activeMembership && activeMembership.endDate > now) {
      // Auto-fix: sinkronkan status user ke ACTIVE
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
      console.log(`[checkMembership] Auto-fix: user ${user.id} status → ACTIVE (membership valid)`);

      req.user = { ...req.user, userId: user.id, role: user.role, status: 'ACTIVE' };
      next();
      return;
    }

    // ── 4. Tidak ada akses → kirim 403 dengan detail ─────
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
