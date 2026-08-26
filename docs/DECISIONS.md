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

---

## B. Design decisions taken where the SRS was silent

### #11 — Guest carts are database-backed
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

### #12 — Delivery addresses are snapshotted
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

---

## C. SRS inconsistencies and the reading implemented

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

## D. Scope exclusions for phase 1

- **Payment gateway:** card payments run through a mock adapter, not a live PSP. The adapter
  interface is written so a real gateway could be substituted without touching business logic.
  Consistent with §2.5.1 (phase-1 deployment scope).
- **Email notifications:** REQ-8.6 and REQ-11.4 are implemented against a Nodemailer stub that
  logs to console in development. No SMTP credentials are committed.
- **Guest cart cleanup:** orphaned guest carts are not purged. Noted under #11.
- **Delivery cost:** out of scope per §2.6; only estimated delivery *time* is modelled.
