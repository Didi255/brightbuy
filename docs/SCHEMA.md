# BrightBuy — Schema v1 (FROZEN)

This is the agreed database schema. **Column names here are binding.** If you need a column
that isn't listed, or a name that differs, raise it in the group chat before writing the
migration — don't invent one locally.

Deviations from the submitted ER diagram are recorded in `DECISIONS.md`.
Lecture topics mapped to these artifacts are in `COURSE-COVERAGE.md`.

---

## Conventions

- `snake_case` for tables and columns.
- Surrogate PK on every table: `INT AUTO_INCREMENT`, named `<table>_id`.
- Money is `DECIMAL(10,2)`. **Never `FLOAT`** — floating point loses cents.
- Timestamps are `TIMESTAMP`; `created_at` defaults to `CURRENT_TIMESTAMP`.
- `ENGINE=InnoDB` on every table — required for foreign keys and `SELECT ... FOR UPDATE`.
- Foreign keys named `fk_<table>_<referenced>`; unique keys `uq_<table>_<columns>`.
- Booleans are `BOOLEAN` (MySQL stores as TINYINT(1)).
- Views are named `v_<thing>`; procedures `sp_<action>`; functions `fn_<action>`;
  triggers `trg_<table>_<rule>`.

**ENUM values are case-sensitive and exact.** They appear in SQL, API responses, and React
conditionals. A mismatch between `'Placed'` and `'placed'` is a silent bug. Copy them from here.

---

## Migration ownership

**Claim your number in the group chat before creating a file.** Migrations are append-only —
once merged, never edited.

| Migration | Owner | Contents |
|---|---|---|
| `001` | **D** | `city`, `address`, `user`, `customer`, `staff` |
| `002` | **B** | `category`, `product`, `product_category`, `variant` — **core catalogue only** |
| `003` | **C** | `cart`, `cart_item` |
| `004` | **A** | `orders`, `order_item`, `delivery` |
| `005` | **E** | `payment`, `stock_adjustment` |
| `006` | **E** | Indexes |
| `007` | **A** | `sp_place_order`, `sp_cancel_order`, `fn_estimate_delivery_days` |
| `008` | **E** | The five report procedures |
| `009` | **A** | `trg_variant_stock_no_negative` |
| `010` | **D** | `admin_audit_log` |
| `011` | **B** | `variant_attribute`, `attribute_value` |
| `012` | **E** | Views — `v_order_details`, `v_variant_stock` |
| `013` | **D** | Roles, `GRANT`, `REVOKE` |

`002` is deliberately split from `011`: A and C are blocked on `variant`, so the four core
tables ship first and attributes follow (DECISIONS #16).

`schema_migrations` is created automatically by the migration runner. Don't touch it.

---

## 001 — Identity & locations (D)

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

## 002 — Core catalogue (B)

Ship these four tables first. A and C cannot start without `variant`.

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
| `brand` | VARCHAR(50) NULL | Not in the submitted ERD — REQ-1.3 requires brand filtering (DECISIONS #8) |
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

---

## 003 — Cart (C)

### `cart`
| Column | Type | Notes |
|---|---|---|
| `cart_id` | INT PK AI | |
| `customer_id` | INT **NULL** | FK → `customer`. NULL for guest carts — DECISIONS #14 |
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

## 004 — Orders & delivery (A)

### `orders`
Named `orders`, **not** `order` — DECISIONS #1.

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
One row per order, **including Store Pickup** (REQ-7.6, DECISIONS #9).

| Column | Type | Notes |
|---|---|---|
| `delivery_id` | INT PK AI | |
| `order_id` | INT NOT NULL | FK → `orders`. `UNIQUE` |
| `delivery_mode` | ENUM NOT NULL | `'store_pickup'`, `'standard'` |
| `address_id` | INT NULL | FK → `address`. NULL for pickup |
| `address_snapshot` | VARCHAR(255) NULL | Flattened address text — DECISIONS #15 |
| `city_id` | INT NOT NULL | FK → `city`. Destination city; store's city for pickup. REQ-6.7 |
| `estimated_delivery_date` | DATE NOT NULL | Persisted at confirmation — REQ-7.6. Indexed |
| `delivery_status` | ENUM NOT NULL DEFAULT `'pending'` | `'pending'`, `'dispatched'`, `'delivered'` |
| `status_updated_at` | TIMESTAMP | |

---

## 005 — Payment & stock adjustments (E)

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

## 010 — Audit log (D)

### `admin_audit_log`
Every staff mutation, written by middleware. Closes the §5.3 / §5.4 auditability requirement
(DECISIONS #11).

| Column | Type | Notes |
|---|---|---|
| `audit_id` | INT PK AI | |
| `actor_user_id` | INT NOT NULL | FK → `user`. Who did it |
| `action` | ENUM NOT NULL | `'create'`, `'update'`, `'delete'`, `'status_change'` |
| `entity_type` | VARCHAR(50) NOT NULL | e.g. `'product'`, `'orders'`, `'city'` |
| `entity_id` | INT NOT NULL | PK of the affected row |
| `before_value` | JSON NULL | Changed fields only, before |
| `after_value` | JSON NULL | Changed fields only, after |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Indexed |

No foreign key on `entity_id` — it points at different tables depending on `entity_type`, so no
single FK is possible. Record that reasoning; it's a likely viva question.

---

## 011 — Variant attributes (B)

Ships after `002`. Nothing else is blocked on it.

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

## 012 — Views (E)

Course material (L05). Reports and the staff console select from these rather than repeating
the joins. Details and full SQL in `COURSE-COVERAGE.md`.

### `v_order_details`
Orders joined to customer, delivery, city, and payment. Uses `LEFT JOIN` on `payment`, since a
payment row may not exist yet.

Exposes: `order_id`, `order_date`, `order_status`, `total_amount`, `first_name`, `last_name`,
`email`, `delivery_mode`, `estimated_delivery_date`, `city_name`, `is_main_city`,
`payment_method`, `payment_status`.

### `v_variant_stock`
Active variants joined to their product, with a computed `in_stock` flag.

Exposes: `variant_id`, `SKU`, `price`, `stock_quantity`, `in_stock`, `product_id`,
`product_name`, `brand`.

**MySQL has no materialised views.** These are ordinary views — be ready to say so.

---

## 013 — Roles and privileges (D)

Course material (L08 Authorization). Demonstrates database-level access control alongside the
application's JWT roles (DECISIONS #13).

| Role | Privileges |
|---|---|
| `brightbuy_readonly` | `SELECT` on the two views only — no privilege on underlying tables |
| `brightbuy_staff` | Inherits readonly, plus column-level `UPDATE` on `orders.order_status` and `payment.payment_status` |
| `brightbuy_app` | `SELECT, INSERT, UPDATE, DELETE` on all tables, plus `EXECUTE` on routines |

The application connects as `brightbuy_app`. The other two demonstrate `GRANT`, `REVOKE`,
role inheritance, and view-level encapsulation. Full SQL in `COURSE-COVERAGE.md`.

---

## 006 — Indexes (E, everyone contributes)

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
| `idx_audit_created` | `admin_audit_log` | `created_at` | Audit log viewer |

InnoDB indexes primary keys, unique keys, and foreign keys automatically. Don't duplicate those
— and know which ones they are, because you'll be asked.

---

## 007 / 008 / 009 — Routines

| Routine | Migration | Owner | Purpose |
|---|---|---|---|
| `sp_place_order` | 007 | A | The atomic checkout transaction — REQ-6.1–6.3 |
| `sp_cancel_order` | 007 | A | Compensating transaction, restores stock — REQ-9.4, 8.5 |
| `fn_estimate_delivery_days` | 007 | A | 5 or 7 days, +3 if out of stock — REQ-7.1–7.5 |
| `trg_variant_stock_no_negative` | 009 | A | Rejects negative stock — REQ-6.3 |
| `sp_report_quarterly_sales` | 008 | E | REQ-12.1. Uses `WITH ROLLUP` + `GROUPING()` |
| `sp_report_top_products` | 008 | E | REQ-12.2. Uses `RANK()` and `DENSE_RANK()` |
| `sp_report_category_orders` | 008 | E | REQ-12.3 |
| `sp_report_upcoming_deliveries` | 008 | E | REQ-12.4 |
| `sp_report_customer_summary` | 008 | E | REQ-12.5. Uses `LEFT JOIN` to keep zero-order customers |

Report SQL demonstrating the window functions and rollup is in `COURSE-COVERAGE.md`.

---

## Things that will bite you

1. **`orders`, not `order`.** Reserved word. You will type `order` by reflex at least once.
2. **Never join historical orders to `variant.price`.** Use `order_item.unit_price_at_order`.
   Same for addresses — use `delivery.address_snapshot`, not `address`.
3. **ENUM strings are exact.** `'Placed'` not `'placed'`; `'cod'` not `'COD'`.
4. **`CHECK` needs MySQL 8.0.16+.** Below that it's parsed and silently ignored. Our Docker
   image runs 8.0.46, so they are enforced — but `SELECT VERSION();` on any local MySQL.
5. **Every order gets a `delivery` row**, Store Pickup included. Report 4 breaks otherwise.
6. **`cart.customer_id` is nullable.** Don't assume a cart has a customer.
7. **Money is `DECIMAL(10,2)` in SQL, a string in JSON.** Floats lose cents.
8. **MySQL has no `CUBE`, no materialised views, no `FULL OUTER JOIN`.** See `DECISIONS.md` §E.