---
description: Write a new database migration for BrightBuy following project conventions. Use when adding tables, columns, indexes, stored procedures, or triggers.
---

## Existing migrations

!`ls -1 database/migrations/ 2>/dev/null || echo "(run from repo root)"`

## Before writing

1. Read `docs/SCHEMA.md` for the exact columns, types, and constraints. Never
   improvise names — five people build against that file.
2. Check the number is unclaimed. Reserved: 001 users · 002 catalogue · 003 cart
   · 004 orders · 005 payment · 006 indexes · 007 order procedures · 008 report
   procedures · 009 triggers. Anything new takes the next free number.
3. **Never edit an existing migration.** They are append-only once merged. A
   change means a new numbered file.

## Requirements

- `ENGINE=InnoDB` on every table — required for foreign keys and
  `SELECT ... FOR UPDATE`
- Explicitly named constraints: `fk_<table>_<referenced>`, `uq_<table>_<columns>`
- Money as `DECIMAL(10,2)`, never `FLOAT`
- A header comment naming the owner and the REQ-IDs satisfied
- Stored procedures and triggers wrapped in `DELIMITER $$ ... $$ DELIMITER ;`

## After writing

Verify on a **fresh** database — that is what a teammate cloning the repo gets:

```bash
docker compose down -v && docker compose up -d
sleep 30 && cd server && npm run migrate && npm run seed
```

Then confirm the constraints exist. A `CHECK` silently ignored by an old MySQL
looks identical to one that works:

```sql
SHOW CREATE TABLE <table>;
SELECT VERSION();   -- CHECK needs 8.0.16+
```
