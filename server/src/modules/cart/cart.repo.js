// cart slice — OWNER: M3
// SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');

// Find the latest active cart for a customer or a guest session token(discover the cart while user is shopping).
exports.findActive = async ({ customerId, sessionToken }) => {
  if (customerId) {
    const [rows] = await pool.query(
      `SELECT cart_id AS cartId, customer_id AS customerId, session_token AS sessionToken,
              cart_status AS cartStatus, created_at AS createdAt
         FROM cart
        WHERE customer_id = ? AND cart_status = 'active'
        ORDER BY cart_id DESC
        LIMIT 1`,
      [customerId]
    );
    return rows[0] || null;
  }

  if (sessionToken) {
    const [rows] = await pool.query(
      `SELECT cart_id AS cartId, customer_id AS customerId, session_token AS sessionToken,
              cart_status AS cartStatus, created_at AS createdAt
         FROM cart
        WHERE session_token = ? AND cart_status = 'active'
        ORDER BY cart_id DESC
        LIMIT 1`,
      [sessionToken]
    );
    return rows[0] || null;
  }

  return null;
};

// Find cart by primary key(When doing the payment the data will be passed using cart_id).
exports.findById = async (cartId) => {
  const [rows] = await pool.query(
    `SELECT cart_id AS cartId, customer_id AS customerId, session_token AS sessionToken,
            cart_status AS cartStatus, created_at AS createdAt
       FROM cart WHERE cart_id = ?`,
    [cartId]
  );
  return rows[0] || null;
};

// Create a new active cart
exports.createCart = async ({ customerId = null, sessionToken = null }) => {
  const [res] = await pool.query(
    `INSERT INTO cart (customer_id, session_token, cart_status) VALUES (?, ?, 'active')`,
    [customerId, sessionToken]
  );
  return res.insertId;//returns the new auto-generated cart id
};

// Fetch full Cart shape matching docs/API.md with items, attributes, and totals
exports.getCartWithItems = async (cartId) => {
  const cart = await exports.findById(cartId);
  if (!cart) return null;

  // Fetch items joined with product and variant info
  const [itemRows] = await pool.query(
    `SELECT ci.item_id AS itemId, ci.cart_id AS cartId, ci.variant_id AS variantId,
            ci.quantity, (v.price * ci.quantity) AS lineTotal,
            v.product_id AS productId, p.product_name AS productName,
            v.SKU AS sku, v.price, v.stock_quantity AS stockQuantity,
            (v.stock_quantity > 0) AS inStock, v.is_active AS isActive,
            p.image_url AS imageUrl
       FROM cart_item ci
       JOIN variant v ON v.variant_id = ci.variant_id
       JOIN product p ON p.product_id = v.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.item_id ASC`,
    [cartId]
  );

  // Fetch attributes for all variants present in this cart
  const attributesByVariant = {};
  if (itemRows.length > 0) {
    const variantIds = [...new Set(itemRows.map((r) => r.variantId))];
    const [attrRows] = await pool.query(
      `SELECT av.variant_id AS variantId, va.name, av.value
         FROM attribute_value av
         JOIN variant_attribute va ON va.attribute_id = av.attribute_id
        WHERE av.variant_id IN (?)`,
      [variantIds]
    );
    for (const { variantId, name, value } of attrRows) {
      if (!attributesByVariant[variantId]) attributesByVariant[variantId] = [];
      attributesByVariant[variantId].push({ name, value });
    }
  }

  // Compute cart totals in SQL (exact DECIMAL math)
  const [[summary]] = await pool.query(
    `SELECT COALESCE(CAST(SUM(v.price * ci.quantity) AS CHAR), '0.00') AS subtotal,
            COALESCE(SUM(ci.quantity), 0) AS itemCount,
            COALESCE(MAX(v.stock_quantity = 0), 0) AS hasOutOfStockItems
       FROM cart_item ci
       JOIN variant v ON v.variant_id = ci.variant_id
      WHERE ci.cart_id = ?`,
    [cartId]
  );

  return {
    cartId: cart.cartId,
    customerId: cart.customerId,
    sessionToken: cart.sessionToken,
    cartStatus: cart.cartStatus,
    items: itemRows.map((row) => ({
      itemId: row.itemId,
      quantity: row.quantity,
      lineTotal: String(row.lineTotal),
      variant: {
        variantId: row.variantId,
        productId: row.productId,
        productName: row.productName,
        sku: row.sku,
        price: String(row.price),
        stockQuantity: row.stockQuantity,
        inStock: Boolean(row.inStock),
        isActive: Boolean(row.isActive),
        imageUrl: row.imageUrl,
        attributes: attributesByVariant[row.variantId] || [],
      },
    })),
    itemCount: Number(summary.itemCount),
    subtotal: String(summary.subtotal),
    hasOutOfStockItems: Boolean(summary.hasOutOfStockItems),
  };
};

// Add item to cart — sums quantities if variant already in cart (REQ-3.4)
exports.addItem = async ({ cartId, variantId, quantity }) => {
  await pool.query(
    `INSERT INTO cart_item (cart_id, variant_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [cartId, variantId, quantity, quantity]
  );
};

// Update item quantity (scoped to cart_id for security)
exports.updateItemQuantity = async ({ cartId, itemId, quantity }) => {
  const [res] = await pool.query(
    `UPDATE cart_item SET quantity = ? WHERE item_id = ? AND cart_id = ?`,
    [quantity, itemId, cartId]
  );
  return res.affectedRows > 0;
};

// Remove item from cart (scoped to cart_id)
exports.removeItem = async ({ cartId, itemId }) => {
  const [res] = await pool.query(
    `DELETE FROM cart_item WHERE item_id = ? AND cart_id = ?`,
    [itemId, cartId]
  );
  return res.affectedRows > 0;// if an items is removed then it will return true
};

// Check if a variant exists and is active
exports.findVariantById = async (variantId) => {
  const [rows] = await pool.query(
    `SELECT variant_id AS variantId, price, stock_quantity AS stockQuantity, is_active AS isActive
       FROM variant WHERE variant_id = ?`,
    [variantId]
  );
  return rows[0] || null;
};

// Atomically merge guest cart into customer cart on login (DECISIONS #14)
exports.mergeGuestCart = async (customerId, sessionToken) => {
  return withTransaction(async (conn) => {
    // Find active guest cart
    const [guest] = await conn.query(
      `SELECT cart_id FROM cart WHERE session_token = ? AND cart_status = 'active'
       ORDER BY cart_id DESC LIMIT 1`,
      [sessionToken]
    );
    if (!guest.length) return null;
    const guestCartId = guest[0].cart_id;

    // Find or create active customer cart
    const [cust] = await conn.query(
      `SELECT cart_id FROM cart WHERE customer_id = ? AND cart_status = 'active'
       ORDER BY cart_id DESC LIMIT 1`,
      [customerId]
    );

    let customerCartId;
    if (cust.length) {
      customerCartId = cust[0].cart_id;
    } else {
      const [res] = await conn.query(
        `INSERT INTO cart (customer_id, cart_status) VALUES (?, 'active')`,
        [customerId]
      );
      customerCartId = res.insertId;
    }

    // Move items to customer cart, summing quantities for duplicates
    await conn.query(
      `INSERT INTO cart_item (cart_id, variant_id, quantity)
       SELECT ?, variant_id, quantity FROM cart_item WHERE cart_id = ?
       ON DUPLICATE KEY UPDATE quantity = cart_item.quantity + VALUES(quantity)`,
      [customerCartId, guestCartId]
    );

    // Mark guest cart converted
    await conn.query(`UPDATE cart SET cart_status = 'converted' WHERE cart_id = ?`, [guestCartId]);

    return customerCartId;
  });
};

// Look up city details for store pickup
exports.getCityById = async (cityId) => {
  const [rows] = await pool.query(
    `SELECT city_id AS cityId, city_name AS cityName, is_main_city AS isMainCity
       FROM city WHERE city_id = ?`,
    [cityId]
  );
  return rows[0] || null;
};

// Verify customer owns address and get its city info
exports.getCustomerAddressCity = async (customerId, addressId) => {
  const [rows] = await pool.query(
    `SELECT a.address_id AS addressId, a.city_id AS cityId,
            c.city_name AS cityName, c.is_main_city AS isMainCity
       FROM address a
       JOIN city c ON c.city_id = a.city_id
      WHERE a.address_id = ?
        AND (a.customer_id = ? OR a.address_id = (SELECT address_id FROM customer WHERE user_id = ?))`,
    [addressId, customerId, customerId]
  );
  return rows[0] || null;
};

// Call stored function to calculate delivery days turnaround
exports.estimateDeliveryDays = async (cityId, hasOutOfStock) => {
  const [[row]] = await pool.query(
    `SELECT fn_estimate_delivery_days(?, ?) AS days`,
    [cityId, hasOutOfStock ? 1 : 0]
  );
  return row.days;
};
