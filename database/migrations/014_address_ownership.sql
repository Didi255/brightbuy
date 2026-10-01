

-- Migration 014: Add customer ownership to addresses
-- Allows a customer to own multiple saved addresses.

ALTER TABLE address
    ADD COLUMN customer_id INT NULL,
    ADD CONSTRAINT fk_address_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(user_id)
        ON DELETE SET NULL;