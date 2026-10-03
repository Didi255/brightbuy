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