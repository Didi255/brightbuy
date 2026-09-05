# BrightBuy — Team Plan

**Group 13 · University of Moratuwa · CS3043 Database Systems**
Retail Inventory and Online Order Management System

Stack: MySQL 8 (Docker) · Node.js + Express · React (Vite) · JWT auth

---

## Contents

1. [The project](#1-the-project)
2. [Set up your machine](#2-set-up-your-machine)
3. [Set up your AI agent](#3-set-up-your-ai-agent)
4. [How we work](#4-how-we-work)
5. [The five slices](#5-the-five-slices)
6. [Stage-by-stage plan](#6-stage-by-stage-plan)
7. [UI and design](#7-ui-and-design)
8. [Checkpoints and meetings](#8-checkpoints-and-meetings)
9. [Things that will bite you](#9-things-that-will-bite-you)

**Companion documents** — binding, read before coding:

| File | Contains |
|---|---|
| `docs/SCHEMA.md` | Every table, column, type, constraint. **Names are fixed.** |
| `docs/API.md` | Every endpoint and JSON shape. **Shapes are fixed.** |
| `docs/DECISIONS.md` | Deviations from the submitted SRS/ERD, and why |
| `docs/UI-GUIDE.md` | Full styling detail and route map |

---

# 1. The project

BrightBuy is a consumer-electronics retailer in Texas launching online ordering.
We build the database and a web application for browsing, ordering, and delivery
from a single central warehouse.

**This is a database course.** The marks are in the SQL — the atomic transaction,
the constraints, the indexes, the five reports. The UI needs to be clean and
functional, not beautiful. Budget your effort accordingly.

**Everyone must be able to explain the whole system at the viva**, not just their
own part. That is what the Friday teach-back sessions are for.

### What we must deliver

- Customer flow: browse → search → variant selection → cart → checkout → order tracking
- Staff flow: catalogue management, stock adjustments, order and payment management
- Five management reports (quarterly sales, top products, category order counts,
  upcoming deliveries, customer summaries)
- **`sp_place_order`** — stock validation, decrement, and order creation as one
  atomic transaction with row-level locking (REQ-6.1–6.3). This is the centrepiece
- At least 40 products across 10+ categories, each with variants

---

# 2. Set up your machine

Do this **before** the kickoff. Budget an hour, mostly downloads.

## 2.1 Install

| Tool | Verify | Source |
|---|---|---|
| Node.js v18+ | `node -v` | nodejs.org (LTS) |
| Git | `git --version` | git-scm.com |
| Docker Desktop | `docker --version` | docker.com |

You do **not** need to install MySQL. Docker provides it.

**Windows:** use **Git Bash** for every command in this document — not Command
Prompt or PowerShell. Right-click inside a folder → "Git Bash Here" (Windows 11:
"Show more options" first). Paths are Unix-style: `D:\projects` → `/d/projects`.
Paste with **right-click** or **Shift+Insert**, not Ctrl+V.

## 2.2 Download the MySQL image early

```bash
docker pull mysql:8.0
```

~250MB. If it fails partway with `unexpected EOF`, run it again — finished layers
are cached. **Do this at home.** Five people pulling it on campus wifi will eat the
kickoff.

Docker Desktop must be **open** for any `docker` command. An error mentioning
`dockerDesktopLinuxEngine` means exactly that — launch it and wait for the whale
icon to stop animating.

## 2.3 Clone and configure

```bash
git clone <repo-url>
cd brightbuy
cp .env.example .env
```

`.env` holds machine-specific settings and is **never committed**. `.env.example`
is the committed template.

## 2.4 Pick your port

Only one program can hold a port. If you already have MySQL installed for other
coursework, it holds **3306** and Docker will fail.

Check (Command Prompt):
```
netstat -ano | findstr :3306
```

**Nothing printed** → free, change nothing.

**Something printed** → either stop your local MySQL (Windows key → "services" →
`MySQL80` → Stop), or keep both: in `docker-compose.yml` change `"3306:3306"` to
`"3307:3306"` and set `DB_PORT=3307` in `.env`.

Because `.env` isn't committed, **everyone chooses independently**. Yours needn't
match anyone else's.

## 2.5 Start the database

```bash
docker compose up -d
docker compose logs -f mysql
```

Wait for **`ready for connections`** — it appears twice, the second is real. MySQL
takes 20–40 seconds to initialise; connecting early gives confusing errors.
`Ctrl+C` stops the log view, not the container.

The `brightbuy` database and user are created automatically. No `CREATE DATABASE`
needed.

## 2.6 Build the schema and run

```bash
cd server && npm install && npm run migrate && npm run dev
```
```bash
# second terminal
cd client && npm install && npm run dev
```

Open **http://localhost:5173**. A **green banner** means you're done.

## 2.7 What the banner proves

```
React (browser) → Vite proxy → Express route → mysql2 pool → MySQL (Docker)
```

Five hops. Every feature is that chain with different SQL in the middle. When
something breaks, work out **which hop failed** rather than staring at the whole
system.

## 2.8 Common problems

| Symptom | Cause |
|---|---|
| `dockerDesktopLinuxEngine ... cannot find the file` | Docker Desktop isn't open |
| `port is already allocated` | §2.4 port conflict |
| `ECONNREFUSED` on migrate | MySQL not ready, or wrong `DB_PORT` |
| `ER_ACCESS_DENIED_ERROR` | `.env` doesn't match `docker-compose.yml` |
| `Cannot find module 'x'` | No `npm install` in that folder |
| Red banner | Server terminal crashed — go read it |
| `bash: command not found` | You're in PowerShell; use Git Bash |
| `unexpected EOF` during pull | Interrupted download; run it again |

**Read the error before doing anything else.** It almost always names the problem.
Re-running a command hoping it changes is the biggest time-waster in this project.

## 2.9 Your reset button

```bash
docker compose down -v      # deletes container AND data
docker compose up -d        # wait for "ready for connections"
cd server && npm run migrate && npm run seed
```

Under a minute back to known-good. Use it freely. It's also a real test — if a
fresh rebuild fails, the migrations are broken and a teammate cloning would hit
the same wall.

---

# 3. Set up your AI agent

The repo carries project rules and task guides for AI coding agents. **Nothing to
install** — `git pull` gets everything.

| File | Read by |
|---|---|
| `AGENTS.md` | Cursor, Copilot, Codex, Antigravity, Aider, Windsurf, Zed — automatically |
| `CLAUDE.md` | Claude Code (one line, points at AGENTS.md) |
| `GEMINI.md` | Gemini CLI |
| `.claude/skills/*/SKILL.md` | The eight task guides — plain markdown, any agent can read |
| `.gemini/commands/*.toml` | The same eight, as Gemini CLI slash commands |

## How to use them

**Claude Code or Gemini CLI** — type `/` in the repo:

| Command | Use when |
|---|---|
| `/migration` | Writing a migration, procedure, or trigger |
| `/module` | Adding endpoints or queries |
| `/screen` | Building a React screen |
| `/design-system` | Any styling or layout work |
| `/ui-polish` | Reviewing a screen's finish |
| `/pr-check` | **Before every PR** |
| `/db-reset` | Local database is confusing |
| `/schema-check` | "It works on my machine" |

Gemini users: `/commands reload` if they don't appear.

**Any other agent** — it reads `AGENTS.md` on its own. For a task guide, say:
*"read `.claude/skills/migration/SKILL.md` and follow it."*

## Two rules

1. **Run `/pr-check` before every PR.** It catches the rule violations that would
   otherwise get your PR sent back.
2. **Don't install skill packs from outside the repo.** A skill is instructions
   your agent follows and can pre-approve shell commands. Want one added? Open a
   PR against `.claude/skills/` so we all get the same reviewed version.

---

# 4. How we work

## 4.1 The rule that matters most

**Everyone has their own database on their own laptop.** Nothing is shared at
runtime.

What's shared is the *recipe* — `database/migrations/*.sql` and
`database/seeds/*.js`. When someone pushes a migration, you get their tables by
running it, not by connecting to their machine.

> **If a schema change matters, it goes in a migration file.
> If you make it by hand in Workbench, it exists only on your machine.**

This is how student groups break. Someone adds a column through a GUI, their code
works, they push, four teammates get "unknown column" errors. **Workbench is for
reading only** — inspecting data, testing a SELECT, checking what a procedure did.
Never for changing structure.

Same for test data. Need orders to develop a page? Put them in a seed file so your
reviewer can reproduce what you see.

## 4.2 Every day, before you start

```bash
docker compose up -d              # Docker Desktop open first
git checkout dev && git pull
cd server && npm run migrate      # pick up teammates' new tables
npm run dev
```

If someone added a library, `npm install` too.

## 4.3 Every piece of work

```bash
git checkout dev && git pull
git checkout -b feat/<yoursurname>/<what>
# ... work ...
git add . && git commit -m "feat(cart): merge duplicate variant additions"
git push -u origin feat/<yoursurname>/<what>
```

Then open a PR targeting **`dev`**, never `main`.

**Every PR description lists the REQ-IDs it satisfies** — `Implements REQ-3.4,
REQ-3.7`. Do this every time and the traceability matrix writes itself. Skip it
and you'll spend a day rebuilding it from memory at the end.

One approving review from another member. Reviewer rotates: A → B → C → D → E → A.

## 4.4 Migrations are append-only

Once merged, **a migration is frozen**. Editing it does nothing on your machine
(the runner already recorded it as applied) but *would* change it for anyone
starting fresh. Silent divergence.

Need a change? Write a new numbered file.

**Claim your number in the group chat before creating the file.** Two people
creating `010_*.sql` simultaneously is the most common way student teams corrupt
their schema history.

Reserved: `001` `002` `003` `004` `005` for the five slices, `006` indexes, `007`
order procedures, `008` report procedures, `009` triggers.

## 4.5 Code structure

```
server/src/modules/<slice>/
├── <slice>.routes.js      URL → controller, middleware. No logic.
├── <slice>.controller.js  HTTP in/out, status codes. No SQL.
├── <slice>.service.js     Business rules. No SQL, no req/res.
└── <slice>.repo.js        SQL only.
```

**SQL appears only in `*.repo.js`.** A query in a controller gets the PR rejected.
This is a database course — keeping every query in one predictable place makes the
SQL easy to find, review, and defend at the viva.

**Always use placeholders (`?`)**, never string concatenation. That's what prevents
SQL injection, and evaluators look for it.

Read `server/src/modules/auth/` before writing your first module.

## 4.6 Definition of done

- [ ] Migration runs clean on a fresh database
- [ ] Endpoint returns correct data and status codes
- [ ] Errors use the shared envelope, never a raw stack trace
- [ ] Auth/role checks where the SRS requires them
- [ ] UI works against the real API, with loading and error states
- [ ] SQL only in `*.repo.js`, placeholders only
- [ ] REQ-IDs listed in the PR
- [ ] One teammate approved

## 4.7 When you're stuck

**Under 30 minutes:** work it yourself. Read the error, check the terminal, try
the reset button.

**Over 30 minutes:** post in the group chat with (a) what you're trying to do,
(b) the exact error text, (c) what you've already tried. Not "it doesn't work."

**Over a day, and it's someone else's code blocking you:** pair with them. Two
people at one keyboard on the critical path beats one person idle for three days.

Nobody on this team has built this stack before. Being stuck is normal; being
stuck silently is the problem.

## 4.8 First diagnostic for "it works on my machine"

```sql
SELECT * FROM schema_migrations;
```

If your list has `005` and theirs doesn't, they haven't pulled and migrated.
Settles a surprising share of arguments.

---

# 5. The five slices

Each member owns a **feature slice end-to-end** — database, API, and screens.
Nobody is frontend-only or backend-only, and merge conflicts stay low because each
slice lives in its own folder.

Slices are balanced by **effort**, not by counting items — `sp_place_order` is not
equivalent to a `GET` endpoint. Each slice carries roughly: 2–3 migrations, 7–9
endpoints, 3–5 screens, one seed or shared asset, and one genuinely hard thing.

| | Slice | The hard thing | Assigned |
|---|---|---|---|
| **A** | Order Transaction & Delivery | `sp_place_order` + concurrency proof | Taken |
| **B** | Catalogue & Search | Search with combined filters, 7-table schema | Pick at kickoff |
| **C** | Cart, Checkout & UI Foundation | Guest-cart merge, the shared UI kit | Pick at kickoff |
| **D** | Auth, Accounts & Audit | JWT + role middleware, audit logging | Pick at kickoff |
| **E** | Payments, Staff Ops & Reports | Five report procedures, index tuning | Pick at kickoff |

---

## A — Order Transaction & Delivery *(taken)*

The atomic checkout transaction that the whole SRS is built around.

| | |
|---|---|
| **Migrations** | `004` orders/order_item/delivery · `007` procedures · `009` triggers |
| **SQL** | `sp_place_order`, `sp_cancel_order`, `fn_estimate_delivery_days`, `trg_variant_stock_no_negative` |
| **API** | `POST /checkout/confirm` · `GET /orders` · `GET /orders/:id` · `POST /orders/:id/cancel` |
| **Screens** | Order history · Order detail with status timeline |
| **Seed** | `03_demo_orders.js` — orders across all four quarters, for E's reports |
| **Special** | The concurrency harness |

**Covers:** Features 4.6, 4.7, 4.9 · REQ-6.x, 7.x, 9.x

**Character:** fewest endpoints, fewest screens — because `sp_place_order` with
row-level locking is worth several of each. This is the highest-risk item in the
project and the strongest artifact for the report.

---

## B — Catalogue & Search

The product catalogue: what customers browse and what staff maintain.

| | |
|---|---|
| **Migrations** | `002` category/product/product_category/variant · `011` variant_attribute/attribute_value |
| **API** | `GET /products` (keyword + category + brand + price, paginated) · `GET /products/:id` · `GET /categories` · staff CRUD for products, categories, variants |
| **Screens** | Home · Product listing with filters · Product detail with variant selector · Staff catalogue management |
| **Seed** | Assembles everyone's 8-product files into the 40-product catalogue |

**Covers:** Features 4.1, 4.2, 4.10 (catalogue) · REQ-1.x, 2.x, 10.1–10.3, 10.6

**Character:** highest volume, mostly mechanical. The hard part is the search query
with several optional filters combined.

**Split your migration.** `002` ships only the four tables others need —
`category`, `product`, `product_category`, `variant` — on **day 2**. Attributes go
in `011` later, which nobody is waiting on. This is deliberate: A and C are blocked
on `variant`, so a smaller first migration removes the biggest schedule risk in the
project.

---

## C — Cart, Checkout & UI Foundation

Everything between "add to cart" and "confirm order", plus the shared frontend.

| | |
|---|---|
| **Migrations** | `003` cart/cart_item |
| **API** | `GET /cart` · `POST/PATCH/DELETE /cart/items` · guest-cart merge on login · `GET /checkout/summary` |
| **Screens** | Cart · Checkout · Order confirmation |
| **Shared** | `theme.js` · `AppShell`, `Navbar`, `PageHeader` · `StatusBadge`, `Money`, `ErrorAlert`, `DataTable`, `EmptyState`, `LoadingSpinner` · `api/client.js` |

**Covers:** Features 4.3, 4.5 · REQ-3.x, 5.x

**Character:** one migration, but the shared UI kit is used by all five people and
the guest-cart merge is genuinely tricky logic.

**Ship the UI kit first**, before your own features — everyone else is about to
build forms. If the group picks a component library at the kickoff (Mantine
recommended) this is roughly half a day: a theme file and thin wrappers, not
building primitives from scratch.

---

## D — Auth, Accounts & Audit

Identity, access control, and the audit trail.

| | |
|---|---|
| **Migrations** | `001` extensions as needed · `010` `admin_audit_log` |
| **API** | `POST /auth/register` · `POST /auth/login` · `GET/PUT /me` · `GET/POST /me/addresses` · `GET /cities` · `GET/POST/PATCH /admin/cities` · `GET/PATCH /admin/users` · `GET /admin/audit-log` |
| **Screens** | Register · Login · Profile · Address book · Staff city management · Staff user management · Audit log viewer |
| **Seed** | `01_cities_users.js` — 6 main cities, ~15 others, 3 staff, ~20 customers |
| **Shared** | `middleware/auth.js` (`requireAuth`, `optionalAuth`, `requireRole`) · `errorHandler.js` · `ApiError.js` |

**Covers:** Feature 4.4 · REQ-4.x, 7.3, 10.5 · §5.3 and §5.4 (auditability)

**Character:** most endpoints and screens, but they are straightforward CRUD. The
hard parts are JWT signing and verification, bcrypt, and the role middleware four
other people depend on.

**The audit log closes a real requirements gap.** §5.3 requires that *"all
significant administrative activities shall be logged for auditing purposes"* and
§5.4 lists Auditability as a quality attribute. `stock_adjustment` and
`payment.staff_id` only cover their own narrow cases. Build `admin_audit_log`
(actor, action, entity, entity_id, before/after, timestamp) plus middleware that
writes to it on every staff mutation, and a screen to view it.

**Ship the auth middleware first** — four people are blocked on it.

---

## E — Payments, Staff Ops & Reports

Payment lifecycle, staff operations, and the five management reports.

| | |
|---|---|
| **Migrations** | `005` payment · `006` indexes · `008` report procedures |
| **SQL** | `sp_report_quarterly_sales`, `sp_report_top_products`, `sp_report_category_orders`, `sp_report_upcoming_deliveries`, `sp_report_customer_summary` |
| **API** | `POST /payments/card` (mock gateway) · `POST /payments/:id/retry` · `PATCH /admin/payments/:id` · `GET /admin/orders` · `PATCH /admin/orders/:id/status` · `POST /admin/stock-adjustments` · five report endpoints |
| **Screens** | Payment / retry · Staff order console · Stock adjustment · Reporting dashboard (five tabs) |
| **Special** | Index before/after timing study |

**Covers:** Features 4.8, 4.11, 4.12 · REQ-8.x, 11.x, 12.x

**Character:** widest breadth, but the SQL is aggregation rather than concurrency —
`GROUP BY` and `JOIN`, not locking.

**Verify reports twice.** Once in Stage 2 against seed data, and again after Stage
3 against real orders that came through checkout. Reports can pass on synthetic
data and break on real orders.

---

## Load comparison

| | Migrations | Endpoints | Screens | Seed / shared | Hard thing |
|---|---|---|---|---|---|
| **A** | 004, 007, 009 | 4 | 2 | Demo orders | `sp_place_order` + locking |
| **B** | 002, 011 | 7 | 4 | Catalogue seed | Multi-filter search |
| **C** | 003 | 6 | 3 | UI kit + API client | Guest-cart merge |
| **D** | 001, 010 | 9 | 7 | Cities/users seed + auth middleware | JWT + roles + audit |
| **E** | 005, 006, 008 | 8 + 5 procs | 4 | Index study | Five report procedures |

A trades endpoints and screens for the hardest SQL. D has the most items but the
simplest ones. C has one migration but the most-depended-on shared code.

## Cross-testing — assigned, not optional

In Stage 4 each member tests **someone else's** slice and files issues:

```
A tests B  ·  B tests C  ·  C tests D  ·  D tests E  ·  E tests A
```

You find things in someone else's work that they cannot see in their own.

---

# 6. Stage-by-stage plan

Find your letter, work down your column. **Don't start Stage N+1 until the team
has cleared Stage N.** Timings are rough; the **order** is what matters.

## The blocking chain — read this first

Foreign keys create a real dependency:

```
002 catalogue  ──►  003 cart          (cart_item → variant)
               └─►  004 orders        (order_item → variant)
                          └─────────►  005 payment  (payment → orders)
```

**So strictly: B → A → E.** C also waits on B.

Every stage below gives each person unblocked work, so nobody idles.

**Three things must ship first or the team stalls:**

| Who | What | Waiting | When |
|---|---|---|---|
| **D** | `auth.js` + `errorHandler.js` + `ApiError.js` | A, B, C, E | Day 1–2 |
| **B** | `002` — the four core tables incl. `variant` | A, C | Day 2 |
| **C** | `theme.js` + `StatusBadge` + `Money` + `ErrorAlert` + `api/client.js` | everyone | Day 1–2 |

Not "in the first week" — **first**.

## Stage 0 — Kickoff decisions

One **2-hour** meeting. No code before this.

| # | Decide | Why it can't wait |
|---|---|---|
| 0.1 | Everyone's environment runs, in the room | A broken setup found later costs days |
| 0.2 | Styling library — Mantine / MUI / React-Bootstrap / plain CSS | Changing later means rewriting every screen. Also decides how big C's UI-kit job is |
| 0.3 | Route map confirmed (`docs/UI-GUIDE.md` §2) | Five people's screens must link to each other |
| 0.4 | Slices B–E assigned | Everything depends on it |
| 0.5 | Icon set — one, not several | Mixed sets look unfinished |
| 0.6 | Open items at the bottom of `docs/API.md` | Shapes are binding once agreed |
| 0.7 | Wireframes sketched on paper, photographed, committed | Prevents a Stage 3 layout argument |

### Agenda

| Time | Item |
|---|---|
| 0–10 | Walk the SRS features and the ER diagram |
| 10–20 | Demo the running skeleton |
| 20–35 | **Everyone clones and runs it, in the room** (0.1) |
| 35–50 | Read all five slices aloud. B–E picked (0.4) |
| 50–65 | Walk `001_users_addresses.sql`, then `modules/auth/` — the reference pattern |
| 65–80 | Read `SCHEMA.md` and `API.md` together. Settle open items (0.6) |
| 80–95 | **`UI-GUIDE.md`: agree styling library, route map, icon set** (0.2, 0.3, 0.5) |
| 95–110 | Sketch main screens on paper. Photograph, commit to `docs/wireframes/` (0.7) |
| 110–120 | Agree meeting times and Stage 1 blockers |

Afterwards A records 0.2 and 0.5 in `docs/DECISIONS.md` and pushes.

## Stage 1 — Unblock the team

**~3–4 days.** Everyone works in parallel.

| | Tasks |
|---|---|
| **A** | 1. Write `004_orders_delivery.sql` once B's `002` lands<br>2. Write `009_triggers.sql` — negative-stock trigger<br>3. Test it: `UPDATE variant SET stock_quantity = -1` must be rejected<br>4. Draft `03_demo_orders.js` structure — orders across all four quarters<br>5. Verify everything on a fresh database |
| **B** | 1. `SELECT VERSION();` — tell the group if below 8.0.16 (`CHECK` silently ignored)<br>2. Write `002_catalogue.sql` — **only** `category`, `product`, `product_category`, `variant` **(day 2)**<br>3. Verify with `SHOW CREATE TABLE variant;` that constraints exist<br>4. Add ~8 sample products so others have data<br>5. Write `011_variant_attributes.sql` — nobody is waiting on this |
| **C** | 1. Install the styling library chosen at kickoff<br>2. Write `theme.js` including the `statusColors` map **(day 1–2)**<br>3. Build `StatusBadge`, `Money`, `ErrorAlert` **(day 1–2)**<br>4. Finish `client/src/api/client.js` **(day 1–2)**<br>5. Build `AppShell`, `Navbar`, `PageHeader`<br>6. Write `003_cart.sql` once `002` lands |
| **D** | 1. Finish `middleware/auth.js` — `requireAuth`, `optionalAuth`, `requireRole` **(day 1–2)**<br>2. Finish `errorHandler.js` + `ApiError.js`, matching `API.md` **(day 1–2)**<br>3. Write `01_cities_users.js` — 6 main cities, ~15 others, 3 staff, ~20 customers<br>4. Make it idempotent (`INSERT IGNORE`)<br>5. Design the `admin_audit_log` table for `010` |
| **E** | 1. Write the five report queries **on paper** against `SCHEMA.md`<br>2. Write `005_payments.sql` once A's `004` lands<br>3. Read `sp_place_order`'s intended behaviour with A so you know what data appears |

```
Day 1-2:  D infra ──┐
          C shared ─┤
                    ├──► everyone can now build UI and use auth
Day 2:    B 002 ────┤
Day 3-4:  A 004 · C 003        (need 002)
Day 4:    E 005                (needs 004)
```

**Checkpoint:** every migration runs on a **fresh** database
(`docker compose down -v` → `up -d` → `npm run migrate && npm run seed`).

## Stage 2 — Backend

**~1 week. Fully parallel, no blocking.** No React — test everything with curl.

| | Tasks |
|---|---|
| **A** | 1. `fn_estimate_delivery_days` — 5 or 7 days, +3 (REQ-7.1, 7.2, 7.5)<br>2. `sp_place_order` **without locking** — validate, decrement, insert orders + items + delivery, mark cart converted<br>3. **Post the signature in the group chat** — C is blocked without it<br>4. Test success from the MySQL CLI<br>5. Test failure — order more than exists, confirm **nothing** was written<br>6. Test back-order — `stock_quantity = 0` allowed, flagged, estimate extended<br>7. Confirm Store Pickup gets a `delivery` row with `address_id` NULL |
| **B** | 1. `GET /products` — keyword + category + brand + price filters, paginated<br>2. Return `priceFrom`/`priceTo` across variants<br>3. `GET /products/:id` — variants, attributes, computed `inStock`<br>4. `GET /categories` — nested tree<br>5. `POST/PUT/DELETE /admin/products` — deactivate, never delete<br>6. `POST/PUT/DELETE /admin/categories`, `POST/PUT /admin/variants` |
| **C** | 1. `GET /cart` — by JWT customer or `X-Cart-Session` for guests<br>2. `POST /cart/items` — **sum quantities on duplicate** via `ON DUPLICATE KEY UPDATE`<br>3. `PATCH` and `DELETE /cart/items/:id`<br>4. Compute `lineTotal`, `itemCount`, `subtotal`, `hasOutOfStockItems` server-side<br>5. Cart merge on login<br>6. `GET /checkout/summary` |
| **D** | 1. `POST /auth/register` — validate, bcrypt, insert address → user → customer in one transaction<br>2. `POST /auth/login` — bcrypt compare, sign JWT, **vague error** on failure<br>3. `GET /me`, `PUT /me`, `GET`/`POST /me/addresses`<br>4. `GET /cities`, `GET/POST/PATCH /admin/cities`<br>5. `GET /admin/users`, `PATCH /admin/users/:id`<br>6. Write `010_audit_log.sql` and the middleware that writes to it |
| **E** | 1. `sp_report_quarterly_sales(year)` — excluding cancelled orders<br>2. `sp_report_top_products(from, to, limit)`<br>3. **Verify both by hand** against the seed data<br>4. Mock gateway: `POST /payments/card` with `mockOutcome`<br>5. COD flow — status `'Pending'` at placement<br>6. `PATCH /admin/payments/:id` — mark COD paid with staff and timestamp |

**Everyone, once this stage:** write 8 products with variants in your own file
under `database/seeds/products/`. B assembles them. Include some with
`stock_quantity = 0`.

**Checkpoint:** every endpoint returns correct JSON via curl.
`CALL sp_place_order(...)` works from the MySQL CLI.

## Stage 3 — Customer screens

**~1 week. Fully parallel.** Ends at the milestone that decides your timeline.

| | Tasks |
|---|---|
| **A** | 1. Add `SELECT ... FOR UPDATE` with **`ORDER BY variant_id`** — consistent lock ordering prevents deadlocks<br>2. `sp_cancel_order` — restore stock, set `'Cancelled'`<br>3. `POST /checkout/confirm` — maps insufficient stock to 409<br>4. `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`<br>5. Order history screen<br>6. Order detail with status timeline<br>7. Cancel button, only while status is `'Placed'` |
| **B** | 1. Home page — category tree, search bar<br>2. Product listing with cards<br>3. Filter sidebar — category, brand, price<br>4. Pagination and the "no results" state<br>5. Product detail page<br>6. Variant selector that **live-updates price and stock**<br>7. Quantity input rejecting zero, negative, non-numeric |
| **C** | 1. `CartContext` and navbar badge<br>2. Cart page — attributes, unit price, quantity editor, totals<br>3. Out-of-stock warning without removing the item<br>4. Checkout: delivery mode → address → payment method<br>5. Order summary with estimated date **before** confirmation<br>6. Wire `POST /checkout/confirm`, handle 409<br>7. Order confirmation page |
| **D** | 1. `AuthContext` — persist across reloads<br>2. `ProtectedRoute` plus a `requireStaff` variant<br>3. Register page with field-level validation<br>4. Login page — vague error on failure<br>5. Navbar auth state<br>6. Profile page and address book |
| **E** | 1. `POST /payments/:id/retry`<br>2. 24-hour job — cancel unpaid `Failed` card payments via `sp_cancel_order`<br>3. Nodemailer stub logging to console<br>4. Payment screen<br>5. `sp_report_category_orders()`, `sp_report_upcoming_deliveries()`, `sp_report_customer_summary()` |

**Checkpoint — the one that matters:**

> **A customer can place an order in the browser.**
> Browse → add to cart → register → checkout → confirm → see it in order history.

Reach this on schedule and you'll finish comfortably. **If you don't, extend the
timeline now** rather than compressing later stages.

## Stage 4 — Staff screens and reports

**~1 week. Fully parallel.**

| | Tasks |
|---|---|
| **A** | 1. Write `tests/concurrency.test.js` — variant at `stock_quantity = 1`, 20 parallel checkouts<br>2. Run it. Exactly one must succeed<br>3. **Screenshot the passing run** — 19 rollbacks, stock at 0<br>4. Verify all three layers block negative stock: `CHECK`, trigger, procedure<br>5. Test cancellation restores stock<br>6. Load the demo-orders seed so E has real data |
| **B** | 1. Staff catalogue screen — create, edit, deactivate products<br>2. Category management including parent assignment<br>3. Variant management — attributes, price, SKU, stock<br>4. Assemble everyone's product files into the 40-product seed |
| **C** | 1. Test every exception path in SRS §4.5.2<br>2. Confirm abandoning checkout changes no stock, creates no order<br>3. Verify guest-cart merge in all combinations<br>4. Loading, empty, and error states on every list in the app |
| **D** | 1. Staff city management — toggle `is_main_city`, add cities<br>2. Staff user management — roles, deactivation<br>3. Audit log viewer screen<br>4. Verify no `/staff/*` route is reachable by a customer |
| **E** | 1. `GET /admin/orders` with filters<br>2. `PATCH /admin/orders/:id/status` — enforce the transition table<br>3. Staff order console<br>4. `POST /admin/stock-adjustments` + screen<br>5. Reporting dashboard — five tabs, parameter forms, tables<br>6. One or two Recharts charts<br>7. **Re-verify all five reports against real orders**, not just seed data |

**Cross-testing:** A tests B · B tests C · C tests D · D tests E · E tests A.
File issues for what you find.

**Checkpoint:** staff flows work end to end. All five reports return numbers
verified by hand against real orders.

## Stage 5 — Hardening and delivery

**~4–7 days.**

| | Tasks |
|---|---|
| **A** | 1. Re-run the concurrency harness after any late change<br>2. Assemble the traceability matrix from PR descriptions<br>3. Prepare to walk the group through `sp_place_order` line by line |
| **B** | 1. `EXPLAIN` the search query, add `idx_product_name`, `EXPLAIN` again — record both<br>2. Verify search returns within 3 seconds<br>3. Regenerate the ER diagram from the real schema |
| **C** | 1. Verify checkout completes within 5 seconds<br>2. **Consistency pass** — walk every screen, file issues (`/ui-polish` helps)<br>3. Check each page at 375px width |
| **D** | 1. Security pass — confirm no endpoint that should be protected is open<br>2. Query `user` directly, confirm no plaintext password<br>3. Fresh-clone test — new folder, follow the README, green banner in 10 minutes |
| **E** | 1. Finish `006_indexes.sql` — `EXPLAIN`, add, `EXPLAIN` again for each<br>2. Build the before/after timing table<br>3. Verify all five reports return within 8 seconds |

**Everyone:** demo script rehearsed. **Mock viva** — each member questioned on
*someone else's* slice.

---

# 7. UI and design

Full detail in `docs/UI-GUIDE.md`. The essentials:

**Set expectations:** the marks are in the database. The UI needs to be clean,
consistent, and functional. It does not need to be beautiful. If you're spending
an evening on hover animations, you're spending it in the wrong place.

**Decide at kickoff, not later:** the styling library (Mantine recommended — a
component library means nobody hand-rolls a modal, and everything is consistent by
default), the route map, and the icon set.

**Ownership:** if two slices need a component it lives in `components/ui/` and C
owns it. If only you need it, keep it in your feature folder. Never build a
"temporary" local copy — temporary components survive to submission.

**The rules that make five people's screens look like one app:**

- Spacing on a strict **4 / 8 / 12 / 16 / 24 / 32 / 48** scale. Arbitrary values
  like 13px are the biggest tell that an interface was hand-assembled
- About **five type sizes**, no more. Numbers use tabular figures
- **One accent colour**, one border radius, one shadow depth, no gradients
- Status colours from `theme.js` — never pick your own, or the same order status
  appears in two colours on two screens
- **Four states per list**: loading (skeleton), empty (actionable, not "No data"),
  error (says what to do), populated. Most amateur interfaces have only the last
- Motion 150–200ms ease-out, `opacity` and `transform` only. Scattered animation
  reads as generated rather than designed
- Tables: text left-aligned, **numbers right-aligned**
- Buttons name their action — **"Place Order"**, not "Submit"
- Never show a raw ENUM. The user sees "Ready for pickup", not `ReadyOrOut`
- Visible focus rings, labels on inputs, nothing overflowing at 375px

**Run `/ui-polish` before calling a screen done.** In Stage 5, C walks every
screen in one sitting and files inconsistencies — it takes an hour and makes a
disproportionate difference to how finished the demo looks.

---

# 8. Checkpoints and meetings

| After | Everyone must demo |
|---|---|
| Stage 0 | Green banner on your own laptop |
| Stage 1 | Your migration runs on a **fresh** database |
| Stage 2 | Your core endpoints return correct JSON via curl |
| Stage 3 | **A customer places an order in the browser** |
| Stage 4 | Staff screens work; all five reports verified by hand |
| Stage 5 | Full demo rehearsed; everyone can explain `sp_place_order` |

Miss a checkpoint and say so at Monday standup. Caught early it costs a day;
caught at the end it costs the project.

## Meetings

- **Monday, 15 min** — finished / doing / blocked
- **Thursday, 30 min** — merge `dev`, everyone pulls, fix breakage together
- **Friday, 45 min** — each member demos and **explains their SQL to the group**

### Friday teach-back rota

| Stage | Presents | Questioned on |
|---|---|---|
| 1 | B | D's auth flow |
| 2 | A | E's reports |
| 3 | C | A's transaction |
| 4 | E | B's indexes |
| 5 | D | Mock viva, everyone |

The Friday session is how all five of you pass the viva instead of one. It's the
first thing teams drop when busy and the thing they most regret dropping.

## What earns marks

- **`sp_place_order` and the concurrency proof.** REQ-6.1–6.3 is the heart of the
  brief. A screenshot of 20 concurrent checkouts against 1 unit of stock — 19
  rollbacks, stock at exactly 0 — is the strongest single artifact you can produce
- **Index before/after timings.** `EXPLAIN`, add the index, `EXPLAIN` again. Shows
  you understood *why* the index exists
- **Traceability.** REQ-ID → file → test, built from PR descriptions as you go
- **Everyone understanding everything.** A group where one member can explain the
  transaction loses marks a group of five who all can does not

---

# 9. Things that will bite you

1. **`orders`, not `order`** — reserved word in MySQL. You will type `order` by
   reflex at least once.
2. **Never join historical orders to `variant.price`** — use
   `order_item.unit_price_at_order`. Same for addresses: use
   `delivery.address_snapshot`, not the `address` table.
3. **ENUM strings are exact** — `'Placed'` not `'placed'`, `'cod'` not `'COD'`.
4. **`CHECK` needs MySQL 8.0.16+** — below that it's parsed and silently ignored.
   Run `SELECT VERSION();`.
5. **Every order gets a `delivery` row**, Store Pickup included, or Report 4
   breaks.
6. **`cart.customer_id` is nullable** — don't assume a cart has a customer.
7. **Money is `DECIMAL(10,2)` in SQL, a string in JSON** — floats lose cents.
8. **`ORDER BY variant_id` before `FOR UPDATE`** — inconsistent lock ordering
   causes deadlocks that only appear under concurrency, the hardest kind of bug to
   reproduce.
9. **Never change schema outside a migration.** Workbench is for reading.
10. **Claim your migration number in the chat** before creating the file.
