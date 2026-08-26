require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DIR = path.join(__dirname, '..', '..', 'database', 'seeds');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
  });

  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort();
  for (const file of files) {
    console.log(`  seed ${file}`);
    await require(path.join(DIR, file))(pool);
  }
  console.log('\nSeeding complete.');
  await pool.end();
})();
