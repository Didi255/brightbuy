-- =========================================================================
-- 004 — Orders, delivery, stock adjustments                OWNER: M4
--
-- TODO(M4). Create:
--   orders            order_id PK, customer_id FK, order_date, total_amount,
--                     order_status ENUM('Placed','Processing','ReadyOrOut',
--                                       'DeliveredOrPicked','Cancelled')   (REQ-9.2)
--                     NOTE: table is `orders`, NOT `order` — reserved word.
--   order_item        order_item_id PK, order_id FK, variant_id FK, quantity,
--                     unit_price_at_order DECIMAL(10,2)                    (REQ-5.7)
--                     out_of_stock_flag BOOLEAN                            (REQ-6.6)
--   delivery          delivery_id PK, order_id FK,
--                     delivery_mode ENUM('store_pickup','standard'),
--                     address_id FK NULL,       -- NULL for store pickup
--                     city_id FK NOT NULL,      -- resolved dest city       (REQ-6.7)
--                     estimated_delivery_date DATE,                        (REQ-7.6)
--                     delivery_status ENUM(...), status_updated_at
--                     Every order gets a delivery row, pickup included.
--   stock_adjustment  adjustment_id PK, variant_id FK, staff_id FK,
--                     change_qty INT, reason VARCHAR(255), timestamp       (REQ-10.4)
--
-- Depends on 001 (customer, address, city) and 002 (variant).
-- =========================================================================


CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('Placed' , 'Processing' , 'ReadyOrOut' , 'DeliveredOrPicked' , 'Cancelled') NOT NULL DEFAULT 'Placed',
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) References customer(user_id)
) ENGINE = InnoDB;

CREATE TABLE order_item(
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL ,
    unit_price_at_order DECIMAL(10,2) NOT NULL,
    out_of_stock_flag BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) References orders(order_id),
    CONSTRAINT fk_order_item_variant FOREIGN KEY (variant_id) References variant(variant_id),
    CONSTRAINT chk_order_item_quantity CHECK (quantity > 0)
) ENGINE = INNODB;

CREATE TABLE delivery (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    delivery_mode ENUM ('store_pickup', 'standard') NOT NULL,
    address_id INT NULL,
    address_snapshot VARCHAR(255),
    city_id INT NOT NULL,
    estimated_delivery_date DATE NOT NULL,
    delivery_status ENUM ('pending', 'dispatched', 'delivered')  NOT NULL DEFAULT 'pending',
    status_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_delivery_order UNIQUE (order_id),
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) References orders(order_id),
    CONSTRAINT fk_delivery_address FOREIGN KEY (address_id) References address(address_id),
    CONSTRAINT fk_delivery_city FOREIGN KEY (city_id) References city(city_id)
) ENGINE = INNODB;