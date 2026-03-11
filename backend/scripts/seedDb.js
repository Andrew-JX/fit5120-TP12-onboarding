// scripts/seedDb.js
// Seeds demo users and sample diary entries only.
// Articles and stats data are owned by Dashboard/Learn teammates — seed separately.
// Safe to re-run — uses ON CONFLICT DO UPDATE to keep passwords in sync.
// Run: npm run db:seed

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function seedDb() {
  console.log('Seeding database...');

  // ── Demo users ───────────────────────────────────────────────────────────────
  const users = [
    { username: 'demo',  password: 'demo123',  displayName: 'Demo User' },
    { username: 'admin', password: 'admin123', displayName: 'Admin User' },
    { username: 'chloe', password: 'chloe123', displayName: 'Chloe (Persona)' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             display_name  = EXCLUDED.display_name`,
      [u.username, hash, u.displayName]
    );
  }
  console.log('Users seeded (passwords refreshed)');

  // ── Sample diary entries for demo user ───────────────────────────────────────
  const demoUser = await pool.query('SELECT id FROM users WHERE username = $1', ['demo']);
  if (demoUser.rows.length > 0) {
    const uid = demoUser.rows[0].id;
    const sampleEntries = [
      { part: 'arm',  notes: 'Noticed slight redness after beach day.', date: '2026-03-01' },
      { part: 'face', notes: 'Skin looks fine, used SPF 50.',           date: '2026-03-05' },
      { part: 'back', notes: 'Small freckle appeared — monitoring it.', date: '2026-03-08' },
    ];
    for (const e of sampleEntries) {
      await pool.query(
        `INSERT INTO diary_entries (user_id, body_part, notes, entry_date)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [uid, e.part, e.notes, e.date]
      );
    }
    console.log('  ✓ Sample diary entries seeded for demo user');
  }

  console.log('\n Seeding complete!');
  console.log('   username: demo   / password: demo123');
  console.log('   username: admin  / password: admin123');
  console.log('   username: chloe  / password: chloe123');

  await pool.end();
}

seedDb().catch((err) => {
  console.error(' Seed failed:', err.message);
  process.exit(1);
});