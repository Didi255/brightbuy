// payments slice — OWNER: M5
// TODO(M5): SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');

exports.findByOrderID= async(orderID) => {
    const[rows] =  await pool.query(
        'SELECT p.payment_id, p.order_id, p.payment_method, p.payment_status, p.gateway_ref, o.customer_id from payment p join orders o on o.order_id = p.order_id where p.order_id = ?',
        [order_id]
    );
    return rows[0] || null;
};

exports.updateStatus = async(paymentID, status,gatewayRef) => {
    await pool.query(
        'update payment set payment_status = ?, gateway_ref =? where payment_id = ?',
        [status, gatewayRef, paymentID]

    );
};