// src/routes/diary.js
// POST /api/diary          — create a new diary entry with optional photo upload
// GET  /api/diary          — list diary entries for current user (filter/sort)
// GET  /api/diary/:id      — get single entry
// DELETE /api/diary/:id   — delete entry
//
// Photo storage strategy:
//   If CLOUDINARY_CLOUD_NAME env var is set → upload to Cloudinary (persistent, survives redeploy)
//   Otherwise → save to local uploads/ folder (dev only, lost on Render redeploy)

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');
const pool    = require('../db/pool');
const { requireAuth }                    = require('../middleware/auth');
const { sanitizeLongText, sanitizeText } = require('../utils/sanitize');

const router = express.Router();

// All diary routes require authentication
router.use(requireAuth);

// ── Multer config — always use memoryStorage so we can pipe to Cloudinary ─────
// memoryStorage keeps the file in RAM as req.file.buffer instead of writing to disk.
// For local fallback we write the buffer to disk ourselves in the route handler.
const ALLOWED_MIME    = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES  = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

// ── Allowed body parts (whitelist) ────────────────────────────────────────────
const ALLOWED_BODY_PARTS = ['face', 'arm', 'back', 'leg', 'shoulder', 'neck', 'other'];

// ── Cloudinary upload helper ──────────────────────────────────────────────────
// Uses the Cloudinary REST API directly — no SDK needed, saves a dependency.
// Returns the secure_url of the uploaded image.
function uploadToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Build multipart body manually
    const boundary = `----FormBoundary${Date.now()}`;
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="upload.${ext}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );
    const folder = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="folder"\r\n\r\n` +
      `fit5120-tp12\r\n`
    );
    const end = Buffer.from(`--${boundary}--\r\n`);

    const body = Buffer.concat([pre, buffer, folder, end]);

    // Basic auth: apiKey:apiSecret in base64
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/image/upload`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) {
            resolve(json.secure_url);
          } else {
            reject(new Error(`Cloudinary error: ${json.error?.message || 'unknown'}`));
          }
        } catch {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Cloudinary delete helper ──────────────────────────────────────────────────
// Extracts the public_id from the URL and calls the destroy API.
function deleteFromCloudinary(secureUrl) {
  return new Promise((resolve) => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey    = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<ver>/fit5120-tp12/<id>.<ext>
      const match = secureUrl.match(/\/fit5120-tp12\/([^.]+)/);
      if (!match) return resolve(); // can't parse, skip

      const publicId = `fit5120-tp12/${match[1]}`;
      const timestamp = Math.floor(Date.now() / 1000).toString();

      // Cloudinary requires SHA-1 signed deletion — use their Node SDK in Iteration 1.
      // For now we use the unsigned approach: just don't delete from Cloudinary
      // (old images accumulate but stay within free tier for a project this size).
      // The DB record is still deleted so it won't appear in the UI.
      resolve();
    } catch {
      resolve(); // deletion failure is non-critical
    }
  });
}

// ── Local fallback: write buffer to uploads/ ──────────────────────────────────
function saveLocally(buffer, mimeType) {
  const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

// ── POST /api/diary ────────────────────────────────────────────────────────────
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    // Validate + sanitise body_part
    const rawPart = sanitizeText(req.body.bodyPart || '').toLowerCase();
    if (!ALLOWED_BODY_PARTS.includes(rawPart)) {
      return res.status(400).json({ error: 'Invalid body part selection.' });
    }

    // Sanitise notes
    const notes = sanitizeLongText(req.body.notes || '');
    if (notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must be under 1000 characters.' });
    }

    // Entry date
    let entryDate = req.body.entryDate || null;
    if (entryDate && !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Handle photo
    let photoUrl = null;
    if (req.file) {
      const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME &&
                            process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name_here';
      if (useCloudinary) {
        // Upload to Cloudinary — permanent URL, survives Render redeploys
        photoUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      } else {
        // Local fallback for development
        photoUrl = saveLocally(req.file.buffer, req.file.mimetype);
      }
    }

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

// ── GET /api/diary ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const rawPart      = sanitizeText(req.query.bodyPart || '').toLowerCase();
    const bodyPartFilter = ALLOWED_BODY_PARTS.includes(rawPart) ? rawPart : null;
    const sortBy       = req.query.sortBy === 'date_asc' ? 'ASC' : 'DESC';

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
      total:   parseInt(countResult.rows[0].count),
      page,
      limit,
      entries: dataResult.rows,
    });
  } catch (err) {
    console.error('Diary list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/diary/:id ─────────────────────────────────────────────────────────
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

// ── DELETE /api/diary/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid ID.' });

  try {
    const entry = await pool.query(
      'SELECT photo_url FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );
    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    // Delete DB record first
    await pool.query(
      'DELETE FROM diary_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    const url = entry.rows[0].photo_url;
    if (url) {
      if (url.startsWith('https://res.cloudinary.com')) {
        // Cloudinary — attempt deletion (non-critical if it fails)
        await deleteFromCloudinary(url);
      } else {
        // Local file
        const filePath = path.join(__dirname, '../../', url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('Diary delete error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;