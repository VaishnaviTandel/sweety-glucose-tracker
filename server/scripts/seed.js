const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');
const { todayInTz } = require('../src/services/readingValidation');

const EMAIL = 'demo@sweety.com';
const PASSWORD = 'Demo@1234';
const SLOTS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];

// Simple deterministic pseudo-random so the demo data is the same every run
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

(async () => {
  // Re-running resets the demo user (readings are removed by ON DELETE CASCADE)
  await pool.query('DELETE FROM users WHERE email = $1', [EMAIL]);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    ['Demo Patient', EMAIL, hash]
  );
  const userId = rows[0].id;

  const today = todayInTz();
  let count = 0;
  for (let i = 0; i < 65; i++) {
    const date = addDays(today, -i);
    const howMany = 2 + Math.floor(rand() * 3); // 2 to 4 readings per day
    for (const slot of SLOTS.slice(0, howMany)) {
      const base = slot === 'morning' ? 95 : 140;
      const value = Math.round(base + rand() * 60 - 15);
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, date, slot, value]
      );
      count++;
    }
  }
  console.log(`Seeded ${EMAIL} / ${PASSWORD} with ${count} readings.`);
  await pool.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});