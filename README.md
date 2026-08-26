# BrightBuy — Retail Inventory & Online Order Management System

University of Moratuwa · Group 13
Stack: MySQL 8 · Node.js + Express · React (Vite)

## Setup (every member, once)

```bash
git clone <repo-url> && cd brightbuy
cp .env.example .env

docker compose up -d              # starts MySQL on :3306

cd server && npm install
npm run migrate                   # applies database/migrations/*.sql in order
npm run seed                      # loads reference data
npm run dev                       # http://localhost:4000

cd ../client && npm install
npm run dev                       # http://localhost:5173
```

Verify the walking skeleton: open http://localhost:5173 — it should show a green
"API + database reachable" banner. If it does, your environment is correct.

## Layout

- `database/migrations/` — schema, append-only. Never edit a merged migration.
- `database/seeds/` — reference and demo data.
- `server/src/modules/<slice>/` — routes → controller → service → repo.
  **SQL lives only in `*.repo.js`.**
- `client/src/features/<slice>/` — the screens for that slice.

See `docs/TEAM-PLAN.md` for task allocation and `docs/API.md` for the endpoint contract.
test
