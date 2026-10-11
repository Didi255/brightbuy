/**
 * orders slice — OWNER: M4
 * Copy the shape of modules/auth/. Mount this router in src/app.js when ready.
 */
const router = require('express').Router();
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./orders.controller');

// POST /api/checkout/confirm
router.post('/checkout/confirm', requireAuth, controller.confirmCheckout);
router.get('/orders/:orderId', requireAuth, controller.getOrder);
router.get('/orders', requireAuth, controller.listOrders);
router.post('/orders/:orderId/cancel', requireAuth, controller.cancelOrder);

// Staff (slice E)
router.get(
  '/admin/orders',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  controller.listAllOrders
);

router.patch(
  '/admin/orders/:id/status',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  controller.updateStatus
);

module.exports = router;

router.post(
  '/admin/stock-adjustments',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  controller.createAdjustment
);