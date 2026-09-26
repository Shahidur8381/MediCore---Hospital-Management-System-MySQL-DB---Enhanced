const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { initialize, executeQuery } = require('./config/db');
const { initSocket } = require('./socket');
const { apiLimiter } = require('./middleware/rateLimiter');
require('./cron/databaseMaintenance');

// Verify mandatory JWT Secret in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing in production!');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Realtime Socket.IO
initSocket(server);

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Allows inline loading of PDF streams and preview
}));

// CORS configuration with whitelist support
const configuredOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3005', 'http://127.0.0.1:3005'];

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, curl, server-to-server)
  if (!origin) return true;
  if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) return true;
  // Permit any port on localhost or 127.0.0.1 (e.g., dev/testing ports 3000, 3005, etc.)
  const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (isLocalDev) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await executeQuery(`SELECT 'Database connected successfully' AS status`);
    res.json({
      status: 'API is running',
      db_status: result.rows[0]?.STATUS || 'Connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'API is running, but database connection failed',
      error: err.message
    });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/lab', require('./routes/lab'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/payment', require('./routes/payment'));

// Global error handler - Never leak stack traces in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack })
  });
});

// Initialize DB pool FIRST, then start listening
async function start() {
  const poolReady = await initialize();
  if (!poolReady) {
    console.error('Cannot start server without database. Exiting.');
    process.exit(1);
  }
  server.listen(PORT, () => {
    console.log(`MediCore API server with Socket.IO running on port ${PORT}`);
  });
}

// Export app and server for automated testing
module.exports = { app, server, start };

if (require.main === module) {
  start();
}
