// reports slice — OWNER: M5
// TODO(M5): SQL ONLY. Use placeholders, never string concatenation.
// SQL ONLY. Call stored procedures only.
const { pool } = require('../../config/db');

exports.callQuarterlySales = async (year) => {
  const [rows] = await pool.query('CALL sp_report_quarterly_sales(?)', [year]);
  return rows[0] || [];
};

exports.callTopProducts = async (from, to, limit) => {
  const [rows] = await pool.query('CALL sp_report_top_products(?, ?, ?)', [from, to, limit]);
  return rows[0] || [];
};

exports.callCategoryOrders = async () => {
  const [rows] = await pool.query('CALL sp_report_category_orders()');
  return rows[0] || [];
};

exports.callUpcomingDeliveries = async () => {
  const [rows] = await pool.query('CALL sp_report_upcoming_deliveries()');
  return rows[0] || [];
};

exports.callCustomerSummary = async (customerId) => {
  const [rows] = await pool.query('CALL sp_report_customer_summary(?)', [customerId]);
  return rows[0] || [];
};