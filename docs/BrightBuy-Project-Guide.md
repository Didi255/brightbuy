# BrightBuy — Project Guide

Group 13 · University of Moratuwa · CS3043 Database Systems

Everything you need, start to finish. Read §1 → §2 → §3, then pick a slice in §4.

**Stack:** MySQL 8 (Docker) · Node.js + Express · React (Vite) · JWT auth

**Reference documents — read before writing any code:**
- `SCHEMA.md` — every table and column. Names are binding.
- `API.md` — every endpoint and JSON shape. Shapes are binding.
- `DECISIONS.md` — where we deviate from the submitted SRS/ERD, and why.

---

# 1. Setting up your machine

Do this **before** the kickoff. Budget an hour, mostly downloads.

## 1.1 Install

| Tool | Verify | Source |
|---|---|---|
| Node.js v18+ | `node -v` | nodejs.org (LTS) |
| Git | `git --version` | git-scm.com |
| Docker Desktop | `docker --version` | docker.com |

You do **not** need to install MySQL — Docker provides it.

**Windows:** use **Git Bash** for every command here, never Command Prompt or PowerShell.
Right-click inside a folder → "Git Bash Here" (Windows 11: "Show more options" first). Paths are
Unix-style: `D:\projects` → `/d/projects`. Paste with **right-click** or **Shift+Insert**, not
Ctrl+V.

## 1.2 Download the MySQL image early

```bash
docker pull mysql:8.0
```

~250MB. If it fails partway with `unexpected EOF`, run it again — finished layers are cached.
**Do this at home.** Five people pulling this on campus wifi will eat the whole kickoff.

Docker Desktop must be **open** for any `docker` command. An error mentioning
`dockerDesktopLinuxEngine` means only that — launch it and wait for the whale icon to stop
animating.

## 1.3 Clone and configure

```bash
git clone <repo-url>
cd brightbuy
cp .env.example .env
```

`.env` holds machine-specific settings and is **never committed**. `.env.example` is the
committed template.

## 1.4 Pick your port

Only one program can hold a port. If you already have MySQL installed for other coursework, it
holds **3306** and Docker will fail.

Check (Command Prompt):
```
netstat -ano | findstr :3306
```

**Nothing printed** → free, change nothing.

**Something printed** → either stop your local MySQL (Windows key → "services" → `MySQL80` →
Stop), or keep both: in `docker-compose.yml` change `"3306:3306"` to `"3307:3306"` and set
`DB_PORT=3307` in `.env`.

Since `.env` isn't committed, **everyone chooses independently**. Yours needn't match anyone's.

## 1.5 Start the database

```bash
docker compose up -d
docker compose logs -f mysql
```

Wait for **`ready for connections`** — it appears twice, the second is real. MySQL takes 20–40
seconds to initialise; connecting early gives confusing errors. `Ctrl+C` stops the log view, not
the container.

The `brightbuy` database and user are created automatically. No `CREATE DATABASE` needed.

## 1.6 Build the schema and run

```bash
cd server && npm install && npm run migrate && npm run dev
```
```bash
# second terminal
cd client && npm install && npm run dev
```

Open **http://localhost:5173**. A **green banner** means you're done.

## 1.7 What the banner proves

```
React (browser) → Vite proxy → Express route → mysql2 pool → MySQL (Docker)
```

Five hops. Every feature in this project is that chain with different SQL in the middle. When
something breaks, ask **which hop failed** — don't stare at the whole system.

## 1.8 Common problems

| Symptom | Cause |
|---|---|
| `dockerDesktopLinuxEngine ... cannot find the file` | Docker Desktop isn't open |
| `port is already allocated` | §1.4 port conflict |
| `ECONNREFUSED` on migrate | MySQL not ready, or wrong `DB_PORT` |
| `ER_ACCESS_DENIED_ERROR` | `.env` doesn't match `docker-compose.yml` |
| `Cannot find module 'x'` | No `npm install` in that folder |
| Red banner | Server terminal crashed — go read it |
| `bash: command not found` | You're in PowerShell; use Git Bash |

**Read the error before doing anything else.** It almost always names the problem. Re-running a
command hoping it changes is the biggest time-waster in this project.

## 1.9 Your reset button

```bash
docker compose down -v      # deletes container AND data
docker compose up -d        # wait for "ready for connections"
cd server && npm run migrate && npm run seed
```

Under a minute back to known-good. Use it freely. It's also a real test — if a fresh rebuild
fails, your migrations are broken.

---

# 2. How we work

## 2.1 The single most important rule

**Everyone has their own database on their own laptop.** Nothing is shared at runtime.

What's shared is the *recipe* — `database/migrations/*.sql` and `database/seeds/*.js`. When
someone pushes a migration, you get their tables by running it, not by connecting to them.

> **If a schema change matters, it goes in a migration file.
> If you make it by hand in Workbench, it exists only on your machine.**

This is how student groups break. Someone adds a column through a GUI, their code works, they
push, four teammates get "unknown column" errors. **Workbench is for reading only** — inspecting
data, testing a SELECT, checking what a procedure did. Never for changing structure.

Same for test data. Need orders to develop a page? Put them in a seed file so your reviewer can
reproduce what you see.

## 2.2 Every day, before you start

```bash
docker compose up -d              # Docker Desktop open first
git checkout dev && git pull
cd server && npm run migrate      # pick up teammates' new tables
npm run dev
```

If someone added a library, `npm install` too.

## 2.3 Every piece of work

```bash
git checkout dev && git pull
git checkout -b feat/<yoursurname>/<what>
# ... work ...
git add . && git commit -m "feat(cart): merge duplicate variant additions"
git push -u origin feat/<yoursurname>/<what>
```

Then open a PR targeting **`dev`**, never `main`.

**Every PR description lists the REQ-IDs it satisfies** — `Implements REQ-3.4, REQ-3.7`. Do this
every time and your final report's traceability matrix writes itself. Skip it and you'll spend a
day in week 5 reconstructing it from memory.

Every PR needs one approving review from another member.

## 2.4 Migrations are append-only

Once merged, **a migration is frozen**. Editing it does nothing on your machine (already
recorded as applied) but *would* change it for anyone starting fresh. Silent divergence.

Need a change? Write a new numbered file.

**Claim your number in the group chat before creating the file.** Two people creating `010_*.sql`
simultaneously is the most common way student teams corrupt their schema history.

Reserved: `001` `002` `003` `004` `005` for the five slices, `006` indexes, `007` order
procedures, `008` report procedures, `009` triggers.

## 2.5 Code structure — and the one rule about SQL

Every backend module has the same four files:

```
modules/catalogue/
├── catalogue.routes.js      # URL → controller, middleware. No logic.
├── catalogue.controller.js  # HTTP in/out, status codes. No SQL.
├── catalogue.service.js     # business rules. No SQL, no req/res.
└── catalogue.repo.js        # SQL only.
```

**SQL appears only in `*.repo.js`.** A query in a controller gets the PR rejected. This is a
database course — keeping every query in one predictable place makes the SQL easy to find,
review, and defend at the viva.

**Always use placeholders (`?`), never string concatenation.** That's what prevents SQL
injection, and evaluators look for it.

Read `server/src/modules/auth/` before writing your first module. It's the worked example.

## 2.6 Definition of done

A task isn't finished until:

- [ ] Migration runs clean on a fresh database (`docker compose down -v` and rebuild)
- [ ] Endpoint returns correct data and correct status codes
- [ ] Errors use the shared envelope, never a raw stack trace
- [ ] Auth/role checks applied where the SRS requires them
- [ ] UI works against the real API, including loading and error states
- [ ] SQL only in `*.repo.js`, placeholders only
- [ ] REQ-IDs listed in the PR
- [ ] One teammate approved

## 2.7 When you're stuck

**Under 30 minutes:** work it yourself. Read the error, check the terminal, try the reset button.

**Over 30 minutes:** post in the group chat with (a) what you're trying to do, (b) the exact
error text, (c) what you've already tried. Not "it doesn't work."

**Over a day, and it's someone else's code blocking you:** pair with them. Two people at one
keyboard on the critical path beats one person idle for three days.

Nobody on this team has built this stack before. Being stuck is normal; being stuck silently is
the problem.

## 2.8 Meetings

- **Mon, 15 min** — standup: finished / doing / blocked
- **Thu, 30 min** — integration: merge `dev`, everyone pulls, fix breakage together
- **Fri, 45 min** — demo & teach: each member demos their week **and explains their SQL to the
  group**

That last one is how all five of you pass the viva instead of one. It's the first thing teams
drop when busy and the thing they most regret dropping.

## 2.9 First diagnostic when "it works on my machine"

```sql
SELECT * FROM schema_migrations;
```

If your list has `005` and theirs doesn't, they haven't pulled and migrated. Settles a
surprising share of arguments.

---

# 3. The approach: vertical slices

The usual mistake is splitting by layer — "you do frontend, you do backend." Then two people
learn no SQL, one becomes a bottleneck, and nobody can answer viva questions outside their
layer.

Instead each member owns a **feature slice end-to-end**:

```
        Slice 1     Slice 2      Slice 3    Slice 4    Slice 5
React      │           │            │          │          │
Express    │           │            │          │          │
MySQL      │           │            │          │          │
```

Own migrations, own procedures, own routes, own screens. Merge conflicts stay low because each
slice lives in its own folder.

---

# 4. The five slices

**Slice 1 is taken.** Slices 2–5 are open — pick one at the kickoff.

Read all five before choosing. Slice 5 has the least difficult SQL and is a reasonable choice if
you're least confident; Slice 3 has the most React work.

---

## Slice 1 — Core Infrastructure & Order Transaction *(taken)*

The shared foundations plus the atomic checkout transaction that the entire SRS is built around.

**Owns:** `middleware/auth.js`, `errorHandler.js`, `api/client.js` · migration 001 (users,
addresses, cities) · migration 004 (`orders`, `order_item`, `delivery`) · migration 007
(`sp_place_order`, `sp_cancel_order`, `fn_estimate_delivery_days`) · migration 009 (stock
trigger) · auth API · `POST /checkout/confirm` · **order history and order detail screens** ·
the concurrency test harness · integration merges.

**Covers:** Features 4.4, 4.6, 4.7, 4.9 · REQ-4.x, 6.x, 7.x, 9.x

**Why it's largest:** it contains everything the other four depend on (auth middleware, error
format, API client) plus the highest-risk SQL in the project.

---

## Slice 2 — Catalogue, Search & Stock

The product catalogue: what customers browse and what staff maintain.

**Owns:** migration 002 — `category`, `product`, `product_category`, `variant`,
`variant_attribute`, `attribute_value`, `stock_adjustment`.

**Build:**
- `GET /products` with keyword search plus category, brand, and price-range filters, paginated
- `GET /products/:id` with all variants, attributes, live price and stock
- `GET /categories` as a nested tree
- Staff CRUD for categories, products, variants, with soft-delete (REQ-10.1)
- `POST /admin/stock-adjustments` recording staff identity, timestamp, reason (REQ-10.4)
- Home page, product listing with filters, product detail with variant selector
- Staff catalogue management screens
- The 40-product / 10-category seed (REQ-10.6)

**Covers:** Features 4.1, 4.2, 4.10 · REQ-1.x, 2.x, 10.1–10.4, 10.6

**Character:** highest volume, but mostly mechanical. Lots of CRUD, lots of screens, no
especially hard SQL. Good if you want to build a lot and learn by repetition.

**You block:** Slices 3 and 4 need your `variant` table. Ship it in week 1.

---

## Slice 3 — Cart & Checkout

Everything between "add to cart" and "confirm order."

**Owns:** migration 003 — `cart`, `cart_item` · the shared React UI kit.

**Build:**
- Cart CRUD, where adding an existing variant **sums** quantities rather than inserting a second
  row (REQ-3.4 — use `INSERT ... ON DUPLICATE KEY UPDATE`)
- Guest carts keyed by session token, merged into the customer cart on login (REQ-3.5)
- `GET /checkout/summary` assembling cart, delivery mode, city, and the delivery estimate
- Cart page with line totals, running total, out-of-stock warnings (REQ-3.7)
- Checkout page: delivery mode → address → payment method → estimated date → confirm
- Order confirmation page
- **The shared UI kit** in `components/ui/`: Button, Input, Select, Table, Modal, Toast, Spinner

**Covers:** Features 4.3, 4.5 · REQ-3.x, 5.x

**Character:** most React work of any slice, moderate SQL. The guest-cart merge is genuinely
interesting logic. Good if you enjoy frontend.

**You block:** everyone needs your UI kit. Ship it in week 1, before your own features —
otherwise four people hand-roll their own buttons and the app looks like five different apps.

---

## Slice 4 — Customer Accounts & Order Tracking

The customer's own data: profile, addresses, order history.

**Owns:** no migration of its own — you build on Slice 1's `user`/`customer`/`address`/`city`
tables and Slice 1's `orders` tables. You own the seed data for users and cities.

**Build:**
- `database/seeds/01_cities_users.js`: 6 Texas main cities (`is_main_city = TRUE`), ~15 other
  cities, 3 staff accounts (one per role), ~20 customers with addresses across both city types
- Register and Login pages using Slice 1's auth API
- `AuthContext`, `ProtectedRoute`, navbar auth state
- `GET/PUT /me`, `GET/POST /me/addresses` — profile and address book (REQ-4.6)
- `GET /cities` and staff city management — the main-city list that drives delivery estimates
  (REQ-7.3)
- Staff user management: list staff and customers, assign roles, deactivate accounts (REQ-10.5)

**Covers:** Feature 4.4 (UI) · REQ-4.5, 4.6, 7.3, 10.5

**Character:** the lightest slice, deliberately. Balanced frontend and backend, no migration to
write from scratch, no hard SQL. **Take this if you're least confident** — it's a genuine
end-to-end slice with a gentler learning curve.

**You block:** your city seed feeds the delivery estimate. Ship it in week 1.

---

## Slice 5 — Payments, Staff Console & Reports

Payment lifecycle, staff operations, and all five management reports.

**Owns:** migration 005 (`payment`) · migration 006 (indexes) · migration 008 (report
procedures).

**Build:**
- `POST /payments/card` behind a **mock** gateway accepting `mockOutcome: "success" | "failure"`.
  Never integrate a real gateway. Never store card numbers (REQ-8.3)
- COD flow: status `'Pending'` at placement; staff mark `'Paid'` with identity and timestamp
  (REQ-8.2, REQ-11.3)
- The 24-hour job: cancel card payments still `Failed` after 24h via Slice 1's `sp_cancel_order`
  (REQ-8.5 / BR-7). A `setInterval` is sufficient
- Staff order console: filter by status, payment status, delivery mode, date range (REQ-11.1);
  status transitions validated against the table in `SCHEMA.md` (REQ-11.2)
- **Five report procedures** — quarterly sales, top products, category order counts, upcoming
  deliveries, customer summaries (REQ-12.1–12.5)
- Reporting dashboard: five tabs, parameter forms, tables, one or two Recharts charts
- `database/seeds/03_demo_orders.js` — orders across all four quarters, several customers and
  categories, mixed payment statuses. Without this your reports have nothing to report on
- Index before/after timings: `EXPLAIN`, add index, `EXPLAIN` again, record both

**Covers:** Features 4.8, 4.11, 4.12 · REQ-8.x, 11.x, 12.x

**Character:** widest breadth, but the SQL is aggregation rather than concurrency — `GROUP BY`
and `JOIN`, not locking. Five procedures is a lot of writing but each is tractable.

**Warning:** cross-check every report number by hand against the seed data. A report that runs
but returns wrong totals is worse than one that errors, and it's exactly what gets caught at the
viva.

---

# 5. Four-week plan

**This is aggressive.** Four weeks for five people new to this stack is tight. Week 5 is built in
as a buffer — plan for four, expect five, and if you're on track at the end of week 3 you'll
finish comfortably.

The ordering is not negotiable even if the timing slips: schema before APIs, APIs before UI,
customer flow before staff flow.

## Week 0 — Kickoff (one 90-minute meeting)

Budget **two hours**, not ninety minutes — the UI decisions need real time.

| Time | Item |
|---|---|
| 0–10 | Walk the SRS features and the ER diagram. Everyone should be able to name every table |
| 10–20 | Demo the running skeleton |
| 20–35 | **Everyone clones and runs it, in the room.** Nobody leaves with a broken environment |
| 35–50 | Read all five slices aloud. Slices 2–5 get picked |
| 50–65 | Walk `001_users_addresses.sql`, then `modules/auth/` file by file — the reference pattern |
| 65–80 | Read `SCHEMA.md` and `API.md` together. Settle the open items at the bottom of `API.md` |
| 80–95 | **`UI-GUIDE.md`: agree the styling library, the route map, and the icon set** |
| 95–110 | Sketch the main screens on paper — boxes and labels only. Photograph, commit to `docs/wireframes/` |
| 110–120 | Agree meeting times and phase-1 blockers |

The styling and route decisions cannot be deferred: changing the styling library later means
rewriting every screen, and an unagreed route map means five people's screens don't link to each
other. See `TASKS.md` Phase 0 for the full decision list.

## Week 1 — Schema and foundations

Heaviest week for shared infrastructure. Everything downstream waits on it.

**Everyone:** write your migration using the exact columns in `SCHEMA.md`. Verify with
`docker compose down -v && docker compose up -d && npm run migrate` — if it fails on a fresh
database it will fail for the evaluator. Open at least one PR, however small.

**Day 3 hard deadlines:**
- Slice 1 — auth middleware and error envelope merged (four people blocked)
- Slice 2 — `variant` table merged (two slices blocked)
- Slice 3 — UI kit merged (everyone about to build forms)
- Slice 4 — cities and users seeded (delivery estimates need them)

**By end of week:**
- Slice 1: migrations 001, 004, 009. Stock trigger tested by hand — `UPDATE variant SET
  stock_quantity = -1` must be rejected. Auth register + login working via curl
- Slice 2: migration 002 with all constraints. ~8 seed products so others have data
- Slice 3: UI kit + `api/client.js`. Migration 003
- Slice 4: user and city seeds. Register and Login pages built against Slice 1's API
- Slice 5: migration 005. Demo-order seed started

**Gate:** everyone demos a migration running on a fresh database.

## Week 2 — All backend

No React this week except finishing what week 1 started. Every endpoint gets built and tested
with curl or Thunder Client.

- **Slice 1:** `fn_estimate_delivery_days`, then `sp_place_order` **without locking** — validate,
  decrement, insert `orders` + `order_item` + `delivery`, mark cart converted. Test from the
  MySQL CLI. **Tell Slice 3 the signature immediately** so checkout can be wired
- **Slice 2:** `GET /products` with all filters, `GET /products/:id`, `GET /categories`. Staff
  catalogue CRUD
- **Slice 3:** cart CRUD with the duplicate-merge behaviour, guest-cart merge on login,
  `GET /checkout/summary`
- **Slice 4:** `GET/PUT /me`, addresses, `GET /cities`, `AuthContext` and `ProtectedRoute`
  complete
- **Slice 5:** mock payment gateway, COD flow, quarterly-sales and top-products procedures —
  both verified by hand against the seed data

**Split the seed:** each member writes 8 products with variants in their own file under
`database/seeds/products/`. Slice 2 assembles them. That's 40 products without one person typing
all of it. Include some with `stock_quantity = 0` so the back-order path is demonstrable.

**Gate:** `CALL sp_place_order(...)` works from the MySQL CLI. Every slice's core endpoints
return correct JSON.

## Week 3 — All frontend, and the milestone

- **Slice 1:** add `SELECT ... FOR UPDATE ... ORDER BY variant_id` to `sp_place_order` —
  **the `ORDER BY` matters**, consistent lock ordering is what prevents deadlocks. Then
  `sp_cancel_order`. Then the order history and order detail screens, with the status timeline
  and the cancel flow (REQ-9.1–9.4). Then write and run the concurrency harness
- **Slice 2:** home, listing with filters, product detail with live variant selector, "no
  results" state
- **Slice 3:** cart page, checkout page, confirmation page. Wire `POST /checkout/confirm`
- **Slice 4:** profile, address book, staff user management
- **Slice 5:** payment screen, retry action, remaining three report procedures

**Gate — the one that matters: a customer can place an order through the browser.** Browse →
add to cart → register → checkout → confirm → see it in order history. If you hit this by the
end of week 3, you will finish. If you don't, invoke week 5 now rather than later.

## Week 4 — Staff, reports, hardening

- **Slice 1:** re-run the concurrency harness. Screenshot the passing output — 20 parallel
  checkouts against 1 unit of stock, 19 rollbacks, stock at exactly 0. That's your strongest
  single artifact
- **Slice 2:** staff catalogue screens, stock adjustment screen, finish the 40-product seed
- **Slice 3:** every exception path in SRS §4.5.2 — unauthenticated, missing address,
  insufficient stock, abandoned checkout. Confirm abandonment changes no stock (REQ-6.4)
- **Slice 4:** staff city management, staff user management screen
- **Slice 5:** staff order console with filters and validated transitions, reporting dashboard,
  the 24-hour job, `006_indexes.sql` with before/after `EXPLAIN` output

**Everyone:** test *someone else's* slice and file issues. You'll find things they can't see.

**Gate:** all five reports return numbers verified by hand. Full customer and staff flows work.

## Week 5 — Buffer and delivery

Use it for whatever slipped, then:

1. Final seed data loaded and checked
2. Fresh-clone test: clone into a new folder, follow the README, reach the green banner in under
   ten minutes. If you can't, neither can the evaluator
3. Regenerate the ER diagram from the real schema
4. Traceability matrix assembled from PR descriptions
5. Performance figures recorded against §5.1 — search under 3s, checkout under 5s, reports under 8s
6. Demo script written and rehearsed end to end
7. **Mock viva** — each member is questioned on somebody else's slice

---

# 6. Weekly gates at a glance

| Week | Everyone must demo |
|---|---|
| 1 | Migration runs on a fresh database |
| 2 | Core endpoints return correct JSON via curl |
| 3 | **A customer places an order in the browser** |
| 4 | Staff screens work; five reports verified |
| 5 | Full demo rehearsed; everyone explains `sp_place_order` |

Miss a gate and say so at Monday standup. A missed gate caught early costs a day; caught in
week 5 it costs the project.

---

# 7. Friday teach-back rota

Each member presents their own SQL, then answers one question about someone else's slice.

| Week | Presents | Questioned on |
|---|---|---|
| 1 | Slice 2 | Slice 1's schema |
| 2 | Slice 1 | Slice 5's reports |
| 3 | Slice 3 | Slice 1's transaction |
| 4 | Slice 5 | Slice 2's indexes |
| 5 | Slice 4 | Mock viva, everyone |

---

# 8. What earns marks

- **`sp_place_order` and the concurrency proof.** REQ-6.1–6.3 is the heart of the brief. The
  screenshot of 20 concurrent checkouts resolving correctly is worth more than any amount of UI
  polish
- **Index before/after timings.** `EXPLAIN`, add index, `EXPLAIN`. A table of query times with
  and without indexes shows you understood *why* the index exists
- **Traceability.** REQ-ID → file → test, built from PR descriptions as you go
- **Everyone understanding everything.** The Friday teach-back is what makes this true. A group
  where one member can explain the transaction loses marks a group of five who all can does not

---

# 9. Things that will bite you

1. **`orders`, not `order`.** Reserved word in MySQL. You will type `order` by reflex.
2. **Never join historical orders to `variant.price`.** Use `order_item.unit_price_at_order`.
   Same for addresses — use `delivery.address_snapshot`.
3. **ENUM strings are exact.** `'Placed'` not `'placed'`, `'cod'` not `'COD'`.
4. **`CHECK` needs MySQL 8.0.16+.** Below that it's parsed and silently ignored. Run
   `SELECT VERSION();`.
5. **Every order gets a `delivery` row**, Store Pickup included. Report 4 breaks otherwise.
6. **`cart.customer_id` is nullable.** Don't assume a cart has a customer.
7. **Money is `DECIMAL(10,2)` in SQL and a string in JSON.** Floats lose cents.
8. **`ORDER BY variant_id` before `FOR UPDATE`.** Inconsistent lock ordering causes deadlocks
   that only appear under concurrency — the hardest kind of bug to reproduce.
