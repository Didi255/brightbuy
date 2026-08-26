-- =========================================================================
-- 001 — Users, staff, customers, addresses, cities        OWNER: M1
--
-- This is the REFERENCE migration. Follow its conventions:
--   * InnoDB everywhere (needed for FKs and SELECT ... FOR UPDATE)
--   * explicit constraint names
--   * UNIQUE / CHECK constraints declared here, not enforced only in code
-- =========================================================================

CREATE TABLE city (
  city_id      INT AUTO_INCREMENT PRIMARY KEY,
  city_name    VARCHAR(50)  NOT NULL,
  is_main_city BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_city_name UNIQUE (city_name)
) ENGINE=InnoDB;

CREATE TABLE address (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  city_id    INT          NOT NULL,
  house_num  VARCHAR(50),
  address_1  VARCHAR(100) NOT NULL,
  address_2  VARCHAR(100),
  address_3  VARCHAR(100),
  CONSTRAINT fk_address_city FOREIGN KEY (city_id)
    REFERENCES city (city_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE user (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,   -- bcrypt output is 60 chars; 255 gives headroom
  user_type     ENUM('customer','staff') NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_email UNIQUE (email)   -- REQ-4.2
) ENGINE=InnoDB;

CREATE TABLE customer (
  user_id    INT PRIMARY KEY,
  address_id INT NULL,                      -- default delivery address
  phone      VARCHAR(20),
  CONSTRAINT fk_customer_user FOREIGN KEY (user_id)
    REFERENCES user (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_address FOREIGN KEY (address_id)
    REFERENCES address (address_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE staff (
  user_id INT PRIMARY KEY,
  role    ENUM('admin','major_exec','minor_exec','labour') NOT NULL,
  CONSTRAINT fk_staff_user FOREIGN KEY (user_id)
    REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
