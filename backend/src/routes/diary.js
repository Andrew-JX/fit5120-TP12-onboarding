// src/routes/diary.js
// POST /api/diary          — create a new diary entry with optional photo upload
// GET  /api/diary          — list diary entries for current user (filter/sort)
// GET  /api/diary/:id      — get single entry
// DELETE /api/diary/:id   — delete entry

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { sanitizeLongText, sanitizeText } = require('../utils/sanitize');

const router = express.Router();

// All diary routes require authentication
router.use(requireAuth);

// ── Multer config — file type & size enforcement ───────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

// ── Allowed body parts (whitelist) ────────────────────────────────────────
const ALLOWED_BODY_PARTS = ['face', 'arm', 'back', 'leg', 'shoulder', 'neck', 'other'];

// ── POST /api/diary ────────────────────────────────────────────────────────
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    // Validate + sanitise body_part
    const rawPart = sanitizeText(req.body.bodyPart || '').toLowerCase();
    if (!ALLOWED_BODY_PARTS.includes(rawPart)) {
      return res.status(400).json({ error: 'Invalid body part selection.' });
    }

    // Sanitise notes (long text — primary XSS risk)
    const notes = sanitizeLongText(req.body.notes || '');
    if (notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must be under 1000 characters.' });
    }

    // Entry date — validate format
    let entryDate = req.body.entryDate || null;
    if (entryDate && !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO diary_entries (user_id, body_part, photo_url, notes, entry_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, body_part, photo_url, notes, entry_date, created_at`,
      [req.session.userId, rawPart, photoUrl, notes, entryDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message && err.message.includes('Only JPG')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Diary create error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/diary ─────────────────────────────────────────────────────────
// Query params: bodyPart, sortBy (date_asc | date_desc), page, limit
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // Whitelist body part filter
    const rawPart = sanitizeText(req.query.bodyPart || '').toLowerCase();
    const bodyPartFilter = ALLOWED_BODY_PARTS.includes(rawPart) ? rawPart : null;

    // Whitelist sort direction
    const sortBy = req.query.sortBy === 'date_asc' ? 'ASC' : 'DESC';

    // Build parameterised query dynamically
    const params = [req.session.userId];
    let where = 'WHERE user_id = $1';

    if (bodyPartFilter) {
      params.push(bodyPartFilter);
      where += ` AND body_part = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM diary_entries ${where}`,
      params
    );

    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT id, body_part, photo_url, notes, entry_date, created_at
       FROM diary_entries ${where}
       ORDER BY entry_date ${sortBy}, created_at ${sortBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      entries: dataResult.rows,
    });
  } catch (err) {
    console.error('Diary list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/diary/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid ID.' });

  try {
    const result = await pool.query(
      `SELECT id, body_part, photo_url, notes, entry_date, created_at
       FROM diary_entries WHERE id = $1 AND user_id = $2`,
      [id, req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Diary get error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/diary/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid ID.' });

  try {
    // Fetch entry first to delete associated file
    const entry = await pool.query(
      'SELECT photo_url FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );
    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    // Delete DB record
    await pool.query(
      'DELETE FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    // Delete uploaded file if exists
    if (entry.rows[0].photo_url) {
      const filePath = path.join(__dirname, '../../', entry.rows[0].photo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('Diary delete error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;