-- =========================================================================
-- 007 — Order procedures                                   OWNER: M4
--
-- STAGED. This migration ships two of the three routines:
--   fn_estimate_delivery_days   (REQ-7.1, 7.2, 7.5)   - done
--   sp_place_order              (REQ-6.1-6.3)         - done, with FOR UPDATE
--
-- Still to come, in a later migration (a routine can only be changed by a new
-- migration doing DROP + CREATE, since migrations are append-only):
--   sp_cancel_order                                   (REQ-9.4, 8.5)
--   the payment row INSERT inside sp_place_order      (DECISIONS #22)
-- Both wait on 005 (payment), which is not written yet.
--
-- =========================================================================

DROP FUNCTION IF EXISTS fn_estimate_delivery_days;


CREATE FUNCTION fn_estimate_delivery_days(
  p_city_id INT, -- city_id
  p_has_oos BOOLEAN -- TRUE if ANY item in the order is out of stock
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_is_main BOOLEAN;
    DECLARE v_total_days INT;

    SELECT is_main_city INTO v_is_main FROM city WHERE city_id =p_city_id;

    -- Determine base delivery days based on city type and null handles
    IF v_is_main IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unknown city_id'; -- handles null city
    END IF;
    IF v_is_main THEN
        SET v_total_days = 5;
    ELSE
        SET v_total_days = 7; -- not main cities
    END IF;

    -- Add additional days if the product is out of stock
    IF p_has_oos THEN
        SET v_total_days = v_total_days + 3;
    END IF;

    RETURN v_total_days;

 END;
 
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


        -- 6. mark cart converted
        UPDATE cart SET cart_status = 'converted' WHERE cart_id = p_cart_id;

        SET p_status = 'OK';

    COMMIT;
END;




