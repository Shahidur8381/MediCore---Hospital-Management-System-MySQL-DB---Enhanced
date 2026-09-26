import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Fallback to HTTP polling if WebSocket is blocked
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('Realtime socket connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Realtime socket connection error (reconnecting/polling):', err.message);
    });
  }

  return socket;
};

export const subscribeToQueue = (doctorId: number, callback: (data: any) => void) => {
  const s = getSocket();
  if (s) {
    s.emit('queue:subscribe', { doctorId });
    s.on('queue:updated', callback);
  }
};

export const unsubscribeFromQueue = (doctorId: number, callback?: (data: any) => void) => {
  const s = getSocket();
  if (s) {
    s.emit('queue:unsubscribe', { doctorId });
    if (callback) {
      s.off('queue:updated', callback);
    }
  }
};

export const subscribeToAppointmentUpdates = (callback: (data: any) => void) => {
  const s = getSocket();
  if (s) {
    s.on('appointment:status_updated', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
