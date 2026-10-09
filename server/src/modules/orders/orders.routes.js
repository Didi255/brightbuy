/**
 * orders slice — OWNER: M4
 * Copy the shape of modules/auth/. Mount this router in src/app.js when ready.
 */
const router = require('express').Router();
const {requireAuth} = require('../../middleware/auth');
const controller = require('./orders.controller');

//POST/api/checkout/confirm
router.post('/checkout/confirm', requireAuth, controller.confirmCheckout);
router.get('/orders/:orderId', requireAuth, controller.getOrder);
router.get('/orders', requireAuth, controller.listOrders);
router.post('/orders/:orderId/cancel', requireAuth, controller.cancelOrder);
module.exports = router;
