const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema is ready.');
  await pool.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});