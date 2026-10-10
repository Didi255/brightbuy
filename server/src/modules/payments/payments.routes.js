const router = require('express').Router();
const controller = require('./payments.controller');
const { requireAuth } = require('../../middleware/auth');

router.post('/payments/card', requireAuth, controller.payCard);
router.post('/payments/:id/retry', requireAuth, controller.retryPayment);
module.exports = router;