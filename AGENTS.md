# BrightBuy — CS3043 Database Systems, Group 13

Retail inventory and online order management system.
Stack: MySQL 8 (Docker) · Node.js + Express · React (Vite) · JWT auth.

This is a **university database project**. The marks are in the SQL — the
transaction, the constraints, the indexes, the reports. Prefer clear, explicit,
explainable SQL over clever abstractions. Every team member must be able to
defend this code at an oral viva, so write what a third-year student can read.

## Authoritative documents

Read these before changing anything. They are binding.

- `docs/SCHEMA.md` — every table, column, type, constraint. **Names are fixed.**
- `docs/API.md` — every endpoint and JSON shape. **Shapes are fixed.**
- `docs/TASKS.md` — who owns what, and the order work happens in
- `docs/DECISIONS.md` — deviations from the submitted SRS/ERD, and why
- `docs/UI-GUIDE.md` — styling, route map, component ownership

If a needed column or field is missing from SCHEMA.md or API.md, **stop and say
so**. Never add one silently — five people build against these files.

## Architecture

```
server/src/modules/<slice>/
├── <slice>.routes.js      URL → controller, middleware. No logic.
├── <slice>.controller.js  HTTP in/out, status codes. No SQL.
├── <slice>.service.js     Business rules. No SQL, no req/res.
└── <slice>.repo.js        SQL only.
```

`server/src/modules/auth/` is the reference implementation. Read it first.

## Hard rules

1. **SQL appears only in `*.repo.js`.** Never in a controller or service.
2. **Always use placeholders (`?`).** Never string-concatenate into SQL.
3. **The table is `orders`, never `order`** — reserved word in MySQL.
4. **Never join historical orders to `variant.price`** — use
   `order_item.unit_price_at_order`. Same for addresses: use
   `delivery.address_snapshot`, not the `address` table.
5. **ENUM strings are exact**: `'Placed'` not `'placed'`, `'cod'` not `'COD'`.
6. **Money is `DECIMAL(10,2)` in SQL, a string in JSON.** Never `FLOAT`.
7. **Migrations are append-only.** Never edit a merged migration; write a new
   numbered file.
8. **Never change schema outside a migration.** No manual ALTER in Workbench.
9. **JSON is camelCase, the database is snake_case.** The repo layer translates.
10. **Every order gets a `delivery` row**, Store Pickup included.

## Task guides

These are written for Claude Code's skill system, but they are plain markdown —
any agent can read them directly. Open the relevant one before starting:

| Doing this | Read first |
|---|---|
| Writing a migration, procedure, or trigger | `.claude/skills/migration/SKILL.md` |
| Adding endpoints or queries | `.claude/skills/module/SKILL.md` |
| Building a React screen | `.claude/skills/screen/SKILL.md` |
| Any visual or styling work | `.claude/skills/design-system/SKILL.md` |
| Reviewing a screen's finish | `.claude/skills/ui-polish/SKILL.md` |
| Before opening a PR | `.claude/skills/pr-check/SKILL.md` |

## Commands

```bash
docker compose up -d          # start MySQL (Docker Desktop must be open)
cd server && npm run migrate  # apply migrations
cd server && npm run seed     # load seed data
cd server && npm run dev      # API on :4000
cd client && npm run dev      # UI on :5173
```

## Conventions

- Errors: throw `ApiError` from services; `errorHandler.js` formats the response.
  Never send a raw stack trace.
- Commits: `type(scope): message` — `feat(cart): merge duplicate variants`.
- Every PR description lists the REQ-IDs it satisfies: `Implements REQ-3.4`.
- Branches: `feat/<surname>/<what>`, targeting `dev`, never `main`.
