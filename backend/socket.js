const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'medicore_development_jwt_secret_key_2026';
};

/**
 * Initialize Socket.IO with HTTP Server
 */
function initSocket(server) {
  const configuredOrigins = process.env.CLIENT_URL 
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3005', 'http://127.0.0.1:3005'];

  const isOriginAllowed = (origin) => {
    if (!origin) return true;
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) return true;
    const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocalDev) return true;
    return false;
  };

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        console.warn(`[Socket CORS] Blocked socket from origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true
    },
    transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // JWT Authentication Middleware for Socket Connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error('Authentication error: Token required for socket connection'));
    }

    try {
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      const decoded = jwt.verify(cleanToken, getJwtSecret());
      socket.user = decoded.user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket connected: ${socket.id} (User: ${user.username}, Role: ${user.role})`);

    // Auto-join personal rooms based on verified identity
    if (user.role === 'Patient' && user.patientId) {
      socket.join(`patient:${user.patientId}`);
    } else if (user.role === 'Doctor' && user.doctorId) {
      socket.join(`doctor:${user.doctorId}`);
    } else if (user.role === 'Admin') {
      socket.join('admin');
    }

    // Subscribe to a doctor's live queue room
    socket.on('queue:subscribe', ({ doctorId }) => {
      if (doctorId) {
        const room = `queue:doctor:${doctorId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} subscribed to ${room}`);
      }
    });

    // Unsubscribe from queue room
    socket.on('queue:unsubscribe', ({ doctorId }) => {
      if (doctorId) {
        socket.leave(`queue:doctor:${doctorId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return io;
}

/**
 * Broadcast queue update to all clients listening to a doctor's queue
 */
function emitQueueUpdate(doctorId, queueData) {
  if (io) {
    io.to(`queue:doctor:${doctorId}`).emit('queue:updated', {
      doctorId,
      ...queueData,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Notify doctor and patient about appointment status change
 */
function emitAppointmentStatusChange(patientId, doctorId, appointmentData) {
  if (io) {
    if (patientId) {
      io.to(`patient:${patientId}`).emit('appointment:status_updated', appointmentData);
    }
    if (doctorId) {
      io.to(`doctor:${doctorId}`).emit('appointment:status_updated', appointmentData);
    }
    // Also notify the live queue
    if (doctorId) {
      emitQueueUpdate(doctorId, {
        currentAppointmentId: appointmentData.appointmentId,
        status: appointmentData.status
      });
    }
  }
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitAppointmentStatusChange
};
