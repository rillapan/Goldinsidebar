// ═══════════════════════════════════════════════════════════
// SINYAL COHIBA — Socket.IO Client
// Token diambil dari Supabase session (bukan cookie manual).
// PENDING users connect untuk menerima notifikasi user_upgraded.
// ═══════════════════════════════════════════════════════════

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

let socket: Socket | null = null;

// Ambil singleton socket (belum connect sampai connectSocket dipanggil).
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('📡 Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('📡 Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('📡 Socket connect error:', err.message);
    });
  }
  return socket;
}

// Dipanggil setelah user terautentikasi (di DashboardShell).
// Kirim Supabase access_token sebagai auth.token ke server.
export function connectSocket(accessToken: string): void {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: accessToken };
    s.connect();
  }
}

// Reconnect dengan token baru (dipanggil setelah upgrade membership).
export function reconnectSocket(accessToken: string): void {
  if (socket) {
    socket.disconnect();
    socket.auth = { token: accessToken };
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
