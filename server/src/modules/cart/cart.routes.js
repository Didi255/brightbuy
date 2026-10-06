/**
 * cart slice — OWNER: M3
 * URL -> controller, middleware. No logic.
 */
const router = require('express').Router();
const { optionalAuth, requireAuth } = require('../../middleware/auth');
const controller = require('./cart.controller');


// Cart endpoints (guest or logged-in)
router.get('/cart', optionalAuth, controller.getCart);
router.post('/cart/items', optionalAuth, controller.addItem);
router.patch('/cart/items/:itemId', optionalAuth, controller.updateItem);
router.delete('/cart/items/:itemId', optionalAuth, controller.removeItem);

// Checkout summary (customer only)
router.get('/checkout/summary', requireAuth, controller.getCheckoutSummary);

module.exports = router;
