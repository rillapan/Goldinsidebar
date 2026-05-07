// GoldMind AI — Chat Routes (AI Chat Assistant)
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { getLivePrice } from '../lib/redis';
import { verifyToken, checkMembership } from '../middleware/auth.middleware';

const router = Router();
router.use(verifyToken, checkMembership);

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// POST /api/chat/sessions — Buat sesi chat baru
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.chatSession.create({
      data: { userId: req.user!.userId },
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) { next(error); }
});

// GET /api/chat/sessions — List sesi chat user
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
    res.json({ success: true, data: sessions });
  } catch (error) { next(error); }
});

// POST /api/chat/sessions/:sessionId/messages — Kirim pesan + dapat respons AI
router.post('/sessions/:sessionId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;

    // Verifikasi sesi milik user
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' });
      return;
    }

    // Ambil harga live XAUUSD dari Redis
    const livePrice = await getLivePrice();

    // Ambil history percakapan untuk konteks
    const history = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Batasi 20 pesan terakhir
    });

    // Simpan pesan user
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content,
        priceContext: livePrice as any,
      },
    });

    // Build prompt untuk Claude
    const systemPrompt = `Kamu adalah GoldMind AI Assistant, analis trading emas (XAUUSD) profesional.
Data harga XAUUSD terkini: ${JSON.stringify(livePrice || 'tidak tersedia')}

Aturan:
- Jawab dalam Bahasa Indonesia
- Berikan analisa teknikal yang relevan
- Sebutkan level support/resistance jika diminta
- SELALU akhiri dengan disclaimer: "⚠️ Disclaimer: Analisa ini bukan rekomendasi investasi. Trading mengandung risiko tinggi."
- max_tokens: 1000`;

    const messages = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content },
    ];

    // Kirim ke Claude API
    const claudeResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const aiContent = claudeResponse.data.content[0].text;

    // Simpan respons AI
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiContent,
      },
    });

    // Update title sesi jika ini pesan pertama
    if (history.length === 0) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: content.substring(0, 100) },
      });
    }

    res.json({
      success: true,
      data: { userMessage, aiMessage },
    });
  } catch (error) { next(error); }
});

export default router;
