// src/db/pool.js
// PostgreSQL connection pool using pg
// All queries MUST use parameterised queries ($1, $2, ...) — never string concatenation

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Required for Render / Railway hosted Postgres (SSL)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = pool;