# BrightBuy — Retail Inventory & Online Order Management System

**CS3043 Database Systems · Group 13 · University of Moratuwa**

A digital commerce platform for a consumer electronics retail chain in Texas: product
browsing, ordering, and delivery scheduling, built around a relational schema that keeps
inventory and orders consistent under concurrent load.

**Live:** https://brightbuy-g13.indiasouthcentral.cloudapp.azure.com

**Stack:** MySQL 8 · Node.js + Express · React (Vite) · Docker · GitHub Actions → Azure

---

## Team contributions

Each member owned one vertical slice — the migrations, the stored routines, the API module
and the screens for that area.

| Member | Slice | Built |
|---|---|---|
| **Dihini Kandegedara**<br>`Didi255` | **A — Orders & delivery** | `sp_place_order` (the order transaction, row locking, stock decrement), `sp_cancel_order`, `fn_estimate_delivery_days`, `trg_variant_stock_no_negative`, the `orders`/`order_item`/`delivery` schema, the 20-way concurrency harness, order history and order detail screens, the shared UI design system, Docker containerisation and the CI/CD pipeline to Azure |
| **Vidura Pabasara**<br>`viduraPabasara-8` | **C — Cart & checkout** | `cart`/`cart_item` schema, guest and customer cart handling with session tokens, quantity merging, the cart and checkout screens, `theme.js` and the shared component kit |
| **Ajini**<br>`ajini-R` | **D — Accounts & administration** | `user`/`customer`/`staff`/`address` schema, bcrypt registration and JWT login, role-based route protection, address book with ownership, `admin_audit_log`, user management and audit screens |
| **Risandu**<br>`risandu26-hash` | **B — Catalogue** | `product`/`variant`/`category`/`product_category` schema, the self-referencing category hierarchy, variant attributes, catalogue search and filter endpoints, catalogue seed data |
| **Maathumai**<br>`Maathumai-03` | **E — Payments & reports** | `payment` and `stock_adjustment` schema, and the five management report procedures: `sp_report_quarterly_sales`, `sp_report_top_products`, `sp_report_category_orders`, `sp_report_upcoming_deliveries`, `sp_report_customer_summary` |

Commit history per member is visible under **Insights → Contributors**.

---

## What the database does

**19 tables · 7 stored procedures · 1 function · 1 trigger · 6 indexes · 14 migrations**

The design decisions worth knowing:

- **The variant carries price and stock, not the product.** A product with one option gets a
  single default variant, so there is no special case anywhere in the code.
- **Order placement is one transaction.** `sp_place_order` locks every variant in the cart
  **ordered by primary key** before reading anything, which makes deadlock impossible rather
  than merely unlikely. Its `EXIT HANDLER` does `ROLLBACK` **and `RESIGNAL`**, so a failure
  can never be reported to the application as a success.
- **`order_item.unit_price_at_order` and `delivery.address_snapshot`** look like
  denormalisation and are not. A sold price and a delivery address are facts about that
  transaction; joining to the live row would let a price change silently rewrite history.
- **Every order gets a `delivery` row**, store pickup included, so reporting needs no special
  case.
- **Stock cannot go negative** — validation, a guarded decrement, and a `BEFORE UPDATE`
  trigger, independently.

Twenty-nine design decisions, each with its reasoning and what was rejected, are recorded in
[`docs/DECISIONS.md`](docs/DECISIONS.md).

### Proof of concurrency safety

```bash
cd server && npm run test:concurrency
```

Twenty simultaneous orders against one unit of stock: exactly one succeeds, stock lands on
zero, nothing deadlocks. Seeding two units instead of one makes the harness fail and exit
non-zero — the negative control is what makes the passing run meaningful.

**This runs in CI on every push**, against a real MySQL 8, so the transaction cannot be
weakened without the build going red.

---

## Running it locally

```bash
git clone https://github.com/Didi255/brightbuy.git && cd brightbuy
cp .env.example .env

docker compose up -d              # MySQL 8 on host port 3307

cd server && npm install
npm run migrate                   # applies database/migrations/*.sql in order
npm run seed                      # 21 cities, 24 users, 43 products, 64 demo orders
npm run dev                       # API on http://localhost:4000

cd ../client && npm install
npm run dev                       # UI on http://localhost:5173
```

### Demo accounts

| Account | Password | Role |
|---|---|---|
| `admin@brightbuy.com` | `Admin@123` | staff — admin |
| `majorexec@brightbuy.com` | `Major@123` | staff — major exec |
| `john.smith@brightbuy.com` | `Customer@123` | customer (Houston — a main city, 5-day estimate) |
| `sarah.brown@brightbuy.com` | `Customer@123` | customer (Lubbock — 7-day estimate) |

Seed credentials for a coursework project. They are not used anywhere else.

---

## Layout

```
database/
  migrations/   schema, append-only — never edit a merged migration
  seeds/        reference and demo data
  tools/        asset generation scripts
server/src/modules/<slice>/
  <slice>.routes.js       URL → controller.          No logic.
  <slice>.controller.js   HTTP in/out, status codes. No SQL.
  <slice>.service.js      Business rules.            No SQL, no req/res.
  <slice>.repo.js         SQL only.
client/src/features/<slice>/   the screens for that slice
infrastructure/                Dockerfiles, production compose, Caddy
.github/workflows/             CI and the deploy pipeline
```

**SQL appears only in `*.repo.js`**, always with `?` placeholders, never string concatenation.

---

## Documentation

| | |
|---|---|
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | Every table, column, type and constraint |
| [`docs/API.md`](docs/API.md) | Every endpoint and JSON shape |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | 29 design decisions and their reasoning |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, CI/CD and the Azure host, end to end |
| [`docs/UI-GUIDE.md`](docs/UI-GUIDE.md) | Design tokens, components, conventions |
| [`docs/COURSE-COVERAGE.md`](docs/COURSE-COVERAGE.md) | Where each course topic is demonstrated |

---

## Deployment

Merging to `main` triggers GitHub Actions, which builds the client, applies all migrations
against a real MySQL, seeds it and **runs the concurrency test**. Only if that passes does it
build two Docker images, push them to GHCR, and deploy to an Azure VM over SSH, then smoke-test
the live site.

Three containers run there: MySQL, the Express API, and Caddy serving the React build and
proxying `/api`. **Only Caddy is exposed** — the database has no published port, so it is
unreachable from the internet.

Full detail, including how to re-create the host from scratch, is in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
