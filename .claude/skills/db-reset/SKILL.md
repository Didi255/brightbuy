---
description: Rebuild the BrightBuy database from scratch. Use when the local database is in a confusing state, or to verify migrations work on a clean database.
disable-model-invocation: true
---

Destroys all local data and rebuilds from migrations and seeds. Safe — nothing
of value lives only in the local database. If it does, that is the bug.

Confirm with the user, then:

```bash
docker compose down -v
docker compose up -d
```

Wait roughly 30 seconds for MySQL to initialise. Check with
`docker compose logs mysql | tail -5` for `ready for connections`. Connecting
early gives a confusing `ECONNREFUSED`.

Then:

```bash
cd server && npm run migrate && npm run seed
```

Report which migrations applied and which were skipped. A migration skipped as
`(no SQL yet)` is a stub nobody has written — expected.

**If this fails, the migrations are broken** and a teammate cloning the repo
would hit the same wall. Fix it rather than working around it locally.
