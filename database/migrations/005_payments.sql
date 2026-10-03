-- =========================================================================
-- 005 — Payments                                           OWNER: M5
--
-- payment           payment_id PK, order_id FK,
--                   payment_method ENUM('cod','card'),                      (REQ-8.1)
--                   payment_status ENUM('Pending','Paid','Failed','Refunded'),
--                   gateway_ref VARCHAR(100) NULL,                          (REQ-8.4)
--                   staff_id FK NULL,   -- who marked COD paid              (REQ-11.3)
--                   created_at, updated_at
--                   UNIQUE (order_id)   -- exactly one payment per order    (BR-5)
--
-- Card numbers and CVV are NEVER stored. Only gateway_ref.            (REQ-8.3)
-- Depends on 004 (orders) and 001 (staff).
-- =========================================================================

CREATE TABLE payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('cod', 'card') NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    gateway_ref VARCHAR(100) NULL,
    staff_id INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_payment_order UNIQUE (order_id),
    CONSTRAINT fk_payment_orders FOREIGN KEY (order_id) REFERENCES orders(order_id),
    CONSTRAINT fk_payment_staff FOREIGN KEY (staff_id) REFERENCES staff(user_id)
) ENGINE=InnoDB;

CREATE TABLE stock_adjustment (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    staff_id INT NOT NULL,
    change_qty INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stockadj_variant FOREIGN KEY (variant_id) REFERENCES variant(variant_id),
    CONSTRAINT fk_stockadj_staff FOREIGN KEY (staff_id) REFERENCES staff(user_id)
) ENGINE=InnoDB;