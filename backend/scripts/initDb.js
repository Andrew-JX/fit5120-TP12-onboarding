// scripts/initDb.js
// Creates all tables. Safe to re-run (IF NOT EXISTS).
// Run: npm run db:init

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/db/pool');

async function initDb() {
  console.log('Initialising database...');

  const sql = `
    -- ── Users ─────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name  VARCHAR(100),
      created_at    TIMESTAMP DEFAULT NOW()
    );

    -- ── Diary entries ──────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS diary_entries (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      body_part   VARCHAR(50) NOT NULL
                    CHECK (body_part IN ('face','arm','back','leg','shoulder','neck','other')),
      photo_url   VARCHAR(500),
      notes       TEXT,
      entry_date  DATE DEFAULT CURRENT_DATE,
      created_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(entry_date);

    -- ── UV exposure logs ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS uv_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      uv_index   DECIMAL(4,2),
      location   VARCHAR(100),
      logged_at  TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_uv_logs_user ON uv_logs(user_id);

    -- ── Cached UV data (reduce API calls) ─────────────────────────────────
    CREATE TABLE IF NOT EXISTS cached_uv (
      id          SERIAL PRIMARY KEY,
      location    VARCHAR(100) NOT NULL,
      uv_index    DECIMAL(4,2) NOT NULL,
      fetched_at  TIMESTAMP DEFAULT NOW()
    );

    -- ── Learn articles ─────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS articles (
      id           SERIAL PRIMARY KEY,
      title        VARCHAR(300) NOT NULL,
      summary      TEXT,
      content      TEXT,
      source_url   VARCHAR(500),
      image_url    VARCHAR(500),
      published_at DATE,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    -- ── Cancer incidence stats (AIHW data — seeded from open dataset) ─────
    CREATE TABLE IF NOT EXISTS cancer_incidence_stats (
      id             SERIAL PRIMARY KEY,
      year           INTEGER NOT NULL,
      cancer_type    VARCHAR(100) NOT NULL,
      incidence_rate DECIMAL(8,2)
    );

    -- ── Sun protection behaviour stats (ABS data) ─────────────────────────
    CREATE TABLE IF NOT EXISTS sun_protection_stats (
      id              SERIAL PRIMARY KEY,
      behaviour_type  VARCHAR(200) NOT NULL,
      percentage      DECIMAL(5,2),
      age_group       VARCHAR(50)
    );
  `;

  try {
    await pool.query(sql);
    console.log('All tables created (or already exist).');
  } catch (err) {
    console.error('Database init failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();