// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Payment Routes (Xendit Integration)
// POST /api/payments/create-invoice — Buat invoice Xendit
// GET  /api/payments/history        — Riwayat transaksi user
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const MEMBERSHIP_PRICE  = 299000; // Rp 299.000 per 30 hari

// ─── POST /api/payments/create-invoice ──────────────────

router.post('/create-invoice', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Ambil data user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    const externalId = `goldmind_${userId}_${Date.now()}`;

    // Payload Xendit Invoice API v2
    // Referensi: https://developers.xendit.co/api-reference/#create-invoice
    const invoicePayload: Record<string, any> = {
      external_id:      externalId,
      amount:           MEMBERSHIP_PRICE,
      currency:         'IDR',
      payer_email:      user.email,
      description:      'SINYAL COHIBA Premium Membership - 30 Hari',
      invoice_duration: 86400, // 24 jam
      success_redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
      failure_redirect_url: `${process.env.FRONTEND_URL}/payment/failed`,
      payment_methods:  ['QRIS', 'BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'SHOPEEPAY'],
      items: [
        {
          name:     'SINYAL COHIBA Premium - 30 Hari',
          quantity: 1,
          price:    MEMBERSHIP_PRICE,
          category: 'Software Subscription',
        },
      ],
      customer: {
        given_names: user.name || 'GoldMind User',
        email:       user.email,
        // phone bersifat opsional — hanya kirim jika ada datanya
        ...(user.phone ? { mobile_number: user.phone } : {}),
      },
      customer_notification_preference: {
        invoice_created:    ['email'],
        invoice_reminder:   ['email'],
        invoice_paid:       ['email'],
        invoice_expired:    ['email'],
      },
    };

    console.log('📤 Xendit invoice payload:', JSON.stringify(invoicePayload, null, 2));

    let xenditResponse: any;
    try {
      xenditResponse = await axios.post(
        'https://api.xendit.co/v2/invoices',
        invoicePayload,
        {
          auth: {
            username: XENDIT_SECRET_KEY,
            password: '',
          },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
    } catch (xenditErr: any) {
      // Log Xendit error response detail untuk debug
      const xenditErrData = xenditErr.response?.data;
      console.error('❌ Xendit API Error:', {
        status:  xenditErr.response?.status,
        message: xenditErrData?.message || xenditErr.message,
        code:    xenditErrData?.error_code,
        data:    xenditErrData,
      });

      res.status(502).json({
        success: false,
        message: xenditErrData?.message || 'Gagal menghubungi payment gateway.',
        error:   xenditErrData?.error_code || 'XENDIT_ERROR',
      });
      return;
    }

    const invoice = xenditResponse.data;
    console.log('✅ Xendit invoice created:', invoice.id, '→', invoice.invoice_url);

    // Simpan transaksi ke database
    const transaction = await prisma.transaction.create({
      data: {
        userId:           user.id,
        xenditInvoiceId:  invoice.id,
        xenditInvoiceUrl: invoice.invoice_url,
        amount:           MEMBERSHIP_PRICE,
        status:           'PENDING',
        description:      'SINYAL COHIBA Premium Membership - 30 Hari',
        expiredAt:        new Date(invoice.expiry_date),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        transactionId: transaction.id,
        invoiceUrl:    invoice.invoice_url,
        amount:        MEMBERSHIP_PRICE,
        expiresAt:     invoice.expiry_date,
      },
    });
  } catch (error) {
    console.error('❌ create-invoice internal error:', error);
    next(error);
  }
});


// ─── GET /api/payments/history ──────────────────────────

router.get('/history', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        description: true,
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/payments/status ────────────────────────────
// Dipakai oleh frontend popup untuk polling status pembayaran terbaru

router.get('/status', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Ambil transaksi terbaru user
    const latest = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        amount: true,
        paidAt: true,
        xenditInvoiceId: true,
      },
    });

    if (!latest) {
      res.status(404).json({ success: false, message: 'Tidak ada transaksi.' });
      return;
    }

    res.json({ success: true, data: latest });
  } catch (error) {
    next(error);
  }
});

export default router;

