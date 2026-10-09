---
description: Verify the live database matches docs/SCHEMA.md. Use when a query fails unexpectedly, when integrating with a teammate's tables, or before a demo.
disable-model-invocation: true
---

## Check

1. Run `SELECT filename FROM schema_migrations ORDER BY filename;` and compare
   against the files in `database/migrations/`. A migration on disk but missing
   from the table means `npm run migrate` has not been run since the last pull.
2. Compare live structures against `docs/SCHEMA.md` using
   `SHOW CREATE TABLE <table>;`.
3. Report any mismatch in column names, types, nullability, or constraints.

## Common causes

- Not running `npm run migrate` after `git pull` — by far the most common
- Someone changed schema in Workbench instead of writing a migration, so the
  change exists on one machine only
- A `CHECK` silently ignored because MySQL is below 8.0.16 — check with
  `SELECT VERSION();`

When "it works on my machine" comes up, the applied-migrations list is the first
thing to compare between the two machines.
