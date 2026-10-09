-- =========================================================================
-- 008 — Report procedures                                  OWNER: M5
--
-- TODO(M5). One procedure per report of Feature 4.12:
--   sp_report_quarterly_sales(IN p_year INT)                     (REQ-12.1)
--     per quarter: total revenue + order count, excluding cancelled orders
--   sp_report_top_products(IN p_from DATE, IN p_to DATE, IN p_limit INT)
--                                                                (REQ-12.2)
--   sp_report_category_orders()                                  (REQ-12.3)
--     an order spanning several categories counts once in each
--   sp_report_upcoming_deliveries()                              (REQ-12.4)
--     not yet delivered/picked, with city + oos flag + estimated date,
--     ORDER BY estimated_delivery_date ASC
--   sp_report_customer_summary(IN p_customer_id INT)             (REQ-12.5)
--     pass NULL for all customers
--
-- Cross-check every number by hand against the seed data before you trust it.
-- A report that runs but returns wrong totals is worse than one that errors.
-- =========================================================================

CREATE PROCEDURE sp_report_quarterly_sales(IN p_year INT)
BEGIN
    SELECT
        CONCAT('Q', qtr) AS quarter,
        COUNT(*)         AS orderCount,
        SUM(total_amount) AS totalRevenue
    FROM (
        SELECT QUARTER(order_date) AS qtr, total_amount
        FROM orders
        WHERE YEAR(order_date) = p_year
          AND order_status != 'Cancelled'
    ) t
    GROUP BY qtr
    ORDER BY qtr;
END;


-- sp_report_top_products(p_from, p_to, p_limit)                    (REQ-12.2)
CREATE PROCEDURE sp_report_top_products(IN p_from DATE, IN p_to DATE, IN p_limit INT)
BEGIN
    SELECT
        p.product_id                              AS productId,
        p.product_name                             AS productName,
        SUM(oi.quantity)                           AS quantitySold,
        SUM(oi.quantity * oi.unit_price_at_order)  AS revenue
    FROM order_item oi
    JOIN orders o   ON o.order_id = oi.order_id
    JOIN variant v  ON v.variant_id = oi.variant_id
    JOIN product p  ON p.product_id = v.product_id
    WHERE o.order_date BETWEEN p_from AND p_to
      AND o.order_status != 'Cancelled'
    GROUP BY p.product_id, p.product_name
    ORDER BY revenue DESC
    LIMIT p_limit;
END;

-- sp_report_category_orders()                                      (REQ-12.3)
-- An order spanning several categories counts once in each.
CREATE PROCEDURE sp_report_category_orders()
BEGIN
    SELECT
        c.category_id                    AS categoryId,
        c.category_name                  AS categoryName,
        COUNT(DISTINCT o.order_id)       AS orderCount
    FROM orders o
    JOIN order_item oi       ON oi.order_id = o.order_id
    JOIN variant v            ON v.variant_id = oi.variant_id
    JOIN product_category pc  ON pc.product_id = v.product_id
    JOIN category c           ON c.category_id = pc.category_id
    WHERE o.order_status != 'Cancelled'
    GROUP BY c.category_id, c.category_name;
END;

-- sp_report_upcoming_deliveries()                                  (REQ-12.4)
-- Not yet delivered/picked, with city + out-of-stock flag + estimated date.
CREATE PROCEDURE sp_report_upcoming_deliveries()
BEGIN
    SELECT
        o.order_id                        AS orderId,
        ci.city_name                      AS cityName,
        MAX(oi.out_of_stock_flag)         AS outOfStockFlag,
        d.estimated_delivery_date         AS estimatedDeliveryDate
    FROM delivery d
    JOIN orders o      ON o.order_id = d.order_id
    JOIN city ci       ON ci.city_id = d.city_id
    JOIN order_item oi ON oi.order_id = o.order_id
    WHERE d.delivery_status != 'delivered'
    GROUP BY o.order_id, ci.city_name, d.estimated_delivery_date
    ORDER BY d.estimated_delivery_date ASC;
END;

-- sp_report_customer_summary(p_customer_id)                        (REQ-12.5)
-- Pass NULL for all customers.
CREATE PROCEDURE sp_report_customer_summary(IN p_customer_id INT)
BEGIN
    SELECT
        u.user_id     AS customerId,
        u.first_name  AS firstName,
        u.last_name   AS lastName,
        COUNT(o.order_id) AS orderCount,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.total_amount END), 0) AS totalSpent
    FROM customer c
    JOIN user u        ON u.user_id = c.user_id
    LEFT JOIN orders o ON o.customer_id = c.user_id
    WHERE p_customer_id IS NULL OR c.user_id = p_customer_id
    GROUP BY u.user_id, u.first_name, u.last_name;
END;

