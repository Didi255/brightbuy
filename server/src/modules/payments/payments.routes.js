const router = require('express').Router();
const controller = require('./payments.controller');
const { requireAuth } = require('../../middleware/auth');

router.post('/payments/card', requireAuth, controller.payCard);

module.exports = router;