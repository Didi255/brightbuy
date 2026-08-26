const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  decimalNumbers: true,
});

/**
 * Run a callback inside a transaction. Commits on success, rolls back on throw.
 *
 *   await withTransaction(async (conn) => {
 *     await conn.query('SELECT ... FOR UPDATE', [id]);
 *     await conn.query('UPDATE ...');
 *   });
 *
 * Use this for multi-statement work done in JS. For sp_place_order (Feature 4.6)
 * the transaction lives inside the stored procedure instead — call it with a
 * single query and let MySQL own the transaction boundary.
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
