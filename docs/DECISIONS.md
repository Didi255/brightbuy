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