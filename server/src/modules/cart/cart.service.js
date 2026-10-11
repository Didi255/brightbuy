// cart slice — OWNER: M3
// Business logic only. No SQL, no req/res.
const repo = require('./cart.repo');
const ApiError = require('../../utils/ApiError');

// Find or create active cart, auto-merging guest cart on login.
async function getCartId({ customerId, sessionToken }, autoCreate = true) {
  if (customerId && sessionToken) await repo.mergeGuestCart(customerId, sessionToken);
  let cart = await repo.findActive({ customerId, sessionToken });
  if (!cart && autoCreate) {
    if (!customerId && !sessionToken) throw ApiError.badRequest('Session token or customer required');
    return repo.createCart({ customerId: customerId || null, sessionToken: customerId ? null : sessionToken });
  }
  if (!cart) throw ApiError.notFound('Cart not found');
  return cart.cartId;
}

//  Get full cart shape.
exports.getCart = async (ctx) => repo.getCartWithItems(await getCartId(ctx, true));

//  Add item to cart.
exports.addItem = async ({ customerId, sessionToken, variantId, quantity = 1 }) => {
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) throw ApiError.badRequest('Quantity must be a positive integer', { quantity: 'must be > 0' });

  const variant = await repo.findVariantById(variantId);
  if (!variant || !variant.isActive) throw ApiError.notFound('Product variant not found or inactive');

  const cartId = await getCartId({ customerId, sessionToken }, true);
  await repo.addItem({ cartId, variantId, quantity: qty });
  return repo.getCartWithItems(cartId);
};

//  Update item quantity
exports.updateItem = async ({ customerId, sessionToken, itemId, quantity }) => {
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) throw ApiError.badRequest('Quantity must be a positive integer', { quantity: 'must be > 0' });

  const cartId = await getCartId({ customerId, sessionToken }, false);
  const ok = await repo.updateItemQuantity({ cartId, itemId: Number(itemId), quantity: qty });
  if (!ok) throw ApiError.notFound('Item not found in cart');
  return repo.getCartWithItems(cartId);
};

//  Remove item from cart
exports.removeItem = async ({ customerId, sessionToken, itemId }) => {
  const cartId = await getCartId({ customerId, sessionToken }, false);
  const ok = await repo.removeItem({ cartId, itemId: Number(itemId) });
  if (!ok) throw ApiError.notFound('Item not found in cart');
  return repo.getCartWithItems(cartId);
};

// Checkout summary
exports.getCheckoutSummary = async ({ customerId, deliveryMode, addressId }) => {
  const cart = await exports.getCart({ customerId });
  if (!cart || !cart.items.length) throw ApiError.badRequest('Cannot checkout an empty cart');
  if (!['standard', 'store_pickup'].includes(deliveryMode)) throw ApiError.badRequest('Invalid delivery mode');

  let city;
  if (deliveryMode === 'store_pickup') {
    city = await repo.getCityById(Number(process.env.STORE_CITY_ID || 1));
  } else {
    if (!addressId) throw ApiError.badRequest('addressId is required for standard delivery');
    city = await repo.getCustomerAddressCity(customerId, Number(addressId));
  }
  if (!city) throw ApiError.badRequest('Invalid delivery location');

  const days = Number(await repo.estimateDeliveryDays(city.cityId, cart.hasOutOfStockItems));
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + days);

  return {
    cart,
    deliveryMode,
    cityName: city.cityName,
    isMainCity: Boolean(city.isMainCity),
    estimatedDeliveryDays: days,
    estimatedDeliveryDate: estDate.toISOString().slice(0, 10),
    hasOutOfStockItems: cart.hasOutOfStockItems,
    total: cart.subtotal,
  };
};
