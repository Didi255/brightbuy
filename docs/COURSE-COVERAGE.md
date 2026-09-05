# BrightBuy — Course Topic Coverage

Maps CS3043 lecture material (L05 Intermediate SQL, L08 Advanced SQL) to where it
appears in this project.

Two uses. **During the build:** tells you which SQL construct to reach for.
**For the viva:** every row is something you may be asked to point at and explain.

---

## Summary

| Topic | Lecture | Where in BrightBuy | Status |
|---|---|---|---|
| Joins (inner) | L05 | Every report, `GET /products/:id` | ✅ |
| **Outer joins** | L05 | Customer summary — customers with zero orders | ⬜ **Add** |
| **Views** | L05 | `v_order_details`, `v_variant_stock` | ⬜ **Add** |
| Integrity constraints | L05 | `UNIQUE`, `CHECK`, `NOT NULL`, FKs — every migration | ✅ |
| Referential integrity | L05 | All FKs, `ON DELETE` behaviour | ✅ |
| Transactions / ACID | L05, L08 | `sp_place_order` | ✅ |
| Indexing | L05 | `006_indexes.sql` + before/after timings | ✅ |
| Prepared statements | L08 | mysql2 `?` placeholders, every repo file | ✅ |
| SQL injection prevention | L08 | Same — and the report should say so explicitly | ✅ |
| Transaction control | L08 | `START TRANSACTION` / `COMMIT` / `ROLLBACK` | ✅ |
| Stored procedures | L08 | `sp_place_order`, `sp_cancel_order`, 5 report procs | ✅ |
| SQL functions | L08 | `fn_estimate_delivery_days` | ✅ |
| Procedural constructs | L08 | `IF`/`WHILE` inside procedures | ✅ |
| Exception handling | L08 | `DECLARE EXIT HANDLER`, `SIGNAL SQLSTATE '45000'` | ✅ |
| Triggers (row-level) | L08 | `trg_variant_stock_no_negative` | ✅ |
| **Window functions** | L08 | `RANK()` in top-selling products | ⬜ **Add** |
| **`WITH ROLLUP`** | L08 | Quarterly sales subtotals | ⬜ **Add** |
| **Authorization** | L08 | MySQL roles + `GRANT` / `REVOKE` | ⬜ **Add** |
| JDBC / ODBC / SQLJ | L08 | Java-specific — N/A. We use `mysql2` for Node, same prepared-statement principle | N/A |
| OLAP / data cubes | L08 | Explicitly out of scope per the slides | N/A |

---

## The five additions

### 1. Views — Owner: E, migration `012_views.sql`

L05 covers views at length and the project currently has none. Two earn their
place:

```sql
-- v_order_details: the join every report and the staff console needs
CREATE VIEW v_order_details AS
SELECT o.order_id, o.order_date, o.order_status, o.total_amount,
       u.first_name, u.last_name, u.email,
       d.delivery_mode, d.estimated_delivery_date, c.city_name, c.is_main_city,
       p.payment_method, p.payment_status
FROM orders o
JOIN customer cu ON cu.user_id = o.customer_id
JOIN user u      ON u.user_id  = cu.user_id
JOIN delivery d  ON d.order_id = o.order_id
JOIN city c      ON c.city_id  = d.city_id
LEFT JOIN payment p ON p.order_id = o.order_id;   -- LEFT: payment may not exist yet
```

```sql
-- v_variant_stock: product + variant + stock, used by catalogue and reports
CREATE VIEW v_variant_stock AS
SELECT v.variant_id, v.SKU, v.price, v.stock_quantity,
       (v.stock_quantity > 0) AS in_stock,
       p.product_id, p.product_name, p.brand
FROM variant v
JOIN product p ON p.product_id = v.product_id
WHERE v.is_active = TRUE AND p.is_active = TRUE;
```

**Viva point:** MySQL does **not** support materialised views. L05 mentions them;
be ready to say MySQL has no `CREATE MATERIALIZED VIEW` and that you would emulate
one with a summary table refreshed by a trigger or scheduled event.

### 2. Window functions — Owner: E, in `008_procedures_reports.sql`

Report 2 (top-selling products) is exactly what `RANK()` is for.

```sql
SELECT
    p.product_id,
    p.product_name,
    SUM(oi.quantity)                        AS quantity_sold,
    SUM(oi.quantity * oi.unit_price_at_order) AS revenue,
    RANK()       OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank,
    DENSE_RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS dense_sales_rank
FROM order_item oi
JOIN variant v ON v.variant_id = oi.variant_id
JOIN product p ON p.product_id = v.product_id
JOIN orders  o ON o.order_id   = oi.order_id
WHERE o.order_status <> 'Cancelled'
  AND o.order_date BETWEEN p_from AND p_to
GROUP BY p.product_id, p.product_name
ORDER BY sales_rank
LIMIT p_limit;
```

**Viva point:** include both `RANK()` and `DENSE_RANK()` so you can explain the
difference — `RANK()` leaves gaps after a tie (1, 1, 3), `DENSE_RANK()` does not
(1, 1, 2). Window functions need MySQL 8.0.2+; run `SELECT VERSION();` to confirm.

Optional extra: a moving average of daily sales using
`AVG(...) OVER (ORDER BY order_date ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)`.
Nice if there's time, not required.

### 3. `WITH ROLLUP` — Owner: E, Report 1

Quarterly sales with an automatic annual total row:

```sql
SELECT
    QUARTER(o.order_date) AS quarter,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(o.total_amount)        AS total_revenue,
    GROUPING(QUARTER(o.order_date)) AS is_total_row
FROM orders o
WHERE YEAR(o.order_date) = p_year
  AND o.order_status <> 'Cancelled'
GROUP BY QUARTER(o.order_date) WITH ROLLUP;
```

The extra row where `is_total_row = 1` is the year total. In the UI, render it as a
bold "Total" row rather than showing `NULL`.

**Viva point — worth knowing:** the slides teach `CUBE`, but **MySQL does not
implement `CUBE`**. Only `WITH ROLLUP`. `GROUPING()` is available in MySQL 8.0.1+
and distinguishes a rollup `NULL` from a real one. Being able to say "we used
ROLLUP because MySQL has no CUBE" is a strong answer.

### 4. Outer joins — Owner: E, Report 5

Customer summary must include customers who have never ordered, otherwise it
silently hides them:

```sql
SELECT
    u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    COUNT(o.order_id)              AS order_count,
    COALESCE(SUM(o.total_amount),0) AS total_spent,
    SUM(CASE WHEN p.payment_status = 'Pending' THEN 1 ELSE 0 END) AS pending_payments
FROM customer cu
JOIN user u       ON u.user_id  = cu.user_id
LEFT JOIN orders o  ON o.customer_id = cu.user_id      -- LEFT: keeps zero-order customers
LEFT JOIN payment p ON p.order_id    = o.order_id
GROUP BY u.user_id, customer_name;
```

**Viva point:** MySQL has no `FULL OUTER JOIN` — L05 asks how to emulate it. The
answer is `LEFT JOIN ... UNION ... RIGHT JOIN`. Know it even though this project
doesn't need one.

### 5. Database-level authorization — Owner: D, migration `013_roles.sql`

The project uses JWT roles in the application, but L08 covers `GRANT`, `REVOKE`,
and SQL roles — enforcement **inside the database**. Adding a small version
demonstrates defence in depth.

```sql
CREATE ROLE IF NOT EXISTS brightbuy_readonly, brightbuy_staff, brightbuy_app;

-- reporting staff: read-only
GRANT SELECT ON brightbuy.v_order_details TO brightbuy_readonly;
GRANT SELECT ON brightbuy.v_variant_stock TO brightbuy_readonly;

-- operational staff: read plus controlled writes
GRANT brightbuy_readonly TO brightbuy_staff;
GRANT UPDATE (order_status)   ON brightbuy.orders  TO brightbuy_staff;
GRANT UPDATE (payment_status) ON brightbuy.payment TO brightbuy_staff;

-- the application account: DML plus the right to call procedures
GRANT SELECT, INSERT, UPDATE, DELETE ON brightbuy.* TO brightbuy_app;
GRANT EXECUTE ON brightbuy.* TO brightbuy_app;
```

**Viva points:**
- MySQL 8 supports roles; MySQL 5.7 did not
- Column-level `GRANT UPDATE (order_status)` shows privileges can be finer than
  table-level
- Granting `SELECT` on a **view** without granting it on the underlying tables is
  exactly the encapsulation point L08 makes
- `WITH GRANT OPTION` allows privilege transfer; `REVOKE ... CASCADE` removes
  dependent privileges too

Keep this small. It's a demonstration, not a production security model — the app
still connects as `brightbuy_app`.

---

## Things you already do — say so in the report

Easy marks people forget to claim.

**Prepared statements.** Every query uses `?` placeholders through `mysql2`. L08
spends two slides on the `X' or 'Y' = 'Y` injection example. Put a paragraph in
the report showing a repo query and explaining that values are sent separately from
the statement, so input can never be parsed as SQL. Show the dangerous version and
say why you didn't write it.

**Transaction control.** L08 covers `setAutoCommit(false)` then explicit commit or
rollback. `sp_place_order` is that idea inside the database. Explain why the
transaction lives in the procedure rather than in JavaScript: fewer round trips,
and the guarantee holds even if a different client calls it.

**Exception handling.** `DECLARE EXIT HANDLER FOR SQLEXCEPTION` and
`SIGNAL SQLSTATE '45000'` are straight off the L08 slides. Point at them.

**Triggers, and when not to use them.** L08 has a whole slide on when triggers are
the wrong tool. You use exactly one, for an invariant the database must enforce.
Saying "we deliberately used only one trigger, because summary data belongs in
views and cascading triggers are hard to reason about" is a better answer than
having five.

---

## Version requirements

Run `SELECT VERSION();` before relying on any of these:

| Feature | Minimum |
|---|---|
| `CHECK` constraints enforced | 8.0.16 |
| Window functions (`RANK`, `OVER`) | 8.0.2 |
| `GROUPING()` | 8.0.1 |
| Roles (`CREATE ROLE`) | 8.0.0 |
| Common table expressions (`WITH`) | 8.0.1 |

Below 8.0.16, `CHECK` is **parsed and silently ignored** — the constraint appears
to exist but does nothing. The Docker image pins 8.0, so this is fine, but say it
at the viva if asked why the trigger duplicates the `CHECK`.

---

## New migrations from this document

| File | Owner | Contents |
|---|---|---|
| `012_views.sql` | E | `v_order_details`, `v_variant_stock` |
| `013_roles.sql` | D | Roles, `GRANT`, `REVOKE` demonstration |

Both are small. Reports (008) should be rewritten to select from the views rather
than repeating the joins.
