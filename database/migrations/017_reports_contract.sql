-- 017 — M5 report contract and SQL coverage
-- Implements REQ-12.1–12.5.
-- Replaces the existing report procedures without editing migration 008.

DROP PROCEDURE IF EXISTS sp_report_quarterly_sales;
DROP PROCEDURE IF EXISTS sp_report_top_products;
DROP PROCEDURE IF EXISTS sp_report_category_orders;
DROP PROCEDURE IF EXISTS sp_report_upcoming_deliveries;
DROP PROCEDURE IF EXISTS sp_report_customer_summary;

CREATE PROCEDURE sp_report_quarterly_sales(IN p_year INT)
BEGIN
    SELECT
        CASE
            WHEN GROUPING(qtr) = 1 THEN 'Total'
            ELSE CONCAT('Q', qtr)
        END AS quarter,
        COUNT(DISTINCT order_id) AS orderCount,
        SUM(total_amount) AS totalRevenue
    FROM (
        SELECT
            QUARTER(order_date) AS qtr,
            order_id,
            total_amount
        FROM orders
        WHERE YEAR(order_date) = p_year
          AND order_status <> 'Cancelled'
    ) AS quarterly_orders
    GROUP BY qtr WITH ROLLUP
    ORDER BY qtr IS NULL, qtr;
END;

CREATE PROCEDURE sp_report_top_products(
    IN p_from DATE,
    IN p_to DATE,
    IN p_limit INT
)
BEGIN
    WITH product_totals AS (
        SELECT
            p.product_id AS productId,
            p.product_name AS productName,
            SUM(oi.quantity) AS quantitySold,
            SUM(oi.quantity * oi.unit_price_at_order) AS revenue
        FROM order_item oi
        JOIN orders o ON o.order_id = oi.order_id
        JOIN variant v ON v.variant_id = oi.variant_id
        JOIN product p ON p.product_id = v.product_id
        WHERE o.order_date >= p_from
          AND o.order_date < DATE_ADD(p_to, INTERVAL 1 DAY)
          AND o.order_status <> 'Cancelled'
        GROUP BY p.product_id, p.product_name
    ),
    ranked_products AS (
        SELECT
            productId,
            productName,
            quantitySold,
            revenue,
            RANK() OVER (ORDER BY quantitySold DESC) AS salesRank,
            DENSE_RANK() OVER (ORDER BY quantitySold DESC) AS denseSalesRank
        FROM product_totals
    )
    SELECT productId, productName, quantitySold, revenue
    FROM ranked_products
    ORDER BY salesRank, productId
    LIMIT p_limit;
END;

CREATE PROCEDURE sp_report_category_orders()
BEGIN
    SELECT
        c.category_id AS categoryId,
        c.category_name AS categoryName,
        COUNT(DISTINCT o.order_id) AS orderCount
    FROM orders o
    JOIN order_item oi ON oi.order_id = o.order_id
    JOIN variant v ON v.variant_id = oi.variant_id
    JOIN product_category pc ON pc.product_id = v.product_id
    JOIN category c ON c.category_id = pc.category_id
    WHERE o.order_status <> 'Cancelled'
    GROUP BY c.category_id, c.category_name
    ORDER BY c.category_name;
END;

CREATE PROCEDURE sp_report_upcoming_deliveries()
BEGIN
    SELECT
        o.order_id AS orderId,
        ci.city_name AS cityName,
        MAX(oi.out_of_stock_flag) AS hasOutOfStockItems,
        d.estimated_delivery_date AS estimatedDeliveryDate,
        o.order_status AS orderStatus
    FROM delivery d
    JOIN orders o ON o.order_id = d.order_id
    JOIN city ci ON ci.city_id = d.city_id
    JOIN order_item oi ON oi.order_id = o.order_id
    WHERE d.delivery_status <> 'delivered'
      AND o.order_status <> 'Cancelled'
    GROUP BY
        o.order_id,
        ci.city_name,
        d.estimated_delivery_date,
        o.order_status
    ORDER BY d.estimated_delivery_date;
END;

CREATE PROCEDURE sp_report_customer_summary(IN p_customer_id INT)
BEGIN
    SELECT
        u.user_id AS customerId,
        CONCAT(u.first_name, ' ', u.last_name) AS customerName,
        COUNT(DISTINCT CASE
            WHEN o.order_status <> 'Cancelled' THEN o.order_id
        END) AS orderCount,
        COALESCE(SUM(CASE
            WHEN o.order_status <> 'Cancelled' THEN o.total_amount
            ELSE 0
        END), 0) AS totalSpent,
        COUNT(DISTINCT CASE
            WHEN o.order_status <> 'Cancelled'
             AND p.payment_status = 'Pending' THEN p.payment_id
        END) AS pendingPayments
    FROM customer cu
    JOIN user u ON u.user_id = cu.user_id
    LEFT JOIN orders o ON o.customer_id = cu.user_id
    LEFT JOIN payment p ON p.order_id = o.order_id
    WHERE p_customer_id IS NULL
       OR cu.user_id = p_customer_id
    GROUP BY u.user_id, u.first_name, u.last_name
    ORDER BY u.user_id;
END;