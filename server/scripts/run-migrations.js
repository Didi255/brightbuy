/**
 * Minimal migration runner. Applies database/migrations/*.sql in filename order,
 * tracking what has run in the `schema_migrations` table.
 *
 * Usage: npm run migrate      (from server/)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DIR = path.join(__dirname, '..', '..', 'database', 'migrations');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  const [rows] = await conn.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map(r => r.filename));

  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();
  let count = 0;

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
    const stripped = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*--.*$/gm, '')
      .trim();
    if (!stripped) { console.log(`  skip  ${file} (no SQL yet)`); continue; }
    process.stdout.write(`  apply ${file} ... `);
    try {
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log('ok');
      count++;
    } catch (err) {
      console.log('FAILED');
      console.error(`\n${file}:\n${err.message}\n`);
      await conn.end();
      process.exit(1);
    }
  }

  console.log(count ? `\n${count} migration(s) applied.` : '\nAlready up to date.');
  await conn.end();
})();
