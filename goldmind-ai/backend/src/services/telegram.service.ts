import { Telegraf, Markup } from 'telegraf';
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
export const bot = token ? new Telegraf(token) : null;

if (bot) {
  // --- COMMAND: /start [TOKEN] ---
  bot.start(async (ctx) => {
    const args = ctx.payload; // the part after /start
    const telegramId = ctx.from.id.toString();
    const telegramUsername = ctx.from.username;

    if (!args) {
      return ctx.reply(
        'Selamat datang di Bot Sinyal Cohiba! 🚀\n\n' +
        'Silakan hubungkan akun Anda melalui dashboard website.'
      );
    }

    try {
      // Check token
      const user = await prisma.user.findUnique({
        where: { telegramVerifyToken: args }
      });

      if (!user) {
        return ctx.reply('Token verifikasi tidak valid atau sudah kedaluwarsa. Silakan generate ulang di dashboard web.');
      }

      // Check if user is active (has active membership)
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, isActive: true, endDate: { gt: new Date() } }
      });

      if (!membership) {
        return ctx.reply('Maaf, langganan Anda belum aktif. Silakan selesaikan pembayaran di dashboard untuk bisa menghubungkan Telegram.');
      }

      // Link account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramId,
          telegramUsername,
          telegramConnected: true,
          telegramVerifyToken: null // One-time use
        }
      });

      return ctx.reply(
        `✅ Berhasil! Akun web Anda telah terhubung ke bot ini.\n\n` +
        `Anda sekarang bisa menerima notifikasi sinyal langsung di sini.\n` +
        `Ketik /help untuk melihat daftar perintah yang tersedia.`
      );

    } catch (error) {
      console.error('Error in /start command:', error);
      ctx.reply('Terjadi kesalahan sistem saat memverifikasi token.');
    }
  });

  // --- COMMAND: /status ---
  bot.command('status', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { memberships: { where: { isActive: true } } }
    });

    if (!user || !user.telegramConnected) {
      return ctx.reply('Akun Anda belum terhubung. Silakan hubungkan dari dashboard web.');
    }

    const activeSub = user.memberships.find(m => m.endDate > new Date());
    const statusMsg = activeSub 
      ? `🟢 Status: AKTIF\n📅 Berakhir pada: ${activeSub.endDate.toLocaleDateString('id-ID')}`
      : `🔴 Status: TIDAK AKTIF (Silakan perpanjang langganan)`;

    ctx.reply(
      `📊 *Status Akun Anda*\n\n` +
      `👤 Nama: ${user.name}\n` +
      `📧 Email: ${user.email}\n` +
      `${statusMsg}\n\n` +
      `Ketik /signal untuk melihat sinyal terakhir.`,
      { parse_mode: 'Markdown' }
    );
  });

  // --- COMMAND: /signal ---
  bot.command('signal', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { memberships: { where: { isActive: true } } }
    });

    if (!user || !user.telegramConnected) {
      return ctx.reply('Akun Anda belum terhubung. Silakan hubungkan dari dashboard web.');
    }

    const activeSub = user.memberships.find(m => m.endDate > new Date());
    if (!activeSub) {
      return ctx.reply('Langganan Anda sudah habis. Silakan perpanjang untuk melihat sinyal.');
    }

    const latestSignal = await prisma.signal.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestSignal) {
      return ctx.reply('Tidak ada sinyal aktif saat ini.');
    }

    ctx.reply(
      `🔔 *SINYAL AKTIF TERBARU*\n\n` +
      `📊 Tipe: *${latestSignal.type}*\n` +
      `💰 Entry: ${latestSignal.entryPrice}\n` +
      `🛑 Stop Loss: ${latestSignal.stopLoss}\n` +
      `🎯 Take Profit: ${latestSignal.takeProfit}\n` +
      `⏳ Timeframe: ${latestSignal.timeframe}\n\n` +
      `📝 Analisa: ${latestSignal.reasoning}`,
      { parse_mode: 'Markdown' }
    );
  });

  // --- COMMAND: /help ---
  bot.command('help', (ctx) => {
    ctx.reply(
      `📚 *Panduan Bot Sinyal Cohiba*\n\n` +
      `/status - Cek status langganan & info akun Anda\n` +
      `/signal - Lihat sinyal aktif terbaru\n` +
      `/help - Tampilkan pesan ini\n\n` +
      `Semua notifikasi dari sistem akan dikirimkan ke chat ini secara otomatis sesuai dengan pengaturan preferensi Anda di dashboard web.`,
      { parse_mode: 'Markdown' }
    );
  });

  // Start bot safely
  bot.launch().then(() => {
    console.log('✅ Telegram Bot berhasil dijalankan');
  }).catch(err => {
    console.error('❌ Telegram Bot gagal dijalankan:', err);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export const TelegramService = {
  async sendDirectMessage(telegramId: string, message: string, options?: any) {
    if (!bot) return false;
    try {
      await bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown', ...options });
      return true;
    } catch (error) {
      console.error(`Gagal mengirim pesan Telegram ke ${telegramId}:`, error);
      return false;
    }
  },

  async generateInviteLink(): Promise<string | null> {
    if (!bot) return null;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!channelId) {
      console.warn('TELEGRAM_CHANNEL_ID belum diset di .env');
      return null;
    }
    
    try {
      // Create a one-time use invite link valid for 5 minutes
      const link = await bot.telegram.createChatInviteLink(channelId, {
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + (5 * 60)
      });
      return link.invite_link;
    } catch (error) {
      console.error('Gagal membuat invite link Telegram:', error);
      return null;
    }
  },
  
  async kickUserFromChannel(telegramId: number | string) {
    if (!bot) return false;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!channelId) return false;
    
    try {
      // Ban then unban to kick the user
      await bot.telegram.banChatMember(channelId, Number(telegramId));
      await bot.telegram.unbanChatMember(channelId, Number(telegramId));
      return true;
    } catch (error) {
      console.error(`Gagal kick user ${telegramId} dari channel:`, error);
      return false;
    }
  }
};
