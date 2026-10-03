ALTER TABLE payment
    MODIFY payment_status
        ENUM('Pending','Paid','Failed','Refunded','Cancelled') NOT NULL DEFAULT 'Pending';


DROP PROCEDURE IF EXISTS sp_place_order;

CREATE PROCEDURE sp_place_order(
    IN  p_customer_id    INT,
    IN  p_cart_id        INT,
    IN  p_delivery_mode  ENUM('store_pickup', 'standard'),
    IN  p_address_id     INT,
    IN  p_city_id        INT,
    IN  p_payment_method ENUM('cod', 'card'),
    OUT p_order_id       INT,
    OUT p_status         VARCHAR(50)
)
BEGIN
    DECLARE v_bad_lines INT;
    DECLARE v_has_oos BOOLEAN;
    DECLARE v_est_date DATE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION

    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- 0. lock every variant in this cart, in primary-key order.
        -- Consistent lock ordering makes deadlock impossible 

        SELECT v.variant_id
            FROM cart_item ci
            JOIN variant v ON v.variant_id = ci.variant_id
        WHERE ci.cart_id = p_cart_id
        ORDER BY v.variant_id
            FOR UPDATE;


        -- 1. validate
        SELECT COUNT(*) INTO v_bad_lines
        FROM cart_item ci
        JOIN variant v ON v.variant_id = ci.variant_id
        WHERE ci.cart_id = p_cart_id
            AND v.stock_quantity < ci.quantity 
            AND v.stock_quantity >0;
        IF v_bad_lines > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INSUFFICIENT_STOCK';
        END IF;
        
        -- 2. insert orders
        INSERT INTO orders(customer_id,total_amount)
        SELECT p_customer_id, SUM(v.price * ci.quantity)
            FROM cart_item ci
            JOIN variant v ON v.variant_id = ci.variant_id
            WHERE ci.cart_id = p_cart_id;
            SET p_order_id = LAST_INSERT_ID(); -- this is per connection - one value per session therefore always unique
        
        -- 3. insert order_item
        INSERT INTO order_item(order_id, variant_id, quantity, unit_price_at_order, out_of_stock_flag)
        SELECT p_order_id,
            ci.variant_id,
            ci.quantity,
            v.price,
            (v.stock_quantity = 0 )
        FROM cart_item ci
        JOIN variant v ON v.variant_id = ci.variant_id
        WHERE ci.cart_id = p_cart_id;

        -- 4. decrement
        UPDATE variant v
        JOIN cart_item ci ON ci.variant_id = v.variant_id
            SET v.stock_quantity = v.stock_quantity - ci.quantity
        WHERE ci.cart_id = p_cart_id
            AND v.stock_quantity >0;

        -- 5. insert delivery
        SELECT MAX(out_of_stock_flag) INTO v_has_oos
            FROM order_item
        WHERE order_id = p_order_id;
        SET v_est_date = DATE_ADD(CURDATE(), INTERVAL fn_estimate_delivery_days(p_city_id, v_has_oos) DAY);

        INSERT INTO delivery(order_id,delivery_mode,address_id,address_snapshot,city_id,estimated_delivery_date)
        VALUES(
            p_order_id,
            p_delivery_mode,
            IF(p_delivery_mode = 'store_pickup', NULL, p_address_id),
            IF(p_delivery_mode = 'store_pickup', NULL, (
                SELECT CONCAT_WS(', ', a.house_num, a.address_1, a.address_2,a.address_3,c.city_name)
                FROM address a
                JOIN city c ON c.city_id = a.city_id
                WHERE a.address_id = p_address_id
            )),
            p_city_id,
            v_est_date
        );

         -- 6. the payment row, 'Pending' by default (DECISIONS #22)
        INSERT INTO payment (order_id, payment_method)
        VALUES (p_order_id, p_payment_method);



        -- 7. mark cart converted
        UPDATE cart SET cart_status = 'converted' WHERE cart_id = p_cart_id;

        SET p_status = 'OK';

    COMMIT;
END;


DROP PROCEDURE IF EXISTS sp_cancel_order;

CREATE PROCEDURE sp_cancel_order(
    IN p_order_id INT,
    IN p_actor_user_id INT
)
BEGIN
    DECLARE v_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- 0. lock
        SELECT v.variant_id
            FROM order_item oi
            JOIN variant v ON v.variant_id = oi.variant_id
        WHERE oi.order_id =p_order_id
        ORDER BY v.variant_id
            FOR UPDATE;

        -- 1. validate the status
        SELECT order_status INTO v_status
            FROM orders
        WHERE order_id = p_order_id
            FOR UPDATE;

        IF v_status IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_FOUND';
        END IF;

        IF v_status NOT IN ('Placed', 'Processing') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_TRANSITION';
        END IF;

        -- 2. restore stock
        UPDATE variant v
            JOIN order_item oi ON oi.variant_id = v.variant_id
            SET v.stock_quantity = v.stock_quantity +oi.quantity
        WHERE oi.order_id = p_order_id
            AND oi.out_of_stock_flag = FALSE;
    
        -- 3. cancel the order
        UPDATE orders SET order_status = 'Cancelled' WHERE order_id = p_order_id;

        -- 4. resolve the payment
        UPDATE payment
            SET payment_status = IF(payment_status = 'Paid', 'Refunded', 'Cancelled')
        WHERE order_id =p_order_id
            AND payment_status IN ('Pending', 'Paid', 'Failed');

        -- 5. audit (staff only)
        IF EXISTS (SELECT 1 FROM staff WHERE user_id = p_actor_user_id) THEN
            INSERT INTO admin_audit_log (actor_user_id, action, entity_type, entity_id)
            VALUES (p_actor_user_id, 'status_change', 'orders', p_order_id);
        END IF;


    COMMIT;
END;
