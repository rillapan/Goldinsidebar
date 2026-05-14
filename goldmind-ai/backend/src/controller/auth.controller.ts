import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { setUserSession, removeUserSession } from '../lib/redis';

// ─── CREATE PROFILE ──────────────────────────────────────
// Dipanggil setelah register di Supabase. JWT sudah diverifikasi oleh verifyToken.
// Membuat row user di PostgreSQL dengan data profil yang diisi user.
export const createProfile = async (req: any, res: Response) => {
  try {
    const { full_name, phone_number, telegram_username } = req.body;
    const { supabaseId, email } = req.user;

    if (!full_name) {
      return res.status(400).json({ error: 'NAMA_WAJIB_DIISI' });
    }

    // Cek duplikat nomor WA hanya jika phone_number diisi
    if (phone_number) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: phone_number },
      });
      if (existingPhone) {
        return res.status(409).json({ error: 'PHONE_TAKEN' });
      }
    }

    const newUser = await prisma.user.create({
      data: {
        supabase_id: supabaseId,
        email: email,
        name: full_name,
        phone: phone_number || '',
        telegramId: telegram_username || null,
        status: 'PENDING',
        role: 'MEMBER',
      },
    });

    return res.status(201).json({
      message: 'PROFILE_CREATED',
      user_id: newUser.id,
      redirect: '/dashboard',
    });
  } catch (error: any) {
    console.error('Create Profile Error:', error.message);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'EMAIL_ATAU_WA_SUDAH_ADA' });
    }

    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
};

// ─── SYNC DEVICE ─────────────────────────────────────────
// Simpan deviceId ke Redis setelah login sukses.
// Key = supabaseId (payload.sub dari JWT Supabase).
export const syncDevice = async (req: any, res: Response) => {
  try {
    const { supabaseId } = req.user;
    const deviceId = req.headers['x-device-id'] as string;

    if (!deviceId) {
      return res.status(400).json({ error: 'DEVICE_ID_REQUIRED' });
    }

    const THIRTY_DAYS = 86400 * 30;
    await setUserSession(supabaseId, deviceId, THIRTY_DAYS);

    return res.status(200).json({
      message: 'DEVICE_SYNCED_SUCCESSFULLY',
      expiresIn: '30 days',
    });
  } catch (error: any) {
    console.error('Sync Device Error:', error.message);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────
// Hapus session Redis berdasarkan supabaseId agar device lock dilepas.
export const logout = async (req: any, res: Response) => {
  try {
    const { supabaseId } = req.user;

    if (!supabaseId) {
      return res.status(400).json({ error: 'SESSION_NOT_FOUND' });
    }

    await removeUserSession(supabaseId);

    return res.status(200).json({
      message: 'LOGOUT_SUCCESSFUL',
      info: 'Device lock has been released',
    });
  } catch (error: any) {
    console.error('Logout Error:', error.message);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
};
