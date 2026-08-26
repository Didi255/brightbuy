# BrightBuy — Schema v1 (FROZEN)

This is the agreed database schema. **Column names here are binding.** If you need a column
that isn't listed, or a name that differs, raise it in the group chat before writing the
migration — don't invent one locally.

Deviations from the submitted ER diagram are recorded in `DECISIONS.md`.

---

## Conventions

- `snake_case` for tables and columns.
- Surrogate PK on every table: `INT AUTO_INCREMENT`, named `<table>_id`.
- Money is `DECIMAL(10,2)`. **Never `FLOAT`** — floating point loses cents.
- Timestamps are `TIMESTAMP`; `created_at` defaults to `CURRENT_TIMESTAMP`.
- `ENGINE=InnoDB` on every table — required for foreign keys and `SELECT ... FOR UPDATE`.
- Foreign keys named `fk_<table>_<referenced>`; unique keys `uq_<table>_<columns>`.
- Booleans are `BOOLEAN` (MySQL stores as TINYINT(1)).

**ENUM values are case-sensitive and exact.** They appear in SQL, API responses, and React
conditionals. A mismatch between `'Placed'` and `'placed'` is a silent bug. Copy them from here.

---

## Ownership

| Migration | Owner | Tables |
|---|---|---|
| 001 | M1 | `city`, `address`, `user`, `customer`, `staff` |
| 002 | M2 | `category`, `product`, `product_category`, `variant`, `variant_attribute`, `attribute_value` |
| 003 | M3 | `cart`, `cart_item` |
| 004 | M4 | `orders`, `order_item`, `delivery`, `stock_adjustment` |
| 005 | M5 | `payment` |

`schema_migrations` is created automatically by the migration runner. Don't touch it.

---

## 001 — Identity & locations (M1)

### `city`
| Column | Type | Notes |
|---|---|---|
| `city_id` | INT PK AI | |
| `city_name` | VARCHAR(50) NOT NULL | `UNIQUE` |
| `is_main_city` | BOOLEAN NOT NULL DEFAULT FALSE | REQ-7.3. Drives the 5-day vs 7-day rule |

### `address`
| Column | Type | Notes |
|---|---|---|
| `address_id` | INT PK AI | |
| `city_id` | INT NOT NULL | FK → `city` |
| `house_num` | VARCHAR(50) NULL | |
| `address_1` | VARCHAR(100) NOT NULL | |
| `address_2` | VARCHAR(100) NULL | |
| `address_3` | VARCHAR(100) NULL | |

### `user`
| Column | Type | Notes |
|---|---|---|
| `user_id` | INT PK AI | |
| `first_name` | VARCHAR(50) NOT NULL | |
| `last_name` | VARCHAR(50) NOT NULL | |
| `email` | VARCHAR(100) NOT NULL | **`UNIQUE`** — REQ-4.2 |
| `password_hash` | VARCHAR(255) NOT NULL | bcrypt. Plaintext never stored (REQ-4.3) |
| `user_type` | ENUM NOT NULL | `'customer'`, `'staff'` |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

### `customer`
| Column | Type | Notes |
|---|---|---|
| `user_id` | INT PK | FK → `user`, ON DELETE CASCADE |
| `address_id` | INT NULL | FK → `address`. Default delivery address |
| `phone` | VARCHAR(20) NULL | |

### `staff`
| Column | Type | Notes |
|---|---|---|
| `user_id` | INT PK | FK → `user`, ON DELETE CASCADE |
| `role` | ENUM NOT NULL | `'admin'`, `'major_exec'`, `'minor_exec'`, `'labour'` |

---

## 002 — Catalogue (M2)

### `category`
| Column | Type | Notes |
|---|---|---|
| `category_id` | INT PK AI | |
| `category_name` | VARCHAR(100) NOT NULL | |
| `parent_category_id` | INT NULL | FK → `category` (self-reference). REQ-10.2 |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | Soft delete — REQ-10.1 |

### `product`
| Column | Type | Notes |
|---|---|---|
| `product_id` | INT PK AI | |
| `product_name` | VARCHAR(100) NOT NULL | Indexed — REQ-1.5 |
| `description` | TEXT NULL | |
| `brand` | VARCHAR(50) NULL | **Not in the submitted ERD** — REQ-1.3 requires brand filtering |
| `image_url` | VARCHAR(2083) NULL | |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | |

### `product_category`
| Column | Type | Notes |
|---|---|---|
| `product_id` | INT NOT NULL | FK → `product` |
| `category_id` | INT NOT NULL | FK → `category` |

`PRIMARY KEY (product_id, category_id)` — composite, no surrogate key.

### `variant`
| Column | Type | Notes |
|---|---|---|
| `variant_id` | INT PK AI | |
| `product_id` | INT NOT NULL | FK → `product` |
| `SKU` | VARCHAR(50) NOT NULL | **`UNIQUE`** — REQ-10.3 |
| `price` | DECIMAL(10,2) NOT NULL | `CHECK (price > 0)` |
| `stock_quantity` | INT NOT NULL DEFAULT 0 | `CHECK (stock_quantity >= 0)` — REQ-6.3 |
| `is_active` | BOOLEAN NOT NULL DEFAULT TRUE | |

### `variant_attribute`
| Column | Type | Notes |
|---|---|---|
| `attribute_id` | INT PK AI | |
| `name` | VARCHAR(50) NOT NULL | e.g. `'Colour'`, `'Storage'`. `UNIQUE` |

### `attribute_value`
| Column | Type | Notes |
|---|---|---|
| `value_id` | INT PK AI | |
| `attribute_id` | INT NOT NULL | FK → `variant_attribute` |
| `variant_id` | INT NOT NULL | FK → `variant` |
| `value` | VARCHAR(100) NOT NULL | e.g. `'Midnight Black'`, `'256GB'` |

`UNIQUE (variant_id, attribute_id)` — a variant has one value per attribute.

---

## 003 — Cart (M3)

### `cart`
| Column | Type | Notes |
|---|---|---|
| `cart_id` | INT PK AI | |
| `customer_id` | INT **NULL** | FK → `customer`. NULL for guest carts — see DECISIONS #11 |
| `session_token` | VARCHAR(64) NULL | Identifies a guest cart. Cleared on login |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `cart_status` | ENUM NOT NULL DEFAULT `'active'` | `'active'`, `'converted'`, `'abandoned'` |

Exactly one of `customer_id` / `session_token` is set at any time.

### `cart_item`
| Column | Type | Notes |
|---|---|---|
| `item_id` | INT PK AI | |
| `cart_id` | INT NOT NULL | FK → `cart`, ON DELETE CASCADE |
| `variant_id` | INT NOT NULL | FK → `variant` |
| `quantity` | INT NOT NULL | `CHECK (quantity > 0)` — REQ-2.6 |

`UNIQUE (cart_id, variant_id)` — duplicate adds merge by summing quantity (REQ-3.4).

---

## 004 — Orders, delivery, stock (M4)

### `orders`
Named `orders`, **not** `order` — see DECISIONS #1.

| Column | Type | Notes |
|---|---|---|
| `order_id` | INT PK AI | |
| `customer_id` | INT NOT NULL | FK → `customer` |
| `order_date` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Indexed — REQ-12.6 |
| `order_status` | ENUM NOT NULL DEFAULT `'Placed'` | see below |
| `total_amount` | DECIMAL(10,2) NOT NULL | Sum of order items at order time |

`order_status` values (REQ-9.2) — **use exactly these strings:**
```
'Placed'  'Processing'  'ReadyOrOut'  'DeliveredOrPicked'  'Cancelled'
```
`'ReadyOrOut'` covers "Ready for Pickup / Out for Delivery"; `'DeliveredOrPicked'` covers
"Delivered / Picked Up". Which wording the UI shows depends on `delivery.delivery_mode`.

Valid transitions (REQ-11.2):
```
Placed → Processing → ReadyOrOut → DeliveredOrPicked
Placed → Cancelled            (customer, REQ-9.4)
Processing → Cancelled        (staff)
```
Anything else is rejected.

### `order_item`
| Column | Type | Notes |
|---|---|---|
| `order_item_id` | INT PK AI | |
| `order_id` | INT NOT NULL | FK → `orders` |
| `variant_id` | INT NOT NULL | FK → `variant` |
| `quantity` | INT NOT NULL | `CHECK (quantity > 0)` |
| `unit_price_at_order` | DECIMAL(10,2) NOT NULL | Snapshot — REQ-5.7. Never join to `variant.price` for historical orders |
| `out_of_stock_flag` | BOOLEAN NOT NULL DEFAULT FALSE | Was stock 0 at order time — REQ-6.6 |

### `delivery`
One row per order, **including Store Pickup** (REQ-7.6).

| Column | Type | Notes |
|---|---|---|
| `delivery_id` | INT PK AI | |
| `order_id` | INT NOT NULL | FK → `orders`. `UNIQUE` |
| `delivery_mode` | ENUM NOT NULL | `'store_pickup'`, `'standard'` |
| `address_id` | INT NULL | FK → `address`. NULL for pickup |
| `address_snapshot` | VARCHAR(255) NULL | Flattened address text — see DECISIONS #12 |
| `city_id` | INT NOT NULL | FK → `city`. Destination city; store's city for pickup. REQ-6.7 |
| `estimated_delivery_date` | DATE NOT NULL | Persisted at confirmation — REQ-7.6. Indexed |
| `delivery_status` | ENUM NOT NULL DEFAULT `'pending'` | `'pending'`, `'dispatched'`, `'delivered'` |
| `status_updated_at` | TIMESTAMP | |

### `stock_adjustment`
Audit trail for manual stock changes (REQ-10.4).

| Column | Type | Notes |
|---|---|---|
| `adjustment_id` | INT PK AI | |
| `variant_id` | INT NOT NULL | FK → `variant` |
| `staff_id` | INT NOT NULL | FK → `staff` |
| `change_qty` | INT NOT NULL | Signed: +50 delivery, −3 damaged |
| `reason` | VARCHAR(255) NOT NULL | |
| `timestamp` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

---

## 005 — Payment (M5)

### `payment`
| Column | Type | Notes |
|---|---|---|
| `payment_id` | INT PK AI | |
| `order_id` | INT NOT NULL | FK → `orders`. **`UNIQUE`** — exactly one payment per order (BR-5) |
| `payment_method` | ENUM NOT NULL | `'cod'`, `'card'` |
| `payment_status` | ENUM NOT NULL DEFAULT `'Pending'` | `'Pending'`, `'Paid'`, `'Failed'`, `'Refunded'` |
| `gateway_ref` | VARCHAR(100) NULL | Gateway transaction reference — REQ-8.4 |
| `staff_id` | INT NULL | FK → `staff`. Who marked COD paid — REQ-11.3 |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Drives the 24h retry window (REQ-8.5) |

**Card numbers, CVV, and expiry are never stored** (REQ-8.3). Only `gateway_ref`.

---

## 006 — Indexes (M5, everyone contributes)

Before adding each index: run `EXPLAIN` on the query, add the index, run `EXPLAIN` again, keep
both outputs. The before/after comparison goes in the final report.

| Index | Table | Column(s) | Supports |
|---|---|---|---|
| `idx_product_name` | `product` | `product_name` | REQ-1.5 search |
| `idx_prodcat_category` | `product_category` | `category_id` | Category listing |
| `idx_orders_date` | `orders` | `order_date` | Reports 1, 2 — REQ-12.6 |
| `idx_orders_customer` | `orders` | `customer_id` | Report 5, order history |
| `idx_orderitem_variant` | `order_item` | `variant_id` | Report 2 |
| `idx_delivery_est_date` | `delivery` | `estimated_delivery_date` | Report 4 |

InnoDB indexes primary keys, unique keys, and foreign keys automatically. Don't duplicate those
— and know which ones they are, because you'll be asked.

---

## 007 / 008 / 009 — Routines

| Routine | Migration | Owner | Purpose |
|---|---|---|---|
| `sp_place_order` | 007 | M4 | The atomic checkout transaction — REQ-6.1–6.3 |
| `sp_cancel_order` | 007 | M4 | Compensating transaction, restores stock — REQ-9.4, 8.5 |
| `fn_estimate_delivery_days` | 007 | M4 | 5 or 7 days, +3 if out of stock — REQ-7.1–7.5 |
| `trg_variant_stock_no_negative` | 009 | M4 | Rejects negative stock — REQ-6.3 |
| `sp_report_quarterly_sales` | 008 | M5 | REQ-12.1 |
| `sp_report_top_products` | 008 | M5 | REQ-12.2 |
| `sp_report_category_orders` | 008 | M5 | REQ-12.3 |
| `sp_report_upcoming_deliveries` | 008 | M5 | REQ-12.4 |
| `sp_report_customer_summary` | 008 | M5 | REQ-12.5 |

---

## Things that will bite you

1. **`orders`, not `order`.** Reserved word. You will type `order` by reflex at least once.
2. **Never join historical orders to `variant.price`.** Use `order_item.unit_price_at_order`.
   Same for addresses — use `delivery.address_snapshot`, not `address`.
3. **ENUM strings are exact.** `'Placed'` not `'placed'`; `'cod'` not `'COD'`.
4. **`CHECK` needs MySQL 8.0.16+.** Below that it's parsed and silently ignored. Run
   `SELECT VERSION();` before relying on it.
5. **Every order gets a `delivery` row**, Store Pickup included. Report 4 breaks otherwise.
6. **`cart.customer_id` is nullable.** Don't assume a cart has a customer.
