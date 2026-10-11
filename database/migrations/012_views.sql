-- 012_views.sql
-- OWNER: E

CREATE VIEW v_order_details AS
SELECT
    o.order_id,
    o.order_date,
    o.order_status,
    o.total_amount,
    u.first_name,
    u.last_name,
    u.email,
    d.delivery_mode,
    d.estimated_delivery_date,
    c.city_name,
    c.is_main_city,
    p.payment_method,
    p.payment_status
FROM orders o
JOIN customer cu ON cu.user_id = o.customer_id
JOIN user u ON u.user_id = cu.user_id
JOIN delivery d ON d.order_id = o.order_id
JOIN city c ON c.city_id = d.city_id
LEFT JOIN payment p ON p.order_id = o.order_id;

CREATE VIEW v_variant_stock AS
SELECT
    v.variant_id,
    v.SKU,
    v.price,
    v.stock_quantity,
    (v.stock_quantity > 0) AS in_stock,
    p.product_id,
    p.product_name,
    p.brand
FROM variant v
JOIN product p ON p.product_id = v.product_id
WHERE v.is_active = TRUE
  AND p.is_active = TRUE;