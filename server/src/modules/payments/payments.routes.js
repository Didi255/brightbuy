/**
 * payments slice — OWNER: M5
 * Copy the shape of modules/auth/. Mount this router in src/app.js when ready.
 */
const router = require('express').Router();
const controller = require('./payments.controller');
const { requireAuth } = require('../../middleware/auth');

router.post('/payments/card', requireAuth, controller.payCard);

module.exports = router;
