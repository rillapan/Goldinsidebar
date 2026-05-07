// ═══════════════════════════════════════════════════════════
// GoldMind AI — Payment Routes (Xendit Integration)
// POST /api/payments/create-invoice — Buat invoice Xendit
// GET  /api/payments/history        — Riwayat transaksi user
// ═══════════════════════════════════════════════════════════

import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const XENDIT_API_URL = 'https://api.xendit.co/v2/invoices';
const MEMBERSHIP_PRICE = 299000; // Rp 299.000 per 30 hari

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

    // Buat invoice via Xendit API
    const invoicePayload = {
      external_id: `goldmind_${userId}_${Date.now()}`,
      amount: MEMBERSHIP_PRICE,
      currency: 'IDR',
      payer_email: user.email,
      description: 'GoldMind AI Premium Membership - 30 Hari',
      invoice_duration: 86400, // 24 jam untuk bayar
      customer: {
        given_names: user.name,
        email: user.email,
        mobile_number: user.phone,
      },
      success_redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
      failure_redirect_url: `${process.env.FRONTEND_URL}/payment/failed`,
      payment_methods: ['QRIS', 'BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'SHOPEEPAY'],
      items: [
        {
          name: 'GoldMind AI Premium - 30 Hari',
          quantity: 1,
          price: MEMBERSHIP_PRICE,
        },
      ],
    };

    const xenditResponse = await axios.post(XENDIT_API_URL, invoicePayload, {
      auth: {
        username: XENDIT_SECRET_KEY,
        password: '',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const invoice = xenditResponse.data;

    // Simpan transaksi ke database
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        xenditInvoiceId: invoice.id,
        xenditInvoiceUrl: invoice.invoice_url,
        amount: MEMBERSHIP_PRICE,
        status: 'PENDING',
        description: 'GoldMind AI Premium Membership - 30 Hari',
        expiredAt: new Date(invoice.expiry_date),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        transactionId: transaction.id,
        invoiceUrl: invoice.invoice_url,
        amount: MEMBERSHIP_PRICE,
        expiresAt: invoice.expiry_date,
      },
    });
  } catch (error) {
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

export default router;
