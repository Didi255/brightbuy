// SQL ONLY. Use placeholders, never string concatenation.
const { pool } = require('../../config/db');

exports.findByOrderId = async (orderId) => {
  const [rows] = await pool.query(
    `SELECT p.payment_id, p.order_id, p.payment_method, p.payment_status,
            p.gateway_ref, o.customer_id
       FROM payment p
       JOIN orders o ON o.order_id = p.order_id
      WHERE p.order_id = ?`,
    [orderId]
  );
  return rows[0] || null;
};


exports.findCodPendingPayments = async (filters = {}) => {
  let query = `
    SELECT p.payment_id, p.order_id, p.payment_method, p.payment_status,
           p.gateway_ref, o.customer_id, o.order_date, o.total_amount,
           u.first_name, u.last_name, u.email
      FROM payment p
      JOIN orders o ON o.order_id = p.order_id
      JOIN customer c ON c.user_id = o.customer_id
      JOIN user u ON u.user_id = c.user_id
     WHERE p.payment_method = 'cod'
       AND p.payment_status = 'Pending'
       AND o.order_status != 'Cancelled'
  `;
  
  const params = [];
  
  if (filters.from) {
    query += ` AND o.order_date >= ?`;
    params.push(filters.from);
  }
  if (filters.to) {
    query += ` AND o.order_date <= ?`;
    params.push(filters.to);
  }
  
  query += ` ORDER BY o.order_date DESC`;
  
  const [rows] = await pool.query(query, params);
  return rows;
};

exports.findPaymentById = async (paymentId) => {
  const [rows] = await pool.query(
    `SELECT p.payment_id, p.order_id, p.payment_method, p.payment_status,
            p.gateway_ref, p.updated_at, o.customer_id, o.total_amount,
            u.email, u.first_name
       FROM payment p
       JOIN orders o ON o.order_id = p.order_id
       JOIN customer c ON c.user_id = o.customer_id
       JOIN user u ON u.user_id = c.user_id
      WHERE p.payment_id = ?`,
    [paymentId]
  );
  return rows[0] || null;
};


exports.markCodPaid = async (paymentId, staffId) => {
  await pool.query(
    `UPDATE payment
        SET payment_status = 'Paid', staff_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?`,
    [staffId, paymentId]
  );
};

exports.findExpiredFailedCardPayments = async () => {
  const [rows] = await pool.query(
    `SELECT p.order_id
       FROM payment p
       JOIN orders o ON o.order_id = p.order_id
      WHERE p.payment_method = 'card'
        AND p.payment_status = 'Failed'
        AND p.updated_at <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)
        AND o.order_status IN ('Placed', 'Processing')
      ORDER BY p.updated_at, p.payment_id`
  );
  return rows;
};

exports.cancelExpiredPaymentOrder = async (orderId) => {
  await pool.query('CALL sp_cancel_order(?, ?)', [orderId, null]);
};

// Only succeeds if the row is still Pending. Returns affectedRows (0 or 1).
exports.setCardResultIfPending = async (paymentId, status, gatewayRef) => {
  const [result] = await pool.query(
    `UPDATE payment
        SET payment_status = ?, gateway_ref = ?, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
        AND payment_method = 'card'
        AND payment_status = 'Pending'`,
    [status, gatewayRef, paymentId]
  );
  return result.affectedRows;
};

// Only succeeds if the row is still Failed. Resets updated_at so the 24h window restarts.
exports.setRetryResultIfFailed = async (paymentId, status, gatewayRef) => {
  const [result] = await pool.query(
    `UPDATE payment
        SET payment_status = ?, gateway_ref = ?, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
        AND payment_method = 'card'
        AND payment_status = 'Failed'`,
    [status, gatewayRef, paymentId]
  );
  return result.affectedRows;
};

// Only succeeds if a COD payment is still Pending.
exports.markCodPaidIfPending = async (paymentId, staffId) => {
  const [result] = await pool.query(
    `UPDATE payment
        SET payment_status = 'Paid', staff_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE payment_id = ?
        AND payment_method = 'cod'
        AND payment_status = 'Pending'`,
    [staffId, paymentId]
  );
  return result.affectedRows;
};