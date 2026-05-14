// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Main Server Entry Point
// Express.js + Socket.IO + Redis + Prisma
// ═══════════════════════════════════════════════════════════

import express, { Request, Response, ErrorRequestHandler } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import { prisma } from './lib/prisma';
import { redis, getLivePrice } from './lib/redis';
import { setupSocketIO, broadcastPrice } from './lib/socket';
import { setupCronJobs } from './lib/cron';

import authRoutes     from './routes/auth.routes';
import signalRoutes   from './routes/signal.routes';
import biasRoutes     from './routes/bias.routes';
import paymentRoutes  from './routes/payment.routes';
import chatRoutes     from './routes/chat.routes';
import adminRoutes    from './routes/admin.routes';
import webhookRoutes  from './routes/webhook.routes';
import internalRoutes from './routes/internal.routes';

import { errorHandler } from './middleware/error.middleware';

// ─── APP SETUP ───────────────────────────────────────────

const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001', // Next.js fallback port jika 3000 sudah dipakai
];

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// ─── MIDDLEWARE ──────────────────────────────────────────

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  credentials: true,
}));

// Rate limiting global — 100 request / 15 menit per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.' },
});

// Rate limiting ketat untuk chat — 10 pesan / menit
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak pertanyaan. Tunggu 1 menit.' },
});

// PENTING: Webhook Xendit harus didaftarkan SEBELUM express.json() global
// agar verifikasi X-CALLBACK-TOKEN bisa dilakukan pada raw body
app.use('/api/webhooks', express.json(), webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', globalLimiter);

// ─── ROUTES ─────────────────────────────────────────────

app.use('/api/auth',     authRoutes);
app.use('/api/signals',  signalRoutes);
app.use('/api/bias',     biasRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat',     chatLimiter, chatRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/internal', internalRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'goldmind-backend', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLER ──────────────────────────────────────

app.use(errorHandler as ErrorRequestHandler);

// ─── SOCKET.IO ──────────────────────────────────────────

setupSocketIO(io);

// ─── PRICE BROADCAST ────────────────────────────────────
// Polling Redis setiap 2 detik untuk mendapatkan harga terbaru
// dari Python price feed, lalu broadcast ke semua client yang terhubung.
// Ini menghindari kebutuhan Python memanggil backend untuk setiap tick.

function startPriceBroadcast(): void {
  setInterval(async () => {
    try {
      const price = await getLivePrice();
      if (price) broadcastPrice(io, price);
    } catch {
      // Silent fail — tidak perlu crash server jika Redis sesaat tidak respons
    }
  }, 2000);
  console.log('📡 Price broadcast interval started (setiap 2 detik)');
}

// ─── CRON JOBS ──────────────────────────────────────────

setupCronJobs();

// ─── START SERVER ───────────────────────────────────────

const PORT = process.env.PORT || 5000;

async function bootstrap(): Promise<void> {
  // PostgreSQL — wajib, server tidak bisa jalan tanpanya
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ PostgreSQL gagal connect:', error);
    process.exit(1);
  }

  // Redis — opsional, server tetap jalan jika tidak tersedia
  try {
    await redis.ping();
    console.log('✅ Redis connected');
  } catch (redisErr: any) {
    console.warn('⚠️  Redis tidak tersedia:', redisErr.message);
    console.warn('⚠️  Mode PostgreSQL-only aktif. Single-device enforcement dinonaktifkan sementara.');
  }

  server.listen(PORT, () => {
    console.log(`\n🚀 SINYAL COHIBA Backend berjalan di port ${PORT}`);
    console.log(`📡 Socket.IO siap`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });

  startPriceBroadcast();
}

bootstrap();

export { app, server, io };
