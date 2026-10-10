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

exports.updateStatus = async (paymentId, status, gatewayRef) => {
  await pool.query(
    `UPDATE payment
        SET payment_status = ?, gateway_ref = ?
      WHERE payment_id = ?`,
    [status, gatewayRef, paymentId]
  );
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