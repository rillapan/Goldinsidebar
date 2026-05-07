// ═══════════════════════════════════════════════════════════
// GoldMind AI — Socket.IO Setup
// Real-time: sinyal trading + harga live XAUUSD
// ═══════════════════════════════════════════════════════════

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupSocketIO(io: SocketIOServer): void {

  // ── Auth Middleware Socket.IO ──────────────────────────
  // Verifikasi JWT saat client connect.
  // ADMIN bypass — tidak cek status membership.

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        (socket.handshake.headers.authorization as string | undefined)?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, status: true },
      });

      if (!user) {
        return next(new Error('User tidak ditemukan'));
      }

      // ADMIN selalu diizinkan masuk terlepas dari status membership
      if (user.role === 'ADMIN') {
        socket.userId   = user.id;
        socket.userRole = 'ADMIN';
        return next();
      }

      // Member biasa harus berstatus ACTIVE
      if (user.status !== 'ACTIVE') {
        return next(new Error('Membership tidak aktif'));
      }

      socket.userId   = user.id;
      socket.userRole = user.role;
      next();
    } catch {
      next(new Error('Token tidak valid'));
    }
  });

  // ── Connection Handler ─────────────────────────────────

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`📡 [SOCKET] Client terhubung: ${socket.userId}`);

    // Semua member aktif + admin masuk ke room sinyal
    socket.join('premium_users');

    if (socket.userRole === 'ADMIN') {
      socket.join('admin_room');
    }

    socket.on('disconnect', () => {
      console.log(`📡 [SOCKET] Client terputus: ${socket.userId}`);
    });
  });

  console.log('📡 Socket.IO configured');
}

/**
 * Broadcast sinyal baru ke semua member di room premium_users.
 * Dipanggil dari internal.routes.ts saat AI engine push sinyal baru.
 */
export function broadcastSignal(io: SocketIOServer, signalData: object): void {
  io.to('premium_users').emit('new_signal', signalData);
  console.log('📡 [SOCKET] Sinyal dibroadcast ke premium_users');
}

/**
 * Broadcast update harga XAUUSD ke semua client.
 * Dipanggil dari server.ts price broadcast interval (setiap 2 detik).
 */
export function broadcastPrice(io: SocketIOServer, priceData: object): void {
  io.to('premium_users').emit('price_update', priceData);
}

/**
 * Broadcast update sinyal (geser SL, partial TP, close).
 * Dipanggil ketika status sinyal berubah.
 */
export function broadcastSignalUpdate(io: SocketIOServer, updateData: object): void {
  io.to('premium_users').emit('signal_update', updateData);
}
