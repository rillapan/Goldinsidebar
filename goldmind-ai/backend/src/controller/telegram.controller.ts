import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TelegramService } from '../services/telegram.service';
import { v4 as uuidv4 } from 'uuid';

export const generateMagicLink = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Generate unique verify token
    const verifyToken = `TG-VERIFY-${uuidv4()}`;

    await prisma.user.update({
      where: { id: userId },
      data: { telegramVerifyToken: verifyToken }
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'SinyalCohibaBot';
    const magicLink = `https://t.me/${botUsername}?start=${verifyToken}`;

    res.json({ success: true, link: magicLink });
  } catch (error: any) {
    console.error('generateMagicLink Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

export const getTelegramStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        connected: user.telegramConnected,
        username: user.telegramUsername,
        id: user.telegramId,
        settings: user.telegramSettings || {
          receiveSignal: true,
          receiveDailyBias: true,
          receiveWeeklyReport: true
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { receiveSignal, receiveDailyBias, receiveWeeklyReport } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        telegramSettings: {
          receiveSignal,
          receiveDailyBias,
          receiveWeeklyReport
        }
      }
    });

    res.json({ success: true, settings: user.telegramSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const testNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.telegramConnected || !user.telegramId) {
      return res.status(400).json({ success: false, message: 'Akun Telegram belum terhubung.' });
    }

    const success = await TelegramService.sendDirectMessage(
      user.telegramId,
      '🔔 *Test Notifikasi*\n\nIni adalah pesan percobaan dari sistem Sinyal Cohiba. Koneksi Telegram Anda berjalan dengan baik! 🚀'
    );

    if (success) {
      res.json({ success: true, message: 'Notifikasi test berhasil dikirim ke Telegram Anda.' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim notifikasi test.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const disconnectTelegram = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramUsername: null,
        telegramConnected: false,
        telegramVerifyToken: null
      }
    });

    res.json({ success: true, message: 'Telegram berhasil diputuskan dari akun Anda.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateChannelInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Cek membership
    const membership = await prisma.membership.findFirst({
      where: { userId, isActive: true, endDate: { gt: new Date() } }
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Langganan Anda belum aktif atau sudah berakhir.' });
    }

    const inviteLink = await TelegramService.generateInviteLink();
    
    if (!inviteLink) {
      return res.status(500).json({ success: false, message: 'Gagal membuat link undangan channel. Pastikan bot adalah admin channel.' });
    }

    res.json({ success: true, link: inviteLink });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
