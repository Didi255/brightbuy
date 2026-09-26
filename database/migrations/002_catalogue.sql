-- =========================================================================
-- 002 — Catalogue                                           OWNER: M2
--
-- TODO(M2). Create, following the conventions of 001:
--   category            category_id PK, category_name, is_active,
--                       parent_category_id NULL self-FK               (REQ-10.2)
--   product             product_id PK, product_name, product_description,
--                       image_url, brand, is_active
--   product_category    PRIMARY KEY (product_id, category_id)         <- composite
--   variant             variant_id PK, product_id FK, SKU, price,
--                       stock_quantity, is_active
--                       UNIQUE (SKU)                                  (REQ-10.3)
--                       CHECK (price > 0)
--                       CHECK (stock_quantity >= 0)                   (REQ-6.3)
--   variant_attribute   attribute_id PK, name          e.g. 'Colour'
--   attribute_value     value_id PK, attribute_id FK, variant_id FK, value
--                       UNIQUE (variant_id, attribute_id)
--
-- Note: MySQL 8.0.16+ enforces CHECK constraints. Confirm your version with
--   SELECT VERSION();   -- anything below 8.0.16 parses but ignores CHECK.
-- =========================================================================

CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    parent_category_id INT NULL,

    FOREIGN KEY (parent_category_id) REFERENCES category(category_id)
) ENGINE=InnoDB;

CREATE TABLE product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    image_url VARCHAR(2083),
    brand VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE product_category (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),

    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (category_id) REFERENCES category(category_id)
) ENGINE=InnoDB;

CREATE TABLE variant (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    SKU VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE=InnoDB;