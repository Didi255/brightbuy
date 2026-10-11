# BrightBuy — Implementation Decisions & Deviations

The SRS and ER diagram were submitted on 28/07/2026. During implementation planning we
identified points where the submitted design could not be built as drawn, or where the SRS was
internally inconsistent. Rather than silently diverging, each deviation is recorded here with
its justification.

The submitted documents remain the baseline. This file records what was built and why.

---

## A. Schema deviations from the submitted ER diagram

### #1 — `order` renamed to `orders`
**Submitted:** entity named `order`.
**Built:** table named `orders`.
**Why:** `ORDER` is a reserved word in MySQL (it begins `ORDER BY`). Using it requires
backtick-quoting in every statement, and a single omission produces a syntax error that is
tedious to trace. Renaming removes an entire class of avoidable bugs.

### #2 — Composite primary key on `product_category`
**Submitted:** `product_id`, `category_id`, no key declared.
**Built:** `PRIMARY KEY (product_id, category_id)`.
**Why:** without it the junction table permits duplicate rows, which would double-count
categories in Report 3 (REQ-12.3). The composite key is the standard resolution of a
many-to-many relationship.

### #3 — `UNIQUE` on `variant.SKU`
**Submitted:** SKU with no uniqueness constraint.
**Built:** `UNIQUE KEY uq_variant_sku (SKU)`.
**Why:** REQ-10.3 requires warehouse-wide SKU uniqueness enforced *at the database level*. The
submitted diagram states the requirement but does not model the constraint.

### #4 — `UNIQUE` on `user.email`
**Submitted:** email with no uniqueness constraint.
**Built:** `UNIQUE KEY uq_user_email (email)`.
**Why:** REQ-4.2 requires rejecting duplicate registrations. Enforcing this only in application
code leaves a race condition between two simultaneous registrations.

### #5 — `CHECK (stock_quantity >= 0)` plus trigger
**Submitted:** `stock_quantity INT`, unconstrained.
**Built:** `CHECK` constraint and `trg_variant_stock_no_negative`.
**Why:** REQ-6.3 requires that stock can never go negative. The `CHECK` is the structural
guarantee; the trigger raises a clear message via `SIGNAL`. Belt and braces, since `CHECK` is
silently ignored below MySQL 8.0.16.

### #6 — `UNIQUE (cart_id, variant_id)` on `cart_item`
**Submitted:** no constraint; the same variant could appear twice in one cart.
**Built:** unique key on the pair.
**Why:** REQ-3.4 requires duplicate additions of the same variant to merge into a single line by
summing quantities. The constraint makes the rule structural rather than a convention the
application must remember.

### #7 — `city_id` added to `delivery`
**Submitted:** destination city reachable only via `delivery.address_id → address.city_id`.
**Built:** `city_id` stored directly on `delivery`.
**Why:** Store Pickup orders have no delivery address (REQ-5.2) but still need a city for the
delivery estimate (REQ-7.5) and for Report 4 (REQ-12.4), which lists destination city per order.
Without this column, pickup orders cannot appear in Report 4.

### #8 — `brand` added to `product`
**Submitted:** no brand attribute.
**Built:** `brand VARCHAR(50)` on `product`.
**Why:** REQ-1.3 requires filtering search results by brand. The attribute was specified in the
requirements but omitted from the diagram.

### #9 — Every order has a `delivery` row
**Submitted:** implied, not stated.
**Built:** `sp_place_order` always inserts a `delivery` row, with `address_id` NULL for Store
Pickup.
**Why:** REQ-7.6 requires the estimated delivery date to be persisted with the order, and the
diagram places that column on `delivery`. If pickup orders had no delivery row they would carry
no estimate and vanish from Report 4.

### #10 — `updated_at` on `payment`
**Submitted:** `updated_at` present but purpose unstated.
**Built:** `ON UPDATE CURRENT_TIMESTAMP`, used to compute the 24-hour card-payment retry window.
**Why:** REQ-8.5 / BR-7 require automatic cancellation 24 hours after a failed payment. That
needs a reliable "when did this last change" timestamp.

### #11 — `admin_audit_log` table added
**Submitted:** no audit entity. The ERD models `stock_adjustment` (stock changes only) and
`payment.staff_id` (COD receipts only).
**Built:** `admin_audit_log` — actor, action, entity, entity_id, before/after values, timestamp —
written by middleware on every staff mutation. Migration `010`.
**Why:** §5.3 requires that *"all significant administrative activities shall be logged for
auditing purposes"* and §5.4 lists Auditability as a quality attribute. The two existing
mechanisms cover only their own narrow cases, leaving catalogue edits, order status changes,
role assignments and city changes untraceable.

### #12 — Views added
**Submitted:** no views.
**Built:** `v_order_details` (orders joined to customer, delivery, city and payment) and
`v_variant_stock` (variant joined to product with a computed `in_stock` flag). Migration `012`.
**Why:** the five reports and the staff console otherwise repeat the same six-table join, which
is error-prone and harder to review. Views also let read-only staff be granted access to report
data without any privilege on the underlying tables — see #13. Views are core course material
(L05).

### #13 — Database-level roles and privileges added
**Submitted:** not modelled. Access control was specified only at application level (REQ-10.5,
§5.3), enforced by JWT.
**Built:** MySQL roles `brightbuy_readonly`, `brightbuy_staff`, `brightbuy_app` with `GRANT` and
`REVOKE`, including a column-level grant on `orders.order_status`. Migration `013`.
**Why:** defence in depth, and `GRANT`/`REVOKE`/roles are examinable course material (L08,
Authorization). Reporting staff receive `SELECT` on the views only, demonstrating that a
privilege on a view implies no privilege on its underlying tables.
**Scope note:** a demonstration, not a production security model — the application still
connects as `brightbuy_app`.

### #24 — Customer ownership added to `address`

**Submitted:** `customer.address_id` references a single `address` row, but `address`
has no reference back to the customer who owns it.

**Built:** migration `014` adds nullable `address.customer_id`, with a foreign key to
`customer.user_id` using `ON DELETE SET NULL`. `customer.address_id` is retained as
the customer's default delivery address.

**Why:** the API requires customers to have an address book through
`GET /me/addresses` and `POST /me/addresses`. Without an ownership relationship,
multiple address rows cannot be safely associated with a customer, and an
`address_id` supplied during checkout cannot be verified as belonging to the
authenticated customer.

Making `customer_id` nullable allows an address row to remain when its customer is
removed. `ON DELETE SET NULL` removes the ownership relationship without deleting
the address row or invalidating other references to that address, such as
`delivery.address_id`.
---

## B. Design decisions taken where the SRS was silent

### #14 — Guest carts are database-backed
**Question:** REQ-3.5 permits guests to build a cart, but the submitted diagram has
`cart.customer_id` as a non-nullable foreign key, so no cart can exist without a customer.

**Decision:** `cart.customer_id` is nullable, and `session_token VARCHAR(64)` is added. A guest
cart is keyed by a random token held in browser storage. On login the cart is claimed —
`customer_id` set, `session_token` cleared — and merged with any pre-existing customer cart.

**Rejected alternative:** hold guest carts entirely in browser storage, creating a database row
only at login. This preserves the submitted schema exactly but splits cart logic across two
implementations, and prices cached client-side can go stale.

**Rationale:** keeping all cart behaviour in one place reduces the chance of divergent bugs, and
the guest-to-customer merge is enforceable in SQL. Orphaned guest carts will accumulate; a
cleanup job is out of scope for phase 1.

### #15 — Delivery addresses are snapshotted
**Question:** `delivery.address_id` references a mutable `address` row. If a customer edits
their address, every past order would retrospectively claim delivery to the new address, and
Report 4 would silently change its historical output.

**Decision:** `address_snapshot VARCHAR(255)` is added to `delivery` and populated at order
confirmation. `address_id` is retained as a nullable reference for convenience.

**Rejected alternative:** treat `address` rows as immutable, inserting a new row on edit.

**Rationale:** consistency with REQ-5.7, which already requires snapshotting unit price at order
time for exactly the same reason. The principle applied throughout is that anything which must
survive later edits is copied onto the order at confirmation. The rejected alternative places
the guarantee in application convention rather than in the schema, where a single careless
`UPDATE` would break it silently.

### #16 — The catalogue migration is split across two files
**Question:** `002_catalogue.sql` originally created all seven catalogue tables. Two other
slices are blocked on the `variant` table, making that single file the largest schedule risk in
the project.

**Decision:** `002` creates only `category`, `product`, `product_category`, and `variant` — the
tables other slices depend on. `011` adds `variant_attribute` and `attribute_value`, which
nothing else waits on.

**Rationale:** unblocks two team members roughly two days earlier at no cost to the final schema.
Migrations are append-only, so splitting is free; merging later would not have been.

### #21 — A stock shortfall must be total, not partial

**Question:** REQ-6.2 requires stock validation at order time and REQ-6.6 requires
out-of-stock items to be flagged, but the planning documents disagree on what happens when
a cart line exceeds available stock. `BrightBuy-Team-Plan.md` §6 Stage 2 says
"`stock_quantity = 0` **allowed**, flagged, estimate extended" and two lines later "order
**more than exists**, confirm nothing was written". For a line requesting 1 unit of a variant
with 0 in stock, both rules apply and they contradict each other.

**Decision:** three cases, evaluated per order line.

| Condition | Behaviour |
|---|---|
| `stock_quantity >= quantity` | Decrement stock. `out_of_stock_flag = FALSE` |
| `stock_quantity = 0` | Accept as a back-order. `out_of_stock_flag = TRUE`, **no decrement**, `fn_estimate_delivery_days` adds 3 days |
| `0 < stock_quantity < quantity` | **Reject the whole order.** `sp_place_order` signals; `POST /checkout/confirm` maps it to 409 `INSUFFICIENT_STOCK` |

In one sentence: **a shortfall must be total, not partial.**

**Rejected alternative — partial fulfilment.** Shipping what is available and back-ordering
the remainder is the commercially normal behaviour, and is **not expressible in schema v1**:

1. `order_item.out_of_stock_flag` is a per-line `BOOLEAN`. It can record "this line was out
   of stock" but not "1 of 3 shipped, 2 pending". There is no `quantity_fulfilled` column.
2. `delivery.order_id` is `UNIQUE` (#9) — exactly one delivery per order. Partial fulfilment
   requires two shipments, therefore two delivery rows.
3. `order_status` has five values (REQ-9.2); none represents partial fulfilment.

Implementing it would require a new column, dropping a `UNIQUE` constraint that Report 4
(REQ-12.4) depends on, and a sixth status value — a substantial change to a frozen schema.

**Rationale:** the chosen rule is the only one schema v1 can represent faithfully.
`out_of_stock_flag`'s definition in `SCHEMA.md` is "**was stock 0** at order time" — not
"was stock insufficient" — so the zero case is precisely what the column was designed to
record. The 409 path already exists in `API.md` for the partial case.

**Known wrinkle, accepted:** a customer may back-order a variant with 0 in stock, but may
not back-order one with 1 in stock when ordering 3. That is arbitrary from the customer's
point of view, and falls out of the boolean flag rather than from business logic. Accepted
for phase 1; partial fulfilment is recorded as a phase-2 exclusion (§F).

**Consequence for `sp_place_order`:** validation and the decrement are **per line**, not per
order, and the procedure must evaluate **every** line before writing anything — one partial
shortfall rejects the entire transaction.

### #22 — `sp_place_order` creates the `payment` row, inside the transaction

**Question:** `payment.order_id` is `UNIQUE` (BR-5), so exactly one payment row exists per
order — but nothing stated who creates it. `sp_place_order` already accepts
`p_payment_method` and did not use it. The two candidates were the procedure itself, or
slice C's `POST /checkout/confirm` inserting it after the `CALL` returns.

**Decision:** `sp_place_order` inserts it, inside the same transaction as the order:

```sql
INSERT INTO payment (order_id, payment_method) VALUES (p_order_id, p_payment_method);
```

One statement, because `payment_status` already defaults to `'Pending'` (SCHEMA.md §005).

**Rejected alternative — the endpoint inserts it after the `CALL`.** This leaves a window
between the order committing and the payment row being written. An application crash,
timeout or bug in that window produces **an order that cannot be paid for**: no payment row,
so no gateway attempt, no retry (`POST /payments/:id/retry` is keyed on a payment id that
would not exist), and nothing in the system reports an error. Every row involved is
individually valid; only the set is wrong — the same class of silent inconsistency that
`sp_place_order`'s transaction exists to prevent. Inside the transaction the window does not
exist: order and payment appear together or neither does.

**Rationale** — four independent indications, all pre-dating this decision:

1. `BrightBuy-Team-Plan.md` §6 Stage 2 (slice E) already specifies *"COD flow — status
   `'Pending'` **at placement**"*. Placement is order time.
2. `POST /payments/:id/retry` (API.md) is keyed on a payment id, so the row must exist
   before any payment attempt — i.e. from placement.
3. `payment.order_id` is `UNIQUE`. A uniqueness constraint implies a single owner for
   creation; two code paths creating it invites a duplicate-key failure under load.
4. `p_payment_method` was already in the `007` stub signature, so the original design
   intended the procedure to use it.

**Division of ownership that follows:**

| Action | Owner |
|---|---|
| **Create** the `payment` row, status `'Pending'` | `sp_place_order` (A) |
| **Update** it — `POST /payments/card`, retry, admin COD-paid | slice E |
| Insert nothing; one `CALL` and no cleanup on failure | slice C |

**Consequence for the migration order:** `007` now references `payment`, so **`005` must
merge before `007`**. `005` is numerically earlier, so no renumbering is needed, and the
dependency chain becomes `002 → 004 → 005 → 007`. Locking and `sp_cancel_order` need
nothing from `005`, so work on `007` continues meanwhile; the payment insert is added last.

### #23 — The store's city is configuration, not schema

**Question:** `delivery.city_id` is `NOT NULL` for every order including Store Pickup (#9,
REQ-6.7), and the `007` specification requires that *"store pickup passes a main-city id"*
(REQ-7.5) so that pickup always takes the 5-day branch of `fn_estimate_delivery_days`. But
**nothing in schema v1 records where the store is** — there is no `store` table and no
store-location flag. Something has to supply that `city_id`.

**Decision:** a single configuration value, `STORE_CITY_ID`, read from the environment and
passed as `p_city_id` by `POST /checkout/confirm` when `deliveryMode = 'store_pickup'`. It
must name a city with `is_main_city = TRUE`, and the server asserts this at startup —
refusing to boot on a missing or non-main city rather than silently producing 7-day pickup
estimates.

**Rejected alternatives:**

- **A `store` table** (`store_id`, `name`, `city_id`, `address_id`). Correct modelling and
  the right answer for multiple branches, but §2.5.1 scopes phase 1 to a single store, so
  this adds a table outside the frozen schema to hold **one row that never changes**.
  Recorded as a phase-2 item (§F).
- **An `is_store_location` flag on `city`.** Requires altering `001`, which is already
  merged, and "a store is here" is a fact about the business rather than about the city.
- **Using the customer's own city.** Wrong, and it breaks REQ-7.5: a customer in a non-main
  city collecting from a main-city store would receive a **7-day** pickup estimate. The
  function would return a plausible but incorrect answer, with nothing to indicate a fault.

**Rationale:** `sp_place_order` already accepts `p_city_id` as a parameter — the procedure
does not resolve the destination city for standard delivery either, so the caller resolving
it for pickup is consistent with the existing contract rather than a special case. The value
is referenced by a foreign key, so a `STORE_CITY_ID` naming a nonexistent city fails loudly
on insert; the startup assertion catches the subtler case of a city that exists but is not a
main city.

**Action required:** `STORE_CITY_ID` must be added to `.env.example` so every member sets it.

### #25 — Cancelling an order resolves its payment row; `payment_status` gains `'Cancelled'`

**Question:** `sp_cancel_order` sets `orders.order_status = 'Cancelled'`, but nothing specified
what happens to that order's `payment` row. The original ENUM was
`'Pending' | 'Paid' | 'Failed' | 'Refunded'` (SCHEMA.md §005) — **none of which describes a
payment that will now never be collected.** A cancelled cash-on-delivery order would sit at
`'Pending'` indefinitely.

**Decision — two parts.**

1. `payment_status` gains a fifth value, **`'Cancelled'`**, by `ALTER TABLE` in a later
   migration. `005` is merged and untouched. SCHEMA.md §005 is updated to match.
2. `sp_cancel_order` resolves the payment row **in the same transaction**:

| `payment_status` was | Becomes |
|---|---|
| `'Paid'` | **`'Refunded'`** — money moved and must come back |
| `'Pending'` or `'Failed'` | **`'Cancelled'`** — nothing was ever collected |
| already `'Refunded'`/`'Cancelled'` | unchanged |

**Rejected alternative — leave it `'Pending'` and have every reader join `orders`.** This was
the cheaper option: one extra `AND o.order_status <> 'Cancelled'` clause in slice E's queries.
Rejected because **data that requires a join to interpret correctly will eventually be
interpreted incorrectly.** A row reading `'Pending'` on a dead order is simply false, and the
only thing preventing a wrong answer is every future reader remembering the filter. One
omission in the COD console sends staff to collect money for an order that does not exist.

**Rejected alternative — `'Refunded'` for every cancellation.** Records a refund that never
happened for every cash-on-delivery order, because no money ever moved. Slice E's reports
would show refunds against orders nobody paid for.

**Rationale:** the payment row becomes self-describing — no join is needed to know whether a
payment is collectable.

**Consequences for slice E:**
- exclude `'Cancelled'` from the COD collection console
- exclude it from `POST /payments/:id/retry` — a cancelled payment must not be retryable
- any report reading `payment_status` must handle a fifth value rather than assuming four

**Timing:** done now because there is no production data. Once cancelled orders exist, adding
the value requires a backfill.

### #26 — `sp_cancel_order` writes the audit row, and only for staff actors

**Question:** `sp_cancel_order(IN p_order_id, IN p_actor_user_id)` accepts an actor, but the
original design gave it nowhere to go — `orders` has no `cancelled_by` column. Meanwhile
`admin_audit_log` (#11) is written by middleware on staff mutations. So either the procedure
records the cancellation, the middleware does, or nobody does.

**Decision:** the procedure writes it, inside the same transaction, and only when the actor is
a member of staff:

```sql
INSERT INTO admin_audit_log (actor_user_id, action, entity_type, entity_id)
SELECT p_actor_user_id, 'status_change', 'orders', p_order_id
  FROM staff
 WHERE user_id = p_actor_user_id;
```

**Rationale:**

1. **Atomicity** — the same argument as #22. Middleware writing the row *after* the call leaves
   a window in which a crash produces a cancelled order with no audit trail.
2. **Coverage** — customer self-cancellation (REQ-9.4) never passes through staff middleware,
   so middleware-only auditing would miss it entirely. The procedure covers every caller: the
   customer endpoint and slice E's 24-hour auto-cancel job (REQ-8.5 / BR-7).
3. **Scope** — §5.3 requires *administrative* activity to be logged. A customer cancelling
   their own order is not administrative, so it is not written to `admin_audit_log`; it is
   recorded by `orders.order_status = 'Cancelled'` itself.

**On the `INSERT … SELECT … FROM staff` form:** the `WHERE` does the branching. A staff actor
matches one row and one audit entry is written; a customer matches none, so zero rows are
inserted — no error and no `IF`. The same technique resolves the payment row in #25.

`p_actor_user_id` is therefore used rather than accepted and ignored, which was the
alternative and would have left a parameter in a published signature doing nothing.

---

## C. Technology and tooling decisions

### #17 — Mantine chosen as the component library
**Question:** the frontend could use a component library, a utility CSS framework, or
hand-written CSS. The lecturer has stated the UI should be at a professional level.

**Decision:** Mantine, configured through a single `theme.js` shared by the whole team.

**Rejected alternatives:** MUI (heavier, more configuration); React-Bootstrap (dated default
aesthetic); Tailwind (utility classes still permit five people to diverge); hand-written CSS
(most work, least consistency).

**Rationale:** with a four-week schedule and a team new to React, hand-rolling accessible
components is not a realistic route to a professional result, and the assessment weight of this
project is on the database. A component library gives consistent, accessible components by
default, and reduces the shared UI-kit task from building primitives to configuring a theme and
writing three thin wrappers.

### #18 — Payment gateway is mocked
Card payments run through a mock adapter, not a live payment service provider. The adapter
interface is written so a real gateway could be substituted without touching business logic.
Consistent with §2.5.1 (phase-1 deployment scope). Card numbers and security data are never
stored (REQ-8.3); only the gateway reference is persisted.

### #19 — `log_bin_trust_function_creators` enabled in Docker

**Question:** `CREATE FUNCTION` fails with `ERROR 1419 (HY000): You do not have the SUPER
privilege and binary logging is enabled`. MySQL 8 enables binary logging by default, and the
application account `brightbuy` deliberately holds no global privileges — only
`ALL PRIVILEGES ON brightbuy.*`. Without a change, no stored function in `007` can be created
on any team member's machine.

**Decision:** pass `--log-bin-trust-function-creators=1` to the server in `docker-compose.yml`.

**Rejected alternatives:** `SET GLOBAL log_bin_trust_function_creators = 1` — lost on container
restart, and applies only to the machine it was typed on, so four teammates hit the same error
in a file they did not write. Granting `SUPER` to `brightbuy` — a global privilege handed to the
application account purely to work around a configuration default.

**Rationale:** the restriction guards against **replica divergence**. Under statement-based
binary logging a replica re-executes the calling statement, so a non-deterministic function can
compute a different result there and the two databases silently diverge.
`fn_estimate_delivery_days` *is* non-deterministic — it reads `city.is_main_city`, which staff
can edit. But we deploy a single MySQL instance with no replication and no binary-log consumers,
so the failure mode the restriction prevents cannot occur. Setting it in `docker-compose.yml`
rather than at runtime means every member's database is configured identically from a committed
file.

**Note:** the restriction covers stored **functions**, not procedures — a function's result is
baked into the statement that invoked it, whereas a procedure's statements are each logged
individually. `sp_place_order` creates without complaint.

**Action required after pulling:** run `docker compose up -d` to recreate the container.
Pulling alone does not apply a `command:` change.

### #20 — Migration files must not contain `DELIMITER`

**Question:** the conventional way to define a stored routine is to wrap it in
`DELIMITER $$ … END$$ DELIMITER ;`. But migrations are applied by
`server/scripts/run-migrations.js`, which uses the **`mysql2` Node driver** with
`multipleStatements: true` — not the `mysql` command-line client.

**Decision:** routines in `007`, `008` and `009` contain **no `DELIMITER` statements**, and each
routine ends with `END;`.

**Rationale:** verified against the runner's exact driver and options. With `DELIMITER` present,
`npm run migrate` fails with *"You have an error in your SQL syntax … near `'DELIMITER'`"*. With
it removed, the routine is created correctly and behaves identically.

`DELIMITER` is a command of the `mysql` **client**, not of the server. That client splits input
on `;` before sending anything, which would chop a routine into fragments — `DELIMITER` changes
what it splits on. `mysql2` does not split at all: it hands the whole string to the server,
whose own parser handles `BEGIN … END` correctly, because semicolons inside a compound statement
are part of the grammar. The workaround is therefore both unnecessary here *and* invalid SQL.

Local prototyping through the real client (`Get-Content x.sql | docker exec -i … mysql …`) still
**requires** `DELIMITER`. A scratch file and its migration counterpart legitimately differ by
those lines; this is not an inconsistency to tidy up.

**Still to verify:** a single migration file containing *several* routines. `007` has three.

**Supersedes** the instruction in the `007_procedures_orders.sql` stub comment, which said the
opposite and has been corrected.

---

### #27 — The interface is redesigned as "Circuit Noir"; the design skill is rewritten to match

**Date:** 2026-10-10 · **Raised by:** M4 (team lead) · **Affects:** every screen

The original visual direction — light surfaces, soft shadows, two competing
accents (blue and orange), Inter for everything — produced a competent but
forgettable build. Nine home-page sections shared one centred rhythm, cards had
no character, and nothing read as *the* action colour.

**Decision.** The interface moves to a dark, engineered direction called
Circuit Noir, defined by six rules:

1. **One accent.** Amber `#FF8C00` only. Blue survives *solely* inside
   `StatusBadge`, where colour carries semantic meaning, never as decoration.
2. **Borders, not shadows.** `1px solid rgba(255,255,255,0.08)` replaces every
   `shadow`. Elevation comes from border brightness and background lift.
3. **Mono for data.** Prices, SKUs, stock counts, order IDs, spec values and
   section eyebrows are JetBrains Mono. Prose and UI chrome stay Inter.
4. **Display type is a graphic.** Headings run 40–120px in Space Grotesk,
   left-aligned. No heading above 40px is ever centred.
5. **Asymmetry by default.** Adjacent sections never share a shape.
6. **Motion is mechanical.** 150–250ms on `cubic-bezier(0.2, 0, 0, 1)`.
   Nothing bounces, nothing floats.

**Consequence for the design skill.** `.claude/skills/design-system/SKILL.md`
previously mandated the opposite — *"restraint reads as professional"*, light
surfaces, shadows over borders, no gradients. Leaving both in the repository
would mean two committed design specifications contradicting each other, which
is worse than either one alone. The skill has been rewritten to state Circuit
Noir. Its rules on spacing scale, the four states, forms, tables, microcopy and
accessibility are unchanged, because those were never the problem.

**Contrast constraint, which is not negotiable.** Amber on `ink.9` passes AA
for large text but **fails for body text at 14px**. Amber is therefore for
headings, numerals, icons, borders and button fills only, and text on an amber
fill is always **black** — white on amber is 2.3:1. Body copy is `ink.0` or
`ink.2`. `ink.3` (`#7D8699`) exists specifically because `ink.4` fails contrast
for the mono micro-labels the design uses throughout; `ink.4` is for dividers
and disabled states only.

**What was deliberately NOT built.** The direction document specified a
testimonials section, star ratings on every product card, a wishlist, promo
codes and struck-through RRPs. The schema has no `review`, `wishlist`, `promo`
or `rrp` entity, so none of those were implemented with invented data. Rating
markup exists in `ProductCard` but renders only when the API supplies the
fields. This project is assessed on whether the interface reflects its
database; hardcoded figures that contradict the data would be a defect, not
polish.

---

### #28 — The storefront trades in Sri Lanka, not Texas

**Date:** 2026-10-10 · **Raised by:** M4 (team lead) · **Affects:** seeds, `Money`, all copy

The scaffold shipped with Texas demo data — Houston and Dallas as main cities,
US names, `713-555-xxxx` phone numbers and USD prices. BrightBuy is a
University of Moratuwa project; the demo data should read as a Sri Lankan
shop.

**Decision.** The seed data and all user-facing copy are localised:

| | |
|---|---|
| Main cities (REQ-7.3, 5-day) | Colombo, Kandy, Galle, Jaffna, Negombo, Kurunegala |
| Other cities (7-day) | 15 more, at least one per province |
| `STORE_CITY_ID` | 1 = Colombo, still a main city as the server asserts |
| Customers | 20 Sri Lankan names across Sinhala, Tamil, Muslim and Burgher communities |
| Phone numbers | real `07x` mobile prefixes |
| Addresses | real thoroughfares in the matching city, so the address snapshot reads plausibly |
| Currency | LKR. `Money` renders `Rs. 231,990.00` |

**Prices were rescaled, not just relabelled.** Catalogue prices were USD
($14.90–$1,499). Simply changing the symbol would have printed "Rs. 749.99"
for a laptop, which is absurd in context. All 74 variant prices were converted
at ~310 LKR and rounded to figures a Sri Lankan shop would actually print
(ending in 90), giving a Rs. 4,490 – Rs. 464,990 range. A Dell Inspiron 15 now
reads Rs. 231,990 / 278,990 / 324,990.

**This does not touch the schema.** `city.is_main_city`, the DECIMAL(10,2)
money type and `fn_estimate_delivery_days` are unchanged — only the rows
differ. The 5/7/+3 rule was re-verified after the change: Colombo 5, Matara 7,
Kandy with a back-order 8, Badulla with a back-order 10.

**Consequence for the team.** Every customer login email changed, because the
names did. `admin@brightbuy.com` and the three staff logins are unchanged. The
database must be rebuilt (`docker compose down -v`, `npm run migrate`,
`npm run seed`) — the old Texas rows and USD prices cannot be migrated in
place, and nothing depends on them.

---

## D. SRS inconsistencies and the reading implemented

The SRS was submitted on 28/07/2026 and is not being revised. Where the document contradicts
itself, the reading implemented is recorded here.

| § | Inconsistency | Implemented |
|---|---|---|
| §4 intro vs §3.3 | §4 says "Flask backend"; §3.3 says Node.js + Express | **Node.js + Express**, per §3.3 and §2.4.2. §4 is a drafting error |
| §2.5.2 vs §1.4 / REQ-10.6 | "10 products and 40 variants" vs "at least 40 products across at least 10 categories" | **40+ products, 10+ categories**, per REQ-10.6 and the project brief |
| §5.1 vs REQ-12.6 | Reports within 8 seconds vs within 10 seconds | **8 seconds** — the stricter figure. Meeting it satisfies both |
| §2.6, §5.4 | Cross-reference to "Section 2.7", which does not exist | Read as §2.6, Assumptions and Dependencies |
| §2.5.1 | Refers to Texas as "the main city" | Texas is the state. Main cities are the six listed in REQ-7.3 |
| §2.5.3.IV vs REQ-2.3 | SKU "cannot be used to identify product variants" vs SKU is unique *per variant* | **SKU identifies a variant**, per REQ-2.3 and BR-2 |

---

## E. MySQL dialect constraints

Points where MySQL 8 differs from the SQL standard as taught in lectures. Each affected a design
choice, and each is a likely viva question.

| Standard feature | MySQL 8 | Consequence for BrightBuy |
|---|---|---|
| `GROUP BY CUBE(...)` | **Not supported** | Report 1 uses `GROUP BY ... WITH ROLLUP` instead, with `GROUPING()` to identify the total row |
| `CREATE MATERIALIZED VIEW` | **Not supported** | The views in #12 are ordinary views. A materialised view would be emulated with a summary table refreshed by a trigger or scheduled event |
| `FULL OUTER JOIN` | **Not supported** | Not required here. Would be emulated as `LEFT JOIN ... UNION ... RIGHT JOIN` |
| `CHECK` constraints | Enforced only from **8.0.16** | Below that they are parsed and silently ignored — which is why #5 pairs the `CHECK` with a trigger |
| Window functions (`RANK`, `OVER`) | From **8.0.2** | Report 2 uses `RANK()` and `DENSE_RANK()` |
| `CREATE ROLE` | From **8.0.0** | #13 would not be possible on MySQL 5.7 |

The Docker image is pinned to `mysql:8.0`, so all of the above are available. Team members with a
local MySQL installed for other coursework must confirm with `SELECT VERSION();`.

---

## F. Scope exclusions for phase 1

- **Email notifications:** REQ-8.6 and REQ-11.4 are implemented against a Nodemailer stub that
  logs to console in development. No SMTP credentials are committed.
- **Guest cart cleanup:** orphaned guest carts are not purged. Noted under #14.
- **Delivery cost:** out of scope per §2.6; only estimated delivery *time* is modelled.
- **Database-level access control:** #13 demonstrates `GRANT`/`REVOKE`/roles rather than
  implementing a full production security model. Application-level authorisation via JWT remains
  the primary enforcement mechanism (REQ-10.5).
- **Multiple store locations:** phase 1 has one store, whose city is the `STORE_CITY_ID`
  configuration value (#23). A `store` table with its own city and address is a phase-2 item,
  needed only when pickup can happen at more than one branch.
- **Partial fulfilment:** an order line is either fully available or entirely back-ordered; a
  partial shortfall is rejected rather than split across two shipments. Schema v1 cannot
  represent a partly-fulfilled line — see #21 for the three blocking constraints. Shipping what
  is in stock and back-ordering the remainder is a phase-2 item requiring a
  `quantity_fulfilled` column, a relaxed `uq_delivery_order`, and an additional
  `order_status` value.