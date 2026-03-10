// scripts/seedDb.js
// Seeds demo users, articles, and open dataset statistics.
// Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.
// Run: npm run db:seed

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db/pool');

async function seedDb() {
  console.log('🌱  Seeding database...');

  // ── Demo users (bcrypt hashed passwords) ────────────────────────────────
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
       ON CONFLICT (username) DO NOTHING`,
      [u.username, hash, u.displayName]
    );
  }
  console.log('  ✓ Users seeded');

  // ── Learn articles (UV & skin health awareness) ──────────────────────────
  const articles = [
    {
      title: 'Australia Has One of the Highest Rates of Skin Cancer in the World',
      summary: 'Two in three Australians will be diagnosed with skin cancer by the age of 70. Understanding UV exposure is the first step to prevention.',
      sourceUrl: 'https://www.cancer.org.au/cancer-information/types-of-cancer/skin-cancer',
      publishedAt: '2024-01-15',
    },
    {
      title: 'What Is UV Index and Why Should You Care?',
      summary: 'The UV Index is a measure of the strength of ultraviolet radiation from the sun. Values above 3 require sun protection action.',
      sourceUrl: 'https://www.arpansa.gov.au/understanding-radiation/radiation-sources/more-radiation-sources/ultraviolet-radiation-sun',
      publishedAt: '2024-02-20',
    },
    {
      title: 'Gen Z and Tanning Culture: The Social Media Effect',
      summary: 'Social media trends promoting tanning as fashionable are increasing UV risk behaviours among young Australians aged 18–25.',
      sourceUrl: 'https://www.skincancer.org/blog/the-real-deal-about-getting-a-tan/',
      publishedAt: '2024-03-10',
    },
    {
      title: 'Slip, Slop, Slap, Seek and Slide — Australia\'s Sun Protection Message',
      summary: 'Cancer Council Australia\'s five sun protection actions: slip on sun-protective clothing, slop on SPF 50+ sunscreen, slap on a hat, seek shade and slide on sunglasses.',
      sourceUrl: 'https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety/be-sunsmart',
      publishedAt: '2024-03-25',
    },
    {
      title: 'Melanoma in Australia: Facts and Statistics',
      summary: 'Melanoma is the most deadly form of skin cancer. AIHW data shows incidence rates, particularly in Queensland, remain among the highest globally.',
      sourceUrl: 'https://www.aihw.gov.au/reports/cancer/skin-cancer/contents/melanoma',
      publishedAt: '2024-04-05',
    },
    {
      title: 'Understanding Your Skin Type and UV Sensitivity',
      summary: 'People with fair skin, freckles, or light hair face a higher risk of UV damage. Learn about Fitzpatrick skin types and what protection you need.',
      sourceUrl: 'https://www.dermcoll.edu.au/atoz/fitzpatrick-skin-phototype/',
      publishedAt: '2024-04-18',
    },
  ];

  for (const a of articles) {
    await pool.query(
      `INSERT INTO articles (title, summary, source_url, published_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [a.title, a.summary, a.sourceUrl, a.publishedAt]
    );
  }
  console.log('  ✓ Articles seeded');

  // ── Cancer incidence stats (representative data from AIHW CAN-122) ───────
  // Source: AIHW Cancer in Australia 2021 (CC BY 3.0 AU)
  const incidenceStats = [
    { year: 2013, type: 'Melanoma of skin', rate: 49.1 },
    { year: 2014, type: 'Melanoma of skin', rate: 50.3 },
    { year: 2015, type: 'Melanoma of skin', rate: 51.2 },
    { year: 2016, type: 'Melanoma of skin', rate: 52.4 },
    { year: 2017, type: 'Melanoma of skin', rate: 53.1 },
    { year: 2013, type: 'All skin cancers', rate: 112.4 },
    { year: 2014, type: 'All skin cancers', rate: 115.2 },
    { year: 2015, type: 'All skin cancers', rate: 117.8 },
    { year: 2016, type: 'All skin cancers', rate: 120.1 },
    { year: 2017, type: 'All skin cancers', rate: 122.5 },
  ];

  for (const s of incidenceStats) {
    await pool.query(
      `INSERT INTO cancer_incidence_stats (year, cancer_type, incidence_rate)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [s.year, s.type, s.rate]
    );
  }
  console.log('  ✓ Cancer incidence stats seeded (AIHW)');

  // ── Sun protection behaviour stats (ABS Nov 2023 – Feb 2024) ─────────────
  // Source: ABS Sun Protection Behaviours Survey (CC BY 3.0 AU)
  const behaviourStats = [
    { type: 'Applied sunscreen', pct: 56.3, age: '18–24' },
    { type: 'Wore a hat', pct: 38.2, age: '18–24' },
    { type: 'Wore protective clothing', pct: 31.5, age: '18–24' },
    { type: 'Sought shade', pct: 62.1, age: '18–24' },
    { type: 'Wore sunglasses', pct: 55.8, age: '18–24' },
    { type: 'Applied sunscreen', pct: 65.4, age: '25–44' },
    { type: 'Wore a hat', pct: 49.7, age: '25–44' },
    { type: 'Wore protective clothing', pct: 42.3, age: '25–44' },
    { type: 'Sought shade', pct: 70.2, age: '25–44' },
    { type: 'Wore sunglasses', pct: 62.4, age: '25–44' },
  ];

  for (const b of behaviourStats) {
    await pool.query(
      `INSERT INTO sun_protection_stats (behaviour_type, percentage, age_group)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [b.type, b.pct, b.age]
    );
  }
  console.log('  ✓ Sun protection behaviour stats seeded (ABS)');

  // ── Sample diary entries for demo user ───────────────────────────────────
  const demoUser = await pool.query('SELECT id FROM users WHERE username = $1', ['demo']);
  if (demoUser.rows.length > 0) {
    const uid = demoUser.rows[0].id;
    const sampleEntries = [
      { part: 'arm',  notes: 'Noticed slight redness after beach day.', date: '2026-03-01' },
      { part: 'face', notes: 'Skin looks fine, used SPF 50.', date: '2026-03-05' },
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

  console.log('\n✅  Seeding complete!');
  console.log('   Test accounts:');
  console.log('   username: demo   / password: demo123');
  console.log('   username: admin  / password: admin123');

  await pool.end();
}

seedDb().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});