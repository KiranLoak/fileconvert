/**
 * FileConvert Server — Entry Point
 *
 * In production:  Express serves the pre-built React frontend + API.
 * In development: Vite runs on :5173 with a proxy to this server on :5000.
 */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const cron      = require('node-cron');

const convertRoutes               = require('./routes/convert');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { cleanupExpiredFiles }     = require('./utils/cleanup');
const logger                      = require('./utils/logger');

const app    = express();
const PORT   = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Required for correct IP detection behind Railway/Render/Fly.io reverse proxies
app.set('trust proxy', 1);

// ── Storage directories ───────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'outputs');
[uploadDir, outputDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created: ${dir}`);
  }
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /outputs downloads
  contentSecurityPolicy: isProd ? undefined : false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                  // curl / same-origin
    if (isProd && origin.startsWith('https://')) return cb(null, true); // any HTTPS in prod
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev', {
  stream: { write: (m) => logger.http(m.trim()) },
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Static: converted output files ───────────────────────────────────────────
app.use('/outputs', express.static(outputDir));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/convert', convertRoutes);

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  env: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
}));

// ── Serve React build in production (single-container deployment) ─────────────
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
    logger.info(`Serving React build from ${clientDist}`);
  } else {
    logger.warn('client/dist missing — frontend not served. Run: npm run build');
  }
}

// ── Error handlers (must be last) ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Scheduled file cleanup every 15 min ──────────────────────────────────────
cron.schedule('*/15 * * * *', () => cleanupExpiredFiles(uploadDir, outputDir));

// ── Start ─────────────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Docker exposes the port outside the container
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`FileConvert listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('SIGTERM', () => { logger.info('SIGTERM — shutting down'); process.exit(0); });
process.on('SIGINT',  () => { logger.info('SIGINT  — shutting down'); process.exit(0); });

module.exports = app;
