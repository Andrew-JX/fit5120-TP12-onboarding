// src/routes/uv.js
// GET /api/uv/current?city=Melbourne  — fetch real-time UV from OpenWeatherMap, cache in DB
// GET /api/uv/advice?index=8          — return advice object for a UV level
// GET /api/uv/history                 — last 7 days of UV logs for current user (requires auth)
// POST /api/uv/log                    — log a UV exposure entry (requires auth)

const express = require('express');
const https = require('https');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Location lookup table (AU cities) ──────────────────────────────────────
// Drawn from the AU Location Dataset (GitHub gist / randomecho)
const AU_LOCATIONS = {
  melbourne:  { lat: -37.8136, lon: 144.9631, label: 'Melbourne, VIC' },
  sydney:     { lat: -33.8688, lon: 151.2093, label: 'Sydney, NSW' },
  brisbane:   { lat: -27.4698, lon: 153.0251, label: 'Brisbane, QLD' },
  perth:      { lat: -31.9505, lon: 115.8605, label: 'Perth, WA' },
  adelaide:   { lat: -34.9285, lon: 138.6007, label: 'Adelaide, SA' },
  hobart:     { lat: -42.8821, lon: 147.3272, label: 'Hobart, TAS' },
  darwin:     { lat: -12.4634, lon: 130.8456, label: 'Darwin, NT' },
  canberra:   { lat: -35.2809, lon: 149.1300, label: 'Canberra, ACT' },
};

// ── UV Translation Engine (Innovation Core) ────────────────────────────────
// Converts raw UV Index to actionable, human-readable advice
function getUvAdvice(uvIndex) {
  const uv = parseFloat(uvIndex) || 0;

  if (uv <= 2) {
    return {
      level: 'Low',
      color: '#4caf50',
      emoji: '😊',
      risk: 'Minimal risk for the average person.',
      clothing: 'T-shirt and shorts are fine.',
      spf: 'SPF 15+ recommended if outdoors >1 hr.',
      activity: 'Great day to be outdoors anytime.',
      timeWarning: null,
      alert: false,
    };
  } else if (uv <= 5) {
    return {
      level: 'Moderate',
      color: '#ffeb3b',
      emoji: '🌤️',
      risk: 'Moderate risk — UV can damage unprotected skin.',
      clothing: 'Wear a hat and light long sleeves if possible.',
      spf: 'Apply SPF 30+ before heading out.',
      activity: 'Seek shade during midday if outdoors for long periods.',
      timeWarning: 'Consider avoiding 11am–3pm for extended outdoor activity.',
      alert: false,
    };
  } else if (uv <= 7) {
    return {
      level: 'High',
      color: '#ff9800',
      emoji: '☀️',
      risk: 'High risk — unprotected skin burns within 30 minutes.',
      clothing: 'Long-sleeved shirt, hat, and UV-blocking sunglasses.',
      spf: 'SPF 50+ — apply 20 min before going out, reapply every 2 hrs.',
      activity: 'Avoid being outdoors between 11am and 3pm if possible.',
      timeWarning: 'Stay in shade between 11am–3pm.',
      alert: false,
    };
  } else if (uv <= 10) {
    return {
      level: 'Very High',
      color: '#f44336',
      emoji: '🔴',
      risk: 'Very high risk — skin can burn in less than 15 minutes.',
      clothing: 'Full-coverage clothing, wide-brim hat, UV sunglasses.',
      spf: 'SPF 50+ is essential — reapply every 2 hrs.',
      activity: 'Stay indoors or in deep shade. Limit time outside.',
      timeWarning: 'Avoid outdoors 10am–4pm.',
      alert: true,
    };
  } else {
    return {
      level: 'Extreme',
      color: '#9c27b0',
      emoji: '🚨',
      risk: 'Extreme risk — unprotected skin can burn in minutes.',
      clothing: 'Full body coverage required. No exposed skin.',
      spf: 'SPF 50+ — apply every 2 hrs no matter what.',
      activity: 'Stay indoors. Outdoor activities not recommended.',
      timeWarning: 'Avoid all unnecessary outdoor exposure.',
      alert: true,
    };
  }
}

// ── Helper: fetch UV from OpenWeatherMap ───────────────────────────────────
function fetchUvFromApi(lat, lon) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
      // Return mock data when no API key is configured (dev/demo mode)
      return resolve({ uv: 6.5, source: 'mock' });
    }
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ uv: json.current?.uvi ?? 0, source: 'api' });
        } catch {
          reject(new Error('Failed to parse UV API response'));
        }
      });
    }).on('error', reject);
  });
}

// ── GET /api/uv/current ────────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  const cityKey = (req.query.city || 'melbourne').toLowerCase().trim();
  const location = AU_LOCATIONS[cityKey] || AU_LOCATIONS.melbourne;

  try {
    // Check cache — if fetched within last 30 minutes, return cached value
    const cached = await pool.query(
      `SELECT uv_index, fetched_at FROM cached_uv
       WHERE location = $1 AND fetched_at > NOW() - INTERVAL '30 minutes'
       ORDER BY fetched_at DESC LIMIT 1`,
      [location.label]
    );

    if (cached.rows.length > 0) {
      const uvIndex = parseFloat(cached.rows[0].uv_index);
      return res.json({
        location: location.label,
        uvIndex,
        advice: getUvAdvice(uvIndex),
        source: 'cache',
        fetchedAt: cached.rows[0].fetched_at,
      });
    }

    // Fetch from API
    const { uv } = await fetchUvFromApi(location.lat, location.lon);

    // Store in cache (parameterised)
    await pool.query(
      'INSERT INTO cached_uv (location, uv_index) VALUES ($1, $2)',
      [location.label, uv]
    );

    res.json({
      location: location.label,
      uvIndex: uv,
      advice: getUvAdvice(uv),
      source: 'api',
      fetchedAt: new Date(),
    });
  } catch (err) {
    console.error('UV current error:', err);
    // Graceful degradation — return moderate UV with error flag
    res.status(500).json({ error: 'Unable to fetch UV data.', uvIndex: null });
  }
});

// ── GET /api/uv/advice ─────────────────────────────────────────────────────
router.get('/advice', (req, res) => {
  const uvIndex = parseFloat(req.query.index) || 0;
  res.json(getUvAdvice(uvIndex));
});

// ── GET /api/uv/locations ──────────────────────────────────────────────────
router.get('/locations', (req, res) => {
  const locations = Object.entries(AU_LOCATIONS).map(([key, val]) => ({
    key,
    label: val.label,
  }));
  res.json(locations);
});

// ── POST /api/uv/log (requires auth) ──────────────────────────────────────
router.post('/log', requireAuth, async (req, res) => {
  try {
    const uvIndex = parseFloat(req.body.uvIndex);
    const cityKey = (req.body.city || 'melbourne').toLowerCase().trim();
    const location = AU_LOCATIONS[cityKey] || AU_LOCATIONS.melbourne;

    if (isNaN(uvIndex) || uvIndex < 0 || uvIndex > 20) {
      return res.status(400).json({ error: 'Invalid UV index value.' });
    }

    await pool.query(
      'INSERT INTO uv_logs (user_id, uv_index, location) VALUES ($1, $2, $3)',
      [req.session.userId, uvIndex, location.label]
    );

    res.json({ message: 'UV log recorded.' });
  } catch (err) {
    console.error('UV log error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/uv/history (requires auth) ───────────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT uv_index, location, logged_at
       FROM uv_logs
       WHERE user_id = $1 AND logged_at > NOW() - INTERVAL '7 days'
       ORDER BY logged_at ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('UV history error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;