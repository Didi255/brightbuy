---
description: Build a React screen for BrightBuy using the shared UI kit and agreed route map. Use when creating or editing pages, forms, or components in client/.
---

Read `.claude/skills/design-system/SKILL.md` for the visual rules. This file
covers structure and ownership.

## Before building

1. Check `docs/UI-GUIDE.md` §2 for the route this screen belongs at. Routes are
   agreed across the team — never invent one.
2. Check `client/src/components/ui/` for an existing shared component. If two
   slices need a component it belongs there and Slice 3 owns it — request it in
   the group chat rather than building a local copy. "Temporary" local copies
   survive to submission.
3. Feature-local components go in `client/src/features/<slice>/components/`.

## Structure

- `PageHeader` at the top of every page, for consistent title placement
- Loading, empty, and error states on every list and fetch
- Field-level validation errors from the `fields` object in the error envelope

## Never reimplement

- Money → `<Money>`. The API sends `"1299.00"` as a string; formatting locally
  produces three different currency styles across the app.
- Status → `<StatusBadge>`. The user sees "Ready for pickup", never
  `ReadyOrOut`.
- Colours and spacing → `theme.js`. Never a hex code in a component.
- API calls → `client/src/api/client.js`, which attaches the JWT and unwraps the
  error envelope. Never call `fetch` directly.

## Rules

- No business logic in components. Compute server-side or in a service.
- Destructive actions confirm first.
- Run `/ui-polish` before calling the screen done.
