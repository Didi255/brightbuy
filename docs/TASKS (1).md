# BrightBuy — Task Plan

**How to use this:** find your person number (P1–P5), then work down your column stage by stage.
Do not start Stage N+1 until the whole team has cleared Stage N.

Reference: `SCHEMA.md` (column names) · `API.md` (JSON shapes) · `UI-GUIDE.md` (styling, routes)

---

# Who is who

| | Slice | Assigned |
|---|---|---|
| **P1** | Core Infrastructure & Order Transaction | Taken |
| **P2** | Catalogue & Search | Pick at kickoff |
| **P3** | Cart, Checkout & UI Foundation | Pick at kickoff |
| **P4** | Accounts & Access | Pick at kickoff |
| **P5** | Payments, Staff Console & Reports | Pick at kickoff |

P1 carries the shared infrastructure and the order transaction — the largest load and the
highest-risk SQL. **P2–P5 are balanced against each other**: each has roughly one migration,
8–12 endpoints, 4–5 screens, and one seed or shared asset.

---

# The blocking chain — read this before anything else

The database has a dependency chain, because foreign keys point at real tables:

```
002 catalogue  ──►  003 cart          (cart_item → variant)
               └─►  004 orders        (order_item → variant)
                          └─────────►  005 payment  (payment → orders)
```

**So the strict order is: P2 → P1 → P5.** P3 also waits on P2.

That would leave three people idle, so at every stage each person has **unblocked work** to do
while waiting. That's what the tables below are for: every column has something in it, always.

**Three people must finish specific things early or the team stalls:**

| Who | What | Everyone waiting |
|---|---|---|
| **P1** | `middleware/auth.js` + `errorHandler.js` + `api/client.js` | P2, P3, P4, P5 |
| **P2** | `002_catalogue.sql` — the `variant` table | P1, P3 |
| **P3** | `theme.js` + `StatusBadge` + `Money` + `ErrorAlert` | P1, P2, P4, P5 |

These are the first thing each of those three does. Not "in the first week" — **first**.

---

# Stage 0 — Kickoff decisions

One 2-hour meeting. **No code before this.**

| # | Decide | Why it can't wait |
|---|---|---|
| 0.1 | Everyone's environment runs (green banner, in the room) | A broken setup discovered later costs days |
| 0.2 | Styling library — Mantine / MUI / React-Bootstrap / plain CSS | Changing it later means rewriting every screen |
| 0.3 | Route map confirmed (`UI-GUIDE.md` §2) | Five people's screens must link to each other |
| 0.4 | Slices P2–P5 assigned | Everything depends on it |
| 0.5 | Icon set — one, not several | Mixed icon sets look unfinished |
| 0.6 | Open items at the bottom of `API.md` | Shapes are binding once agreed |
| 0.7 | Wireframes sketched on paper, photographed, committed | Prevents a Stage 4 argument about layout |

Agenda is in `BrightBuy-Project-Guide.md` §5. P1 records 0.2 and 0.5 in `DECISIONS.md` afterwards.

---

# Stage 1 — Unblock the team

**Roughly 3–4 days. This is the only stage where order within the stage matters.**

Everyone works in parallel. Nobody is blocked, because none of these tasks need another
person's table.

| | Task | Blocking? |
|---|---|---|
| **P1** | 1. Finish `middleware/auth.js` — `requireAuth`, `optionalAuth`, `requireRole` | **YES — push day 1–2** |
| | 2. Finish `errorHandler.js` + `ApiError.js`, matching `API.md` exactly | **YES** |
| | 3. Finish `client/src/api/client.js` — attaches JWT, unwraps error envelope | **YES** |
| **P2** | 1. `SELECT VERSION();` — report to group if below 8.0.16 (`CHECK` silently ignored) | |
| | 2. Write `002_catalogue.sql` — all 7 tables, all constraints | **YES — push day 2–3** |
| | 3. Verify with `SHOW CREATE TABLE variant;` that constraints exist | |
| | 4. Add ~8 sample products so others have data | |
| **P3** | 1. Install the styling library chosen at kickoff | |
| | 2. Write `theme.js` including the `statusColors` map | **YES — push day 1–2** |
| | 3. Build `StatusBadge`, `Money`, `ErrorAlert` | **YES** |
| | 4. Build `AppShell`, `Navbar`, `PageHeader` | |
| **P4** | 1. Write `01_cities_users.js` — 6 main cities, ~15 other cities | **YES — push day 2–3** |
| | 2. Seed 3 staff (one per role) and ~20 customers with addresses | |
| | 3. Make it idempotent (`INSERT IGNORE`) so re-running is safe | |
| **P5** | 1. Write out the five report queries **on paper** against `SCHEMA.md` | |
| | 2. Write `03_demo_orders.js` structure — orders across all four quarters | |
| | 3. Read `sp_place_order`'s intended behaviour with P1 so you know what data appears | |

### Order within Stage 1

```
Day 1-2:  P1 ships infra ──┐
          P3 ships theme ──┤
                           ├──► everyone else can now build UI and use auth
Day 2-3:  P2 ships 002 ────┤
          P4 ships seeds ──┘
Day 3-4:  P1 writes 004 (needs 002)
          P3 writes 003 (needs 002)
Day 4:    P5 writes 005 (needs 004)
```

**Stage 1 checkpoint:** every migration runs on a **fresh** database
(`docker compose down -v && docker compose up -d && npm run migrate && npm run seed`). If it
fails on a fresh database it will fail for the evaluator.

---

# Stage 2 — Backend

**Roughly 1 week. Everyone works fully in parallel — no blocking.** No React this stage.

Test everything with curl or Thunder Client. Screens come later.

| | Tasks |
|---|---|
| **P1** | 1. `fn_estimate_delivery_days(city_id, has_oos)` — 5 or 7 days, +3 (REQ-7.1, 7.2, 7.5)<br>2. `sp_place_order` **without locking** — validate, decrement, insert `orders` + `order_item` + `delivery`, mark cart converted<br>3. **Post the exact signature in the group chat** — P3 is blocked without it<br>4. Test success from the MySQL CLI<br>5. Test failure — order more than exists, confirm **nothing** was written<br>6. Test back-order — `stock_quantity = 0` allowed, flagged, estimate extended<br>7. Confirm Store Pickup gets a `delivery` row with `address_id` NULL, `city_id` set<br>8. Build `POST /auth/register` and `POST /auth/login` |
| **P2** | 1. `GET /products` — keyword + category + brand + price filters, paginated<br>2. Return `priceFrom`/`priceTo` across variants<br>3. `GET /products/:productId` — variants with attributes and computed `inStock`<br>4. `GET /categories` — nested tree<br>5. `POST/PUT/DELETE /admin/products` — deactivate, never delete<br>6. `POST/PUT/DELETE /admin/categories`<br>7. `POST/PUT /admin/variants` — reject duplicate SKU clearly |
| **P3** | 1. `GET /cart` — by JWT customer, or `X-Cart-Session` for guests<br>2. `POST /cart/items` — **sum quantities on duplicate**, `INSERT ... ON DUPLICATE KEY UPDATE`<br>3. `PATCH /cart/items/:id`, `DELETE /cart/items/:id`<br>4. Compute `lineTotal`, `itemCount`, `subtotal`, `hasOutOfStockItems` server-side<br>5. Cart merge on login — claim by token, fold in existing customer cart<br>6. `GET /checkout/summary` — cart + delivery mode + city + P1's estimate |
| **P4** | 1. `GET /me`, `PUT /me`<br>2. `GET /me/addresses`, `POST /me/addresses`<br>3. `GET /cities` — public, for the checkout dropdown<br>4. `GET/POST/PATCH /admin/cities` behind `requireRole('admin')`<br>5. `GET /admin/users`, `PATCH /admin/users/:id` — roles, deactivation (REQ-10.5) |
| **P5** | 1. `sp_report_quarterly_sales(year)` — revenue and count per quarter, excluding cancelled<br>2. `sp_report_top_products(from, to, limit)`<br>3. **Verify both by hand** — count one quarter manually and check the procedure agrees<br>4. Mock gateway: `POST /payments/card` with `mockOutcome: "success"\|"failure"`<br>5. COD flow — status `'Pending'` at placement<br>6. `PATCH /admin/payments/:id` — mark COD paid, record `staff_id` + timestamp |

**Everyone, once during this stage:** write 8 products with variants in your own file under
`database/seeds/products/`. P2 assembles them into the 40-product seed. Include some with
`stock_quantity = 0`.

**Stage 2 checkpoint:** every endpoint returns correct JSON via curl. `CALL sp_place_order(...)`
works from the MySQL CLI.

---

# Stage 3 — Customer screens

**Roughly 1 week. Fully parallel.** This stage ends at the milestone that decides your timeline.

| | Tasks |
|---|---|
| **P1** | 1. Add `SELECT ... FOR UPDATE` with **`ORDER BY variant_id`** — consistent lock ordering prevents deadlocks<br>2. `sp_cancel_order` — restore stock, set `'Cancelled'`<br>3. `POST /checkout/confirm` — calls `sp_place_order`, maps insufficient stock to 409<br>4. `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`<br>5. Order history screen `/orders`<br>6. Order detail screen `/orders/:orderId` with status timeline<br>7. Cancel button, visible only while status is `'Placed'` |
| **P2** | 1. Home page — category tree, search bar<br>2. Product listing with cards (name, image, price range, tags)<br>3. Filter sidebar — category, brand, price range<br>4. Pagination<br>5. "No results found" state<br>6. Product detail page<br>7. Variant selector that **live-updates price and stock**<br>8. Quantity input rejecting zero, negative, non-numeric |
| **P3** | 1. `CartContext` and navbar badge from `itemCount`<br>2. Cart page — attributes, unit price, quantity editor, line total, running total<br>3. Out-of-stock warning without removing the item<br>4. Checkout: delivery mode → address (Standard only) → payment method<br>5. Order summary with estimated delivery date **before** confirmation<br>6. Wire `POST /checkout/confirm`<br>7. Handle 409 — return to cart with affected items identified<br>8. Order confirmation page |
| **P4** | 1. Finish `AuthContext` — persist user across reloads<br>2. `ProtectedRoute` plus a `requireStaff` variant<br>3. Register page with field-level validation<br>4. Login page — vague error, never revealing which credential failed<br>5. Navbar auth state — name, logout, staff link<br>6. Profile page<br>7. Address book — list, add, set default |
| **P5** | 1. `POST /payments/:id/retry`<br>2. The 24-hour job — cancel unpaid `Failed` card payments via P1's `sp_cancel_order`<br>3. Nodemailer stub logging to console<br>4. Payment screen `/orders/:orderId/pay`<br>5. `sp_report_category_orders()`<br>6. `sp_report_upcoming_deliveries()`<br>7. `sp_report_customer_summary(customer_id)` |

**Stage 3 checkpoint — the one that matters:**

> **A customer can place an order in the browser.**
> Browse → add to cart → register → checkout → confirm → see it in order history.

If you reach this on schedule you will finish comfortably. **If you don't, extend the timeline
now** rather than compressing later stages.

---

# Stage 4 — Staff screens and reports

**Roughly 1 week. Fully parallel.**

| | Tasks |
|---|---|
| **P1** | 1. Write `tests/concurrency.test.js` — variant at `stock_quantity = 1`, 20 parallel checkouts<br>2. Run it. Exactly one must succeed<br>3. **Screenshot the passing run** — 19 rollbacks, stock at exactly 0<br>4. Verify all three layers block negative stock: `CHECK`, trigger, procedure<br>5. Test cancellation restores stock |
| **P2** | 1. Staff catalogue screen — list, create, edit, deactivate products<br>2. Category management including parent assignment<br>3. Variant management — attributes, price, SKU, stock<br>4. Assemble everyone's product files into the 40-product / 10-category seed |
| **P3** | 1. Test every exception path in SRS §4.5.2<br>2. Confirm abandoning checkout changes no stock, creates no order<br>3. Verify guest-cart merge in all combinations: empty, existing, overlapping variants<br>4. Add loading/empty/error states to every list in the app |
| **P4** | 1. Staff city management `/staff/cities` — toggle `is_main_city`, add cities<br>2. Staff user management `/staff/users` — list, assign roles, deactivate<br>3. Verify no `/staff/*` route is reachable by a customer account |
| **P5** | 1. `GET /admin/orders` — filters on status, payment status, mode, date range<br>2. `PATCH /admin/orders/:id/status` — enforce the transition table, reject invalid moves<br>3. Staff order console `/staff/orders`<br>4. `POST /admin/stock-adjustments` + screen — record staff, timestamp, reason<br>5. Reporting dashboard `/staff/reports` — five tabs, parameter forms, tables<br>6. One or two Recharts charts<br>7. Cross-check all five reports by hand against the seed |

**Everyone:** test *someone else's* slice and file issues. You'll find things they can't see.

**Stage 4 checkpoint:** staff flows work end to end. All five reports return numbers verified by
hand.

---

# Stage 5 — Hardening and delivery

**Roughly 4–7 days.**

| | Tasks |
|---|---|
| **P1** | 1. Re-run the concurrency harness after any late change<br>2. Assemble the traceability matrix from everyone's PR descriptions<br>3. Prepare to walk the group through `sp_place_order` line by line |
| **P2** | 1. `EXPLAIN` the search query, add `idx_product_name`, `EXPLAIN` again — record both<br>2. Verify search returns within 3 seconds<br>3. Regenerate the ER diagram from the real schema |
| **P3** | 1. Verify checkout completes within 5 seconds<br>2. **Consistency pass** — walk every screen in one sitting, file issues for anything inconsistent<br>3. Check each page at mobile width; fix horizontal overflow |
| **P4** | 1. Security pass — confirm no endpoint that should be protected is open; list it in the report<br>2. Query the `user` table directly, confirm no plaintext password<br>3. Fresh-clone test — new folder, follow the README, green banner in under 10 minutes |
| **P5** | 1. Write `006_indexes.sql` — for **each** index: `EXPLAIN`, add, `EXPLAIN` again<br>2. Build the before/after timing table for the report<br>3. Verify all five reports return within 8 seconds |

**Everyone:** demo script rehearsed. Mock viva — each member questioned on *someone else's*
slice.

---

# Load comparison

| | Migrations | Endpoints | Screens | Shared asset |
|---|---|---|---|---|
| P1 | 004, 007, 009 | 6 | 2 | Auth middleware, error envelope, API client |
| P2 | 002 | 10 | 5 | Product seed assembly |
| P3 | 003 | 6 | 4 | Theme + UI kit + layout |
| P4 | — (uses 001) | 11 | 6 | Cities & users seed |
| P5 | 005, 006, 008 | 10 + 5 procs | 4 | Demo orders seed |

P4 has no migration of its own but the most endpoints and screens. P5 has fewer screens but the
five report procedures. P2's single migration is the largest in the project (7 tables). P3's UI
kit is used by everyone.

P1 carries the shared infrastructure plus `sp_place_order`, which is why it's larger.

---

# Rules that apply to everyone

1. **SQL only in `*.repo.js`.** A query in a controller gets the PR rejected.
2. **Placeholders (`?`) always**, never string concatenation.
3. **Names come from `SCHEMA.md` and `API.md`.** Never invent one locally — raise it in the chat.
4. **Migrations are append-only.** Claim your number in the chat before creating the file.
5. **Every PR lists its REQ-IDs.** Your traceability matrix then writes itself.
6. **Verify on a fresh database** before any PR touching schema.
7. **Never make schema changes in Workbench.** Workbench is for reading only.
8. **Stuck over 30 minutes?** Post what you're doing, the exact error, and what you've tried.
9. **Blocked over a day?** Pair with whoever is blocking you.

---

# Meetings

- **Monday, 15 min** — finished / doing / blocked
- **Thursday, 30 min** — merge `dev`, everyone pulls, fix breakage together
- **Friday, 45 min** — each member demos and **explains their SQL to the group**

The Friday session is how all five of you pass the viva instead of one. It's the first thing
teams drop when busy and the thing they most regret dropping.

---

# Things that will bite you

1. **`orders`, not `order`** — reserved word in MySQL.
2. **Never join historical orders to `variant.price`** — use `order_item.unit_price_at_order`.
   Same for addresses: use `delivery.address_snapshot`.
3. **ENUM strings are exact** — `'Placed'` not `'placed'`, `'cod'` not `'COD'`.
4. **`CHECK` needs MySQL 8.0.16+** — below that it's parsed and silently ignored.
5. **Every order gets a `delivery` row**, Store Pickup included, or Report 4 breaks.
6. **`cart.customer_id` is nullable** — don't assume a cart has a customer.
7. **Money is `DECIMAL(10,2)` in SQL, a string in JSON** — floats lose cents.
8. **`ORDER BY variant_id` before `FOR UPDATE`** — inconsistent lock ordering causes deadlocks
   that only appear under concurrency.
