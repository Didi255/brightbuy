// orders slice — OWNER: M4
// TODO(M4): SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');

exports.placeOrder = async ({customerId, cartId, deliveryMode, addressId, cityId, paymentMethod}) => {
    const conn = await pool.getConnection();
    try{
        await conn.query(
            'CALL sp_place_order(?,?,?,?,?,?,@oid,@st)',
            [customerId, cartId, deliveryMode ,addressId ,cityId,paymentMethod]
        );
        const[[out]] = await conn.query('SELECT @oid AS orderId, @st AS status');
        return out;


    }finally{
        conn.release();
    }
};

exports.findActiveCart = async(customerId) =>{
    const [rows] = await pool.query(
        `SELECT cart_id AS cartId FROM cart 
        WHERE customer_id = ? AND cart_status = 'active'
        ORDER BY cart_id DESC
        LIMIT 1`,
        [customerId]
    );
    return rows[0] || null;
};

exports.findOwnedAddress = async (customerId,addressId) => {
    const [rows] = await pool.query(
        `SELECT a.address_id AS addressId, a.city_id AS cityId
        FROM customer c
        JOIN address a ON a.address_id = c.address_id
        WHERE c.user_id = ? AND a.address_id = ?`,
        [customerId, addressId]
    );
    return rows[0] || null;
}


exports.findOrderById = async (orderId,customerId) => {
    const [rows] = await pool.query(

        `SELECT o.order_id             AS orderId,
            o.customer_id              AS customerId,
            o.order_date               AS orderDate,
            o.order_status             AS orderStatus,
            o.total_amount             AS totalAmount,
            d.delivery_mode            AS deliveryMode,
            d.address_snapshot         AS addressSnapshot,
            c.city_name                AS cityName,
            c.is_main_city             AS isMainCity,
            DATE_FORMAT(d.estimated_delivery_date, '%Y-%m-%d') AS estimatedDeliveryDate,
            d.delivery_status          AS deliveryStatus
        FROM orders o
    JOIN delivery d ON d.order_id = o.order_id
    JOIN city c     ON c.city_id  = d.city_id
    WHERE o.order_id = ? AND o.customer_id = ?
    ORDER BY o.order_id DESC`,
    [orderId, customerId]

    );
    return rows[0] || null;
}

exports.findOrderItems = async (orderId) => {
    const [rows] = await pool.query(
        `SELECT oi.order_item_id                    AS orderItemId,
            oi.variant_id                           AS variantId,
            v.SKU                                   AS sku,
            p.product_name                          AS productName,
            oi.quantity                             AS quantity,
            oi.unit_price_at_order                  AS unitPriceAtOrder,
            (oi.quantity * oi.unit_price_at_order)  AS lineTotal,
            oi.out_of_stock_flag                    AS outOfStockFlag,
            p.image_url                             AS imageUrl
        FROM order_item oi
        JOIN variant v ON v.variant_id = oi.variant_id
        JOIN product p ON p.product_id = v.product_id
         WHERE oi.order_id = ?
        ORDER BY oi.order_item_id`
        , [orderId]);
    return rows ;    
}

exports.findItemsForOrders = async (orderIds) => {
  const [rows] = await pool.query(
    `SELECT oi.order_id                           AS orderId,
            oi.order_item_id                      AS orderItemId,
            oi.variant_id                         AS variantId,
            v.SKU                                 AS sku,
            p.product_name                        AS productName,
            oi.quantity                           AS quantity,
            oi.unit_price_at_order                AS unitPriceAtOrder,
            (oi.quantity * oi.unit_price_at_order) AS lineTotal,
            oi.out_of_stock_flag                  AS outOfStockFlag,
            p.image_url                           AS imageUrl
       FROM order_item oi
       JOIN variant v ON v.variant_id = oi.variant_id
       JOIN product p ON p.product_id = v.product_id
      WHERE oi.order_id IN (?)
      ORDER BY oi.order_item_id`,
    [orderIds]
  );
  return rows;
};

exports.findOrdersByCustomer = async (customerId) => {
  const [rows] = await pool.query(
    `SELECT o.order_id                 AS orderId,
            o.customer_id              AS customerId,
            o.order_date               AS orderDate,
            o.order_status             AS orderStatus,
            o.total_amount             AS totalAmount,
            d.delivery_mode            AS deliveryMode,
            d.address_snapshot         AS addressSnapshot,
            c.city_name                AS cityName,
            c.is_main_city             AS isMainCity,
            DATE_FORMAT(d.estimated_delivery_date, '%Y-%m-%d') AS estimatedDeliveryDate,
            d.delivery_status          AS deliveryStatus
       FROM orders o
       JOIN delivery d ON d.order_id = o.order_id
       JOIN city c     ON c.city_id  = d.city_id
      WHERE o.customer_id = ?
      ORDER BY o.order_date DESC`,
    [customerId]
  );
  return rows;
};

exports.cancelOrder = async (orderId, actorUserId) => {
    await pool.query('CALL sp_cancel_order(?,?)',[orderId,actorUserId]);
};

exports.findPaymentForOrder = async (orderId) => {
    const[rows] = await pool.query(
        `SELECT p.order_id AS orderId,
        p.payment_method AS paymentMethod,
        p.payment_status AS paymentStatus,
        p.gateway_ref AS gatewayRef
        FROM payment p
        WHERE p.order_id IN(?)`,
        [orderId]
    );
    return rows[0] || null;
    
};

exports.findPaymentsForOrders = async (orderIds) => {
  if (orderIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT p.order_id       AS orderId,
            p.payment_method AS paymentMethod,
            p.payment_status AS paymentStatus,
            p.gateway_ref    AS gatewayRef
       FROM payment p
      WHERE p.order_id IN (?)`,
    [orderIds]
  );
  return rows;
};


