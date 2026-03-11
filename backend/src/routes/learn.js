// src/routes/learn.js

// GET /api/learn/articles  — list articles (paginated)
// GET /api/learn/stats     — cancer incidence (AIHW) + sun protection behaviour (ABS)


const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET /api/learn/articles?page=1&limit=6
router.get('/articles', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(20, Math.max(1, parseInt(req.query.limit) || 6));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM articles');
    const dataResult  = await pool.query(
      `SELECT id, title, summary, source_url, image_url, published_at
       FROM articles ORDER BY published_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      total:    parseInt(countResult.rows[0].count),
      page,
      limit,
      articles: dataResult.rows,
    });
  } catch (err) {
    console.error('Articles error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/learn/stats
router.get('/stats', async (req, res) => {
  try {
    const incidence = await pool.query(
      `SELECT year, cancer_type, incidence_rate
       FROM cancer_incidence_stats ORDER BY year ASC`
    );
    const behaviour = await pool.query(
      `SELECT behaviour_type, percentage, age_group
       FROM sun_protection_stats ORDER BY behaviour_type ASC`
    );
    res.json({
      incidenceTrend:        incidence.rows,
      sunProtectionBehaviour: behaviour.rows,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;