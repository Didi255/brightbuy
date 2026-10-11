const router = require('express').Router();
const controller = require('./payments.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.post('/payments/card', requireAuth, controller.payCard);
router.post('/payments/:id/retry', requireAuth, controller.retryPayment);

router.patch(
  '/admin/payments/:id',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  controller.markCodPaid
);

module.exports = router;