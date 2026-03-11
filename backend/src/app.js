// src/app.js
require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const authRoutes  = require('./routes/auth');
const uvRoutes    = require('./routes/uv');
const diaryRoutes = require('./routes/diary');
const learnRoutes = require('./routes/learn');

const app  = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ── Trust proxy (required on Render / any reverse proxy) ──────────────────────
// Without this, req.secure is always false even on HTTPS, so secure cookies are dropped.
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure:   isProd,                      // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax',    // 'none' required for cross-site cookies
    maxAge:   24 * 60 * 60 * 1000,        // 24 hours
  },
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
}));

// ── Static uploads ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/uv',   uvRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/learn', learnRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  FIT5120 TP12 Backend running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;