// src/routes/auth.js
// POST /api/auth/login   — verify credentials, set session
// POST /api/auth/logout  — destroy session
// GET  /api/auth/me      — return current user info (requires auth)

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { sanitizeText } = require('../utils/sanitize');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const username = sanitizeText(req.body.username || '');
    const password = req.body.password || ''; // raw password for bcrypt compare

    // Basic input validation
    if (!username || username.length < 1) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    if (!password || password.length < 1) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    if (username.length > 50 || password.length > 100) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Parameterised query — safe from SQL injection
    const result = await pool.query(
      'SELECT id, username, password_hash, display_name FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Uniform error message — do not reveal whether username exists
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      res.json({
        message: 'Login successful.',
        user: { id: user.id, username: user.username, displayName: user.display_name },
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const u = result.rows[0];
    res.json({ id: u.id, username: u.username, displayName: u.display_name, createdAt: u.created_at });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;