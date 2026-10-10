const router = require('express').Router();
const controller = require('./reports.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');


router.get('/reports/quarterly-sales', requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour'), controller.quarterlySales);
router.get('/reports/top-products', requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour'), controller.topProducts);
router.get('/reports/category-orders', requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour'), controller.categoryOrders);
router.get('/reports/upcoming-deliveries', requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour'), controller.upcomingDeliveries);
router.get('/reports/customer-summary', requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour'), controller.customerSummary);

module.exports = router;