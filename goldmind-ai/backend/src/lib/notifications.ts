// ═══════════════════════════════════════════════════════════
// GoldMind AI — Notification Service
// WA via Fonnte, Email via Nodemailer, Telegram via Bot API
// ═══════════════════════════════════════════════════════════

import axios from 'axios';
import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// ─── KONFIGURASI ─────────────────────────────────────────

const FONNTE_API_KEY    = process.env.FONNTE_API_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const FRONTEND_URL     = process.env.FRONTEND_URL || 'http://localhost:3000';

// Transporter Nodemailer — dibuat sekali, dipakai ulang
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: (process.env.SMTP_PORT || '465') === '465',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// ═══════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Kirim pesan WhatsApp ke satu nomor via Fonnte API.
 * Nomor harus format lokal Indonesia (08xxx atau 628xxx).
 */
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!FONNTE_API_KEY) {
    console.warn('⚠️ [WA] FONNTE_API_KEY tidak dikonfigurasi');
    return false;
  }
  try {
    await axios.post(
      'https://api.fonnte.com/send',
      { target: phone, message, countryCode: '62' },
      { headers: { Authorization: FONNTE_API_KEY }, timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error(`❌ [WA] Gagal kirim ke ${phone}:`, err.response?.data?.message || err.message);
    return false;
  }
}

/**
 * Blast pesan WhatsApp ke seluruh member aktif sekaligus.
 * Fonnte mendukung multi-target dengan target berisi nomor yang dipisah koma.
 */
export async function blastWhatsAppToActiveMembers(message: string): Promise<void> {
  if (!FONNTE_API_KEY) return;
  try {
    const activeMembers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { phone: true },
    });

    if (activeMembers.length === 0) return;

    // Fonnte multi-target: semua nomor dalam satu request
    const targets = activeMembers.map((m) => m.phone).join(',');
    await axios.post(
      'https://api.fonnte.com/send',
      { target: targets, message, countryCode: '62' },
      { headers: { Authorization: FONNTE_API_KEY }, timeout: 15000 }
    );

    console.log(`📱 [WA BLAST] Terkirim ke ${activeMembers.length} member aktif`);
  } catch (err: any) {
    console.error('❌ [WA BLAST] Gagal:', err.response?.data?.message || err.message);
  }
}

/**
 * Kirim email HTML via Nodemailer SMTP.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SMTP_PASS) {
    console.warn('⚠️ [EMAIL] SMTP_PASS tidak dikonfigurasi');
    return false;
  }
  try {
    await emailTransporter.sendMail({
      from: `GoldMind AI <${process.env.EMAIL_FROM || 'noreply@goldmind.ai'}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err: any) {
    console.error(`❌ [EMAIL] Gagal kirim ke ${to}:`, err.message);
    return false;
  }
}

/**
 * Kirim pesan ke channel/grup Telegram via Bot API.
 * Gunakan parse_mode HTML untuk formatting (bold, italic, code).
 */
export async function sendTelegram(message: string, chatId?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ [TELEGRAM] TELEGRAM_BOT_TOKEN tidak dikonfigurasi');
    return false;
  }
  const target = chatId || TELEGRAM_CHANNEL_ID;
  if (!target) {
    console.warn('⚠️ [TELEGRAM] TELEGRAM_CHANNEL_ID tidak dikonfigurasi');
    return false;
  }
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: target, text: message, parse_mode: 'HTML' },
      { timeout: 10000 }
    );
    return true;
  } catch (err: any) {
    console.error('❌ [TELEGRAM] Gagal kirim:', err.response?.data?.description || err.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// USE-CASE FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Notifikasi aktivasi membership setelah pembayaran berhasil.
 * Kirim ke WA dan Email user yang baru bayar.
 */
export async function sendActivationNotification(user: {
  name: string;
  email: string;
  phone: string;
  endDate: Date;
}): Promise<void> {
  const endDateStr = user.endDate.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Pesan WhatsApp
  const waMessage =
    `✅ *Selamat, ${user.name}!*\n\n` +
    `Pembayaran berhasil dikonfirmasi. Membership GoldMind AI Anda kini *AKTIF*.\n\n` +
    `📅 Masa aktif hingga: *${endDateStr}*\n\n` +
    `🚀 Akses dashboard Anda di:\n${FRONTEND_URL}/dashboard\n\n` +
    `_Terima kasih telah bergabung! — GoldMind AI Team_`;

  // Email HTML
  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e17;color:#e5e7eb;padding:40px;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a0e17;font-size:18px;">G</div>
        <span style="font-size:20px;font-weight:700;color:#f59e0b;">GoldMind AI</span>
      </div>
      <h2 style="color:white;margin-bottom:8px;">🎉 Membership Aktif!</h2>
      <p>Halo <strong>${user.name}</strong>,</p>
      <p>Pembayaran Anda telah dikonfirmasi. Membership GoldMind AI Premium kini aktif.</p>
      <div style="background:#111827;border:1px solid #1f2937;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="margin:0;color:#9ca3af;font-size:14px;">Masa aktif hingga</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#f59e0b;">${endDateStr}</p>
      </div>
      <p style="color:#d1d5db;">Yang bisa Anda akses sekarang:</p>
      <ul style="color:#d1d5db;line-height:2;">
        <li>⚡ AI Signal Engine — sinyal BUY/SELL real-time 24/5</li>
        <li>📰 Daily Market Bias — analisa fundamental jam 07.00 WIB</li>
        <li>🤖 AI Chat Assistant — tanya AI kapan saja</li>
        <li>📱 Notifikasi WA + Telegram + Email otomatis</li>
      </ul>
      <a href="${FRONTEND_URL}/dashboard"
        style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e17;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:16px;font-size:15px;">
        Buka Dashboard →
      </a>
      <p style="color:#6b7280;font-size:12px;margin-top:32px;border-top:1px solid #1f2937;padding-top:16px;">
        ⚠️ Trading mengandung risiko tinggi. Past performance bukan jaminan profit di masa depan.
      </p>
    </div>
  `;

  // Kirim paralel, jangan block
  await Promise.allSettled([
    sendWhatsApp(user.phone, waMessage),
    sendEmail(user.email, '✅ Membership GoldMind AI Aktif!', emailHtml),
  ]);
}

/**
 * Notifikasi sinyal baru ke channel Telegram.
 * Dipanggil saat AI Signal Engine menghasilkan sinyal valid.
 */
export async function sendSignalNotification(signal: {
  type: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
}): Promise<void> {
  const dirEmoji = signal.type === 'BUY' ? '🟢' : '🔴';
  const rr = Math.abs(signal.takeProfit - signal.entryPrice) /
             Math.abs(signal.entryPrice - signal.stopLoss);

  const telegramMsg =
    `${dirEmoji} <b>SINYAL ${signal.type} — XAUUSD</b>\n\n` +
    `⏱ Timeframe: <b>${signal.timeframe}</b>\n` +
    `📍 Entry: <code>${signal.entryPrice.toFixed(2)}</code>\n` +
    `🛑 Stop Loss: <code>${signal.stopLoss.toFixed(2)}</code>\n` +
    `🎯 Take Profit: <code>${signal.takeProfit.toFixed(2)}</code>\n` +
    `📊 Confidence: <b>${signal.confidence}%</b>\n` +
    `⚖️ Risk/Reward: <b>1:${rr.toFixed(1)}</b>\n\n` +
    `💬 <i>${signal.reasoning}</i>\n\n` +
    `⚠️ <i>Bukan rekomendasi investasi. Gunakan risk management.</i>`;

  await sendTelegram(telegramMsg);
}

/**
 * Blast Daily Bias ke semua member aktif via WA dan Telegram.
 * Dipanggil saat bias harian berhasil di-generate.
 */
export async function sendDailyBiasNotification(bias: {
  direction: string;
  confidence: number;
  reasoning: string;
  date: string;
}): Promise<void> {
  const dirEmoji: Record<string, string> = { BUY: '🟢', SELL: '🔴', WAIT: '🟡' };
  const emoji = dirEmoji[bias.direction] || '📰';

  const telegramMsg =
    `📰 <b>Daily Market Bias XAUUSD</b>\n` +
    `📅 ${bias.date}\n\n` +
    `${emoji} Arah: <b>${bias.direction}</b> | Confidence: <b>${bias.confidence}%</b>\n\n` +
    `${bias.reasoning}\n\n` +
    `⚠️ <i>Analisa ini bukan rekomendasi investasi.</i>`;

  const waMsg =
    `📰 *Daily Market Bias XAUUSD*\n` +
    `📅 ${bias.date}\n\n` +
    `${emoji} Arah: *${bias.direction}* | Confidence: *${bias.confidence}%*\n\n` +
    `${bias.reasoning}\n\n` +
    `⚠️ _Analisa ini bukan rekomendasi investasi._`;

  await Promise.allSettled([
    sendTelegram(telegramMsg),
    blastWhatsAppToActiveMembers(waMsg),
  ]);
}

/**
 * Kirim reminder perpanjangan membership ke satu user.
 * daysLeft: sisa hari aktif (7 untuk H-7, 3 untuk H-3).
 */
export async function sendRenewalReminder(
  user: { name: string; phone: string; email: string; endDate: Date },
  daysLeft: number
): Promise<void> {
  const isUrgent = daysLeft <= 3;
  const endDateStr = user.endDate.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const urgentPrefix = isUrgent ? '🚨 URGENT: ' : '⏰ Reminder: ';
  const urgentColor  = isUrgent ? '#ef4444' : '#f59e0b';

  const waMsg =
    `${urgentPrefix}*Membership GoldMind AI berakhir dalam ${daysLeft} hari!*\n\n` +
    `📅 Tanggal berakhir: *${endDateStr}*\n\n` +
    `Perpanjang sekarang agar tidak ketinggalan sinyal trading & Daily Bias:\n` +
    `👉 ${FRONTEND_URL}/renew\n\n` +
    `_GoldMind AI Team_`;

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e17;color:#e5e7eb;padding:40px;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a0e17;font-size:18px;">G</div>
        <span style="font-size:20px;font-weight:700;color:#f59e0b;">GoldMind AI</span>
      </div>
      <h2 style="color:${urgentColor};">${isUrgent ? '⚠️ Membership Hampir Berakhir!' : '⏰ Reminder Perpanjangan'}</h2>
      <p>Halo <strong>${user.name}</strong>,</p>
      <p>Membership GoldMind AI Anda akan berakhir dalam <strong style="color:${urgentColor};">${daysLeft} hari</strong> pada ${endDateStr}.</p>
      <p style="color:#d1d5db;">Perpanjang sekarang untuk tetap mendapat sinyal AI, Daily Bias, dan AI Chat Assistant setiap hari.</p>
      <a href="${FRONTEND_URL}/renew"
        style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0e17;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:16px;font-size:15px;">
        Perpanjang Membership →
      </a>
      <p style="color:#6b7280;font-size:12px;margin-top:32px;">GoldMind AI — Platform Sinyal Trading XAUUSD berbasis AI</p>
    </div>
  `;

  await Promise.allSettled([
    sendWhatsApp(user.phone, waMsg),
    sendEmail(
      user.email,
      `${urgentPrefix}Membership GoldMind AI berakhir dalam ${daysLeft} hari`,
      emailHtml
    ),
  ]);
}
