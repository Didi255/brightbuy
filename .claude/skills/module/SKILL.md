---
description: Add or extend a backend Express module for BrightBuy, keeping SQL in the repo layer. Use when adding endpoints, controllers, services, or queries.
---

Follow `server/src/modules/auth/` — the reference implementation.

## What belongs where

| File | Contains | Never contains |
|---|---|---|
| `<name>.routes.js` | URL → controller wiring, middleware | logic, SQL |
| `<name>.controller.js` | request parsing, status codes, response shaping | SQL, business rules |
| `<name>.service.js` | business rules, validation, orchestration | SQL, `req`/`res` |
| `<name>.repo.js` | SQL only | anything else |

**SQL in a controller or service is a project rule violation** and gets the PR
rejected. This is a database course — every query lives in one predictable place
so it can be found, reviewed, and defended at the viva.

## Queries

- Always placeholders (`?`), never concatenation. This prevents SQL injection
  and evaluators look for it.
- Multi-statement work uses `withTransaction` from `config/db.js`.
- For `sp_place_order`, call the procedure and let MySQL own the transaction
  boundary — do not wrap it in a JS transaction as well.
- Translate `snake_case` columns to `camelCase` JSON here, not in the UI.

## Errors

```js
throw ApiError.conflict('INSUFFICIENT_STOCK', 'Only 2 left in stock');
throw ApiError.badRequest('Email already registered', { email: 'already in use' });
```

Never send a raw stack trace.

## Before finishing

- Response matches `docs/API.md` exactly
- `requireAuth` / `requireRole` applied where the SRS requires it
- Router mounted in `server/src/app.js`
- Tested with curl before any UI is built against it
