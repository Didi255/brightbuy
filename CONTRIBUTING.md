# Contributing

## Branches
- `main` — protected, release-ready, tagged at each demo
- `dev` — integration branch, all PRs target this
- `feat/<surname>/<slice>-<thing>` — your work. Also `fix/`, `db/`, `docs/`

## Commits
`type(scope): message` — e.g. `feat(auth): add JWT verification middleware`
Types: feat, fix, db, docs, test, chore

## Pull requests
1. Target `dev`, never `main`.
2. One reviewer, round-robin: M1 → M2 → M3 → M4 → M5 → M1.
3. The description must list the REQ-IDs satisfied, e.g. `Implements REQ-4.1, REQ-4.3`.
4. Rebase on `dev` before requesting review.

## Migrations
- **Append-only.** Once a migration is merged it is frozen. Need a change? Write a new file.
- Claim your migration number in the group chat before creating the file.
- Reserved: 001 M1 · 002 M2 · 003 M3 · 004 M4 · 005 M5 · 006 indexes · 007 order procs
  · 008 report procs · 009 triggers

## Definition of done
- [ ] Migration runs clean on a fresh DB
- [ ] Correct data and HTTP status codes
- [ ] Errors use the shared envelope, never a raw stack trace
- [ ] Auth / role checks where the SRS requires them
- [ ] UI works against the real API, with loading and error states
- [ ] SQL only in `*.repo.js`
- [ ] REQ-IDs listed in the PR
- [ ] Reviewed and approved by one teammate
