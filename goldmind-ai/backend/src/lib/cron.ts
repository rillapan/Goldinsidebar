// ═══════════════════════════════════════════════════════════
// GoldMind AI — Cron Jobs Setup
// Dijalankan saat server start. Semua jadwal WIB (Asia/Jakarta).
//
// Job 1: Daily Bias — trigger AI engine setiap Senin-Jumat 07:00 WIB
// Job 2: Cek membership expired — setiap jam
// Job 3: Reminder H-7 — setiap hari 09:00 WIB (4–7 hari sebelum expired)
// Job 4: Reminder H-3 urgent — setiap hari 09:00 WIB (1–3 hari sebelum expired)
// ═══════════════════════════════════════════════════════════

import cron from 'node-cron';
import axios from 'axios';
import { prisma } from './prisma';
import { sendRenewalReminder } from './notifications';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export function setupCronJobs(): void {

  // ── 1. Daily Bias — Senin-Jumat pukul 07:00 WIB ─────
  // 07:00 WIB = 00:00 UTC (WIB = UTC+7)
  // Trigger Python AI engine untuk fetch berita → generate bias → kirim ke backend

  cron.schedule('0 0 * * 1-5', async () => {
    console.log('🕐 [CRON] Memulai generate Daily Bias...');
    try {
      const response = await axios.post(
        `${AI_ENGINE_URL}/api/generate-bias`,
        {},
        { timeout: 60000 } // 60 detik timeout untuk proses Claude API
      );
      if (response.status === 200) {
        console.log('✅ [CRON] Daily Bias berhasil di-generate');
      }
    } catch (error: any) {
      console.error('❌ [CRON] Daily Bias gagal:', error.message);
    }
  }, { timezone: 'Asia/Jakarta' });

  // ── 2. Cek Membership Expired — setiap jam ───────────
  // Update membership isActive=false dan user status=EXPIRED
  // jika endDate sudah lewat.

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      // Nonaktifkan membership yang sudah melewati endDate
      const expired = await prisma.membership.updateMany({
        where: { isActive: true, endDate: { lte: now } },
        data: { isActive: false },
      });

      if (expired.count > 0) {
        console.log(`⏰ [CRON] ${expired.count} membership kedaluwarsa dinonaktifkan`);

        // Update status user menjadi EXPIRED jika tidak punya membership aktif lain
        await prisma.$executeRaw`
          UPDATE users
          SET status = 'EXPIRED'
          WHERE status = 'ACTIVE'
            AND role = 'MEMBER'
            AND id NOT IN (
              SELECT DISTINCT user_id
              FROM memberships
              WHERE is_active = true AND end_date > NOW()
            )
        `;
      }
    } catch (error: any) {
      console.error('❌ [CRON] Cek membership expired error:', error.message);
    }
  });

  // ── 3. Reminder H-7 — setiap hari pukul 09:00 WIB ───
  // Kirim reminder ke user yang membership-nya berakhir dalam 4–7 hari.
  // Range 4–7 hari agar tidak overlap dengan reminder H-3.

  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 [CRON] Mengirim reminder H-7...');
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const fourDaysFromNow  = new Date(now);
      fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Ambil membership yang berakhir dalam 4–7 hari (range exclusive H-3)
      const expiringMemberships = await prisma.membership.findMany({
        where: {
          isActive: true,
          endDate: {
            gte: fourDaysFromNow,   // minimal 4 hari lagi
            lte: sevenDaysFromNow,  // maksimal 7 hari lagi
          },
        },
        include: {
          user: { select: { name: true, phone: true, email: true } },
        },
      });

      if (expiringMemberships.length === 0) return;

      console.log(`📩 [CRON H-7] Mengirim reminder ke ${expiringMemberships.length} user`);

      for (const m of expiringMemberships) {
        const daysLeft = Math.ceil(
          (m.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        await sendRenewalReminder(
          { name: m.user.name, phone: m.user.phone, email: m.user.email, endDate: m.endDate },
          daysLeft
        );
      }
    } catch (error: any) {
      console.error('❌ [CRON] H-7 reminder error:', error.message);
    }
  }, { timezone: 'Asia/Jakarta' });

  // ── 4. Reminder H-3 (Urgent) — setiap hari pukul 09:00 WIB ──
  // Kirim reminder mendesak ke user yang membership-nya berakhir dalam 1–3 hari.
  // Pesan lebih mendesak dibanding H-7.

  cron.schedule('30 2 * * *', async () => {
    console.log('🕐 [CRON] Mengirim reminder H-3 urgent...');
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Ambil membership yang berakhir dalam 0–3 hari
      const urgentMemberships = await prisma.membership.findMany({
        where: {
          isActive: true,
          endDate: {
            gte: now,              // belum expired
            lte: threeDaysFromNow, // berakhir maksimal 3 hari lagi
          },
        },
        include: {
          user: { select: { name: true, phone: true, email: true } },
        },
      });

      if (urgentMemberships.length === 0) return;

      console.log(`🚨 [CRON H-3] Mengirim urgent reminder ke ${urgentMemberships.length} user`);

      for (const m of urgentMemberships) {
        const daysLeft = Math.ceil(
          (m.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        await sendRenewalReminder(
          { name: m.user.name, phone: m.user.phone, email: m.user.email, endDate: m.endDate },
          Math.max(daysLeft, 1) // minimal 1 hari untuk menghindari "0 hari"
        );
      }
    } catch (error: any) {
      console.error('❌ [CRON] H-3 reminder error:', error.message);
    }
  }, { timezone: 'Asia/Jakarta' });

  console.log('⏰ Cron jobs dikonfigurasi: DailyBias (07:00), ExpiryCheck (tiap jam), H-7 (09:00), H-3 (09:30)');
}
