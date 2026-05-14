// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Socket.IO Setup
// Real-time: sinyal trading + harga live XAUUSD + upgrade notif
// ═══════════════════════════════════════════════════════════

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { resolveKey } from '../middleware/auth.middleware';

interface SupabaseJwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userStatus?: string;
}

export function setupSocketIO(io: SocketIOServer): void {

  // ── Auth Middleware Socket.IO ──────────────────────────
  // Verifikasi Supabase JWT (bukan custom JWT).
  // PENDING users diizinkan connect — mereka join room personal
  // untuk menerima notifikasi user_upgraded setelah bayar.

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        (socket.handshake.headers.authorization as string | undefined)?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET!;
      const keyInfo = await resolveKey(token, jwtSecret);
      if (!keyInfo) return next(new Error('Tidak bisa resolve JWT key'));
      const decoded = jwt.verify(token, keyInfo.key, {
        algorithms: keyInfo.algorithms,
      }) as SupabaseJwtPayload;

      const user = await prisma.user.findUnique({
        where: { supabase_id: decoded.sub },
        select: { id: true, role: true, status: true },
      });

      if (!user) {
        return next(new Error('User tidak ditemukan'));
      }

      socket.userId   = user.id;
      socket.userRole = user.role;
      socket.userStatus = user.status;
      next();
    } catch {
      next(new Error('Token tidak valid'));
    }
  });

  // ── Connection Handler ─────────────────────────────────

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`📡 [SOCKET] Client terhubung: ${socket.userId} (${socket.userStatus})`);

    // Semua user (PENDING maupun ACTIVE) join room personal
    // untuk menerima notifikasi upgrade real-time.
    socket.join(`user:${socket.userId}`);

    // Hanya ACTIVE + ADMIN yang bisa terima sinyal & harga.
    if (socket.userStatus === 'ACTIVE' || socket.userRole === 'ADMIN') {
      socket.join('premium_users');
    }

    if (socket.userRole === 'ADMIN') {
      socket.join('admin_room');
    }

    socket.on('disconnect', () => {
      console.log(`📡 [SOCKET] Client terputus: ${socket.userId}`);
    });
  });

  console.log('📡 Socket.IO configured');
}

export function broadcastSignal(io: SocketIOServer, signalData: object): void {
  io.to('premium_users').emit('new_signal', signalData);
  console.log('📡 [SOCKET] Sinyal dibroadcast ke premium_users');
}

export function broadcastPrice(io: SocketIOServer, priceData: object): void {
  io.to('premium_users').emit('price_update', priceData);
}

export function broadcastSignalUpdate(io: SocketIOServer, updateData: object): void {
  io.to('premium_users').emit('signal_update', updateData);
}

// Dipanggil dari webhook setelah payment PAID — notifikasi upgrade real-time.
export function notifyUserUpgraded(io: SocketIOServer, userId: string): void {
  io.to(`user:${userId}`).emit('user_upgraded');
  console.log(`📡 [SOCKET] user_upgraded → user:${userId}`);
}
