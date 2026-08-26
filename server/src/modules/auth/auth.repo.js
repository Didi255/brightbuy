/**
 * SQL ONLY. No business logic, no req/res, no bcrypt.
 *
 * Always use placeholders (? or :named) — never string concatenation.
 * That is what prevents SQL injection, and evaluators do look for it.
 */
const { pool, withTransaction } = require('../../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.first_name, u.last_name, u.email,
            u.password_hash, u.user_type, s.role
       FROM user u
       LEFT JOIN staff s ON s.user_id = u.user_id
      WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
};

/**
 * TODO(M1): insert address (if supplied), then user, then customer —
 * all inside one transaction so a half-created account can never persist.
 */
exports.createCustomer = async ({ firstName, lastName, email, passwordHash, phone }) => {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO user (first_name, last_name, email, password_hash, user_type)
       VALUES (?, ?, ?, ?, 'customer')`,
      [firstName, lastName, email, passwordHash]
    );
    const userId = res.insertId;
    await conn.query(`INSERT INTO customer (user_id, phone) VALUES (?, ?)`, [userId, phone]);
    return userId;
  });
};
