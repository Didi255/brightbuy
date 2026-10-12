const router = require('express').Router();
const controller = require('./reports.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

const staffOnly = [
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
];

router.get('/quarterly-sales', ...staffOnly, controller.quarterlySales);
router.get('/top-products', ...staffOnly, controller.topProducts);
router.get('/category-orders', ...staffOnly, controller.categoryOrders);
router.get('/upcoming-deliveries', ...staffOnly, controller.upcomingDeliveries);
router.get('/customer-summary', ...staffOnly, controller.customerSummary);

module.exports = router;