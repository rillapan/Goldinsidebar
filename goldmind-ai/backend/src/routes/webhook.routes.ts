// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Webhook Routes (Xendit Callback)
// POST /api/webhooks/xendit — Terima notifikasi pembayaran Xendit
//
// ALUR WEBHOOK:
// 1. User bayar di Xendit → Xendit POST ke endpoint ini
// 2. Verifikasi X-CALLBACK-TOKEN
// 3. Jika status PAID:
//    a. Update transaksi → PAID (prisma.$transaction)
//    b. Buat record Membership baru (30 hari)
//    c. Update User status → ACTIVE
//    d. Kirim notifikasi WA + Email
// 4. Zero manual admin confirmation
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../lib/prisma';
import { sendActivationNotification } from '../lib/notifications';

const router = Router();

const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN || '';

// ─── POST /api/webhooks/xendit ──────────────────────────

router.post('/xendit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ── 1. Verifikasi Callback Token ──────────────────
    const callbackToken = req.headers['x-callback-token'] as string | undefined;

    if (!callbackToken || callbackToken !== XENDIT_CALLBACK_TOKEN) {
      console.warn('⚠️ [WEBHOOK] Callback token tidak valid');
      res.status(403).json({ message: 'Invalid callback token' });
      return;
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const {
      id: xenditInvoiceId,
      status,
      payment_method: paymentMethod,
      paid_at: paidAt,
    } = payload;

    console.log(`📩 [WEBHOOK] Xendit callback: ${xenditInvoiceId} → ${status}`);

    // ── 2. Cari transaksi di database ─────────────────

    const transaction = await prisma.transaction.findUnique({
      where: { xenditInvoiceId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });

    if (!transaction) {
      console.warn(`⚠️ [WEBHOOK] Transaksi tidak ditemukan: ${xenditInvoiceId}`);
      // Tetap return 200 agar Xendit tidak retry terus-menerus
      res.status(200).json({ message: 'Transaction not found, skipped' });
      return;
    }

    // Cegah double-processing — PAID adalah final state, tidak bisa di-downgrade
    if (transaction.status === 'PAID') {
      console.log(`ℹ️ [WEBHOOK] Transaksi sudah PAID, abaikan: ${xenditInvoiceId}`);
      res.status(200).json({ message: 'Already processed' });
      return;
    }

    // ── 3. Handle berdasarkan status Xendit ──────────

    if (status === 'PAID') {
      const methodMap: Record<string, string> = {
        QR_CODE: 'QRIS',
        VIRTUAL_ACCOUNT: 'VIRTUAL_ACCOUNT',
        EWALLET: 'EWALLET',
        BANK_TRANSFER: 'BANK_TRANSFER',
      };

      const now = new Date();
      const thirtyDaysLater = new Date(now);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      // Atomik: semua berhasil atau semua rollback
      await prisma.$transaction(async (tx) => {
        // a. Update transaksi → PAID
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'PAID',
            paymentMethod: (methodMap[paymentMethod] || 'QRIS') as any,
            paidAt: paidAt ? new Date(paidAt) : now,
          },
        });

        // b. Buat record Membership baru 30 hari
        await tx.membership.create({
          data: {
            userId: transaction.userId,
            startDate: now,
            endDate: thirtyDaysLater,
            isActive: true,
            transactionId: transaction.id,
          },
        });

        // c. Aktifkan user
        await tx.user.update({
          where: { id: transaction.userId },
          data: { status: 'ACTIVE' },
        });
      });

      console.log(
        `✅ [WEBHOOK] ${transaction.user.name} diaktifkan! ` +
        `Membership berlaku hingga ${thirtyDaysLater.toLocaleDateString('id-ID')}`
      );

      // d. Notifikasi real-time ke browser user (tanpa perlu refresh/logout)
      const io = req.app.get('io') as SocketIOServer | undefined;
      if (io) {
        io.to(`user:${transaction.userId}`).emit('user_upgraded');
        console.log(`📡 [WEBHOOK] user_upgraded → user:${transaction.userId}`);
      }

      // e. Kirim notifikasi WA + Email (async — tidak block response Xendit)
      sendActivationNotification({
        name: transaction.user.name,
        email: transaction.user.email,
        phone: transaction.user.phone,
        endDate: thirtyDaysLater,
      }).catch((err) => console.error('❌ [WEBHOOK] Notifikasi gagal:', err.message));

    } else if (status === 'EXPIRED') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED' },
      });
      console.log(`⏰ [WEBHOOK] Invoice expired: ${xenditInvoiceId}`);
    }

    // Xendit mengharapkan status 200 sebagai konfirmasi penerimaan
    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('❌ [WEBHOOK] Error tidak tertangani:', error);
    next(error);
  }
});

export default router;
