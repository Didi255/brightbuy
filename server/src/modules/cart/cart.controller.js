// cart slice — OWNER: M3
// HTTP in/out only. No SQL.
const service = require('./cart.service');

// Helper to extract authentication and session token from request
function getContext(req) {
  return {
    customerId: req.user?.userId || null,
    sessionToken: req.headers['x-cart-session'] || null,
  };
}

// GET /cart
exports.getCart = async (req, res, next) => {
  try {
    const { customerId, sessionToken } = getContext(req);
    const cart = await service.getCart({ customerId, sessionToken });
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// POST /cart/items
exports.addItem = async (req, res, next) => {
  try {
    const { customerId, sessionToken } = getContext(req);
    const { variantId, quantity } = req.body;
    const cart = await service.addItem({ customerId, sessionToken, variantId, quantity });
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// PATCH /cart/items/:itemId
exports.updateItem = async (req, res, next) => {
  try {
    const { customerId, sessionToken } = getContext(req);
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cart = await service.updateItem({ customerId, sessionToken, itemId, quantity });
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// DELETE /cart/items/:itemId
exports.removeItem = async (req, res, next) => {
  try {
    const { customerId, sessionToken } = getContext(req);
    const { itemId } = req.params;
    const cart = await service.removeItem({ customerId, sessionToken, itemId });
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

// GET /checkout/summary (query params: deliveryMode, addressId)
exports.getCheckoutSummary = async (req, res, next) => {
  try {
    const customerId = req.user.userId;
    const { deliveryMode, addressId } = req.query;
    const summary = await service.getCheckoutSummary({ customerId, deliveryMode, addressId });
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
