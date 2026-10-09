---
description: Check work against the BrightBuy definition of done before opening a pull request.
disable-model-invocation: true
---

## Current changes

!`git status --short`

!`git diff dev...HEAD --stat 2>/dev/null || git diff --stat`

## Review the diff against every item

**Database**
- [ ] Schema changes are in a migration file, not manual SQL
- [ ] No existing migration was edited
- [ ] Migration runs on a fresh database
- [ ] Column names match `docs/SCHEMA.md` exactly

**Backend**
- [ ] SQL only in `*.repo.js`
- [ ] Every query uses placeholders, never concatenation
- [ ] Response shapes match `docs/API.md`
- [ ] `requireAuth` / `requireRole` where the SRS requires it
- [ ] Errors use `ApiError`, never a raw stack trace
- [ ] Correct status codes: 400 validation, 401 unauthenticated, 403 wrong role,
      409 conflict

**Frontend**
- [ ] Loading, empty, and error states present
- [ ] Money through `<Money>`, status through `<StatusBadge>`
- [ ] No hardcoded colours or off-scale spacing
- [ ] API calls through `api/client.js`

**Hygiene**
- [ ] No `console.log` left behind
- [ ] No commented-out code
- [ ] No secrets committed, `.env` not staged

Report each failure with file and line. Then draft a PR description **listing
the REQ-IDs satisfied** — e.g. `Implements REQ-3.4, REQ-3.7`. These accumulate
into the traceability matrix for the final report.
