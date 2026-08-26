# Table ownership

Who owns each table, and which migration creates it. If you need a column on
someone else's table, ask them — don't add it yourself.

| Table | Owner | Migration |
|---|---|---|
| user, customer, staff | M1 | 001 |
| address, city | M1 | 001 |
| product, category, product_category | M2 | 002 |
| variant, variant_attribute, attribute_value | M2 | 002 |
| cart, cart_item | M3 | 003 |
| orders, order_item | M4 | 004 |
| delivery, stock_adjustment | M4 | 004 |
| payment | M5 | 005 |

## Conventions
- Table and column names: `snake_case`, singular table names except `orders`
  (`order` is a MySQL reserved word).
- Every table has an `INT AUTO_INCREMENT` surrogate PK named `<table>_id`.
- Money: `DECIMAL(10,2)`. Never `FLOAT`.
- Timestamps: `TIMESTAMP`, default `CURRENT_TIMESTAMP` where it means "created".
- All tables `ENGINE=InnoDB` — required for foreign keys and row-level locking.
- Foreign keys always named `fk_<table>_<referenced>`.
