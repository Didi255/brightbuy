# BrightBuy — final sprint plan

**For:** Group 13. Everyone has work here, and most of it is on someone other than Dihini.

Read **your section**. Each task names the files, what "done" means, and why it matters.
If something is blocked, say so in the group chat the same day — not at the deadline.

---

## 1. Where we actually are

| Person | Slice | Commits | Lines added |
|---|---|---:|---:|
| Didi255 (Dihini) | A — orders, delivery | 39 | 18,689 |
| viduraPabasara-8 (Vidura) | C — cart, checkout, UI kit | 10 | 5,473 |
| ajini-R (Ajini) | D — auth, accounts, admin | 8 | 4,563 |
| risandu26-hash (Risandu) | B — catalogue | 6 | 1,283 |
| Maathumai-03 (Maathumai) | E — payments, reports | 4 | 136 |

This is lopsided and it will be visible to the examiners, who can read the same graph. The
plan below is weighted deliberately: **Dihini's remaining list is review and integration only.**

---

## 2. The one thing that could cost us marks

**The five reports do not exist as a working feature.**

The project brief lists them as a hard requirement:

> 1. Quarterly sales report for a given year
> 2. Top-selling products in a given period
> 3. Category-wise total number of orders
> 4. Delivery time estimates for upcoming orders
> 5. Customer-wise order summary and payment status

What we actually have:

- ✅ All five stored procedures exist in the migrations and work
- ❌ `server/src/modules/reports/` is **four stub files**, 2–9 lines each, all `TODO`
- ❌ Both reports and payments are **commented out** in `server/src/app.js:18-19`
- ❌ No endpoint calls any procedure, and no screen shows one

So the hardest part — the SQL — is done, and the easy part that makes it visible is not.
**An examiner cannot mark a report they cannot run.** This is the critical path and everything
else is secondary to it.

---

## 3. Maathumai — Slice E *(the critical path)*

The procedures are already written and tested. Your job is to expose them. Copy the shape of
`server/src/modules/auth/` — it is the reference implementation.

### E1. Wire the five reports end to end  ⚠️ **do this first**

- `reports.repo.js` — one function per procedure, `CALL sp_report_...(?)`. **SQL lives only here.**
- `reports.service.js` — validate the params (year, date range, customerId). No SQL, no req/res.
- `reports.controller.js` — HTTP in/out and status codes. No SQL.
- `reports.routes.js` — the five routes, all behind `requireRole('staff')`
- **Uncomment line 19 of `server/src/app.js`**

Response envelope is already specified in `docs/API.md`: `{ "data": [...], "generatedAt": "..." }`.

**Done when:** all five respond with real rows from a seeded database, and a non-staff token gets 403.

### E2. Fix the upcoming-deliveries report

`sp_report_upcoming_deliveries` currently returns **cancelled orders**. A delivery estimate for
an order nobody is receiving is a wrong answer in a graded report.

Add `AND o.order_status != 'Cancelled'`. **Migrations are append-only** — write a new numbered
file, do not edit the old one.

### E3. The reports screen — `/staff/reports`

Five reports, `DataTable` for each, a year picker for quarterly and a date range for
top-products. Money through `<Money>`. Read `docs/UI-GUIDE.md` first.

### E4. Payments — `/orders/:orderId/pay`

- `payments.*` wired the same way, line 18 of `app.js` uncommented
- `POST /payments/card` with the mock adapter already specified in `API.md`
- **Never render or store the card number, CVV or expiry** (REQ-8.3). Only `gateway_ref`.
- The order modal already has a `Pay now` button waiting for this route

### E5. Update `docs/API.md` if any shape differs from what is written there

---

## 4. Risandu — Slice B (catalogue)

### B1. `ProductDetailPage` onto the design system

The only customer screen still on the old look. 1200px grid, gallery in `<ProductTile>`, price
in `ink.0`, add-to-cart as `.bb-price-pill`, variant selector as `.bb-chip` pills. §6 of
`docs/UI-GUIDE.md`.

### B2. Add `sort` to `GET /products`

Right now sorting happens **client-side over the current page only**, so "Price: low to high"
is simply wrong as soon as there is a second page. Add the parameter in the repo layer, and add
it to `docs/API.md`.

### B3. `/staff/catalogue` — products, categories, variants

Uses `DataTable`. The admin endpoints already exist.

### B4. Photos for the 12 new products

The catalogue was refocused on consumer electronics and toys (see DECISIONS #29). These twelve
have **no image file** and currently render as an empty tile:

```
Xbox Wireless Controller          PlayStation DualSense Controller
Logitech G502 HERO Gaming Mouse   Razer BlackShark V2 Gaming Headset
Apple Watch SE                    Samsung Galaxy Fit3 Tracker
Xiaomi Smart Band 8               LEGO Classic Creative Brick Box
Rubik's Speed Cube 3x3            Nerf Elite 2.0 Commander Blaster
Hot Wheels 20-Car Gift Pack       Sharper Image RC Stunt Car
```

Drop each into `client/public/product-images/` named as the slug of the product
(`xbox-wireless-controller.jpg`). Shot on **white** — then run
`python database/tools/tint-product-bg.py --apply`, which removes the white so they sit in the
warm tile. That script leaves white *inside* a product alone, so it is safe.

---

## 5. Vidura — Slice C (cart, checkout, UI kit)

### C1. Replace the 15 remaining mockup product images

Fifteen images still have the **product name rendered into the artwork**, so those cards show
the name twice. It is the most visible unfinished thing on the site.

Same process as B4. **Replace them as one batch** — a grid of some real photos and some mockups
looks like a bug, where all of either looks like a decision.

### C2. Checkout stepper

Match `features/orders/OrderProgress.jsx`: circles joined by a 2px line, never squares. Four
unconnected squares read as checkboxes waiting to be ticked.

### C3. Cart rows show the arithmetic

`unit price × qty`, not just a line total. Ambiguous the moment someone orders two of something.
`OrderDetailModal` already does this — copy it.

### C4. Price-range filter

Currently a dual slider over a histogram. Make it clearer: preset buckets (Under $50 /
$50–200 / $200–500 / $500+) alongside the slider, with the counts coming from the same
catalogue fetch that already feeds the histogram.

You own `client/src/theme.js`. Nobody else edits it.

---

## 6. Ajini — Slice D (auth, accounts, admin)

### D1. Two blue leaks

The last two in the app:

- `client/src/features/auth/AuditLogPage.jsx:48` — `return 'blue'`
- `client/src/features/auth/UserManagementPage.jsx:299` — `'gray' : 'blue'`

Use `<StatusBadge>` or an `ink.6` chip. Rule 1 of the UI guide is no blue anywhere.

### D2. **Edit the hero image**

Dihini will send you the source. The hero cluster illustration needs reworking — it reads as an
AI render. Either clean it up or produce a replacement.

- Transparent **PNG with a real alpha channel** — no white background, no blend modes
- Around 1600px wide, **under 400 KB**
- Save as `client/public/hero-cluster.png`, plus a 900px `hero-cluster-900.png`
- `database/tools/make-hero-cluster.py` does the background removal and both exports for you

### D3. Login and Register on the design system

Centred card on `ink.9`, `ink.7` surface, pill buttons. **Keep the login error deliberately
vague** — never reveal whether the email or the password was wrong.

### D4. `/staff/users` and `/staff/cities` with `DataTable`

---

## 7. Dihini — Slice A (done) + integration

Slice A is complete: order transaction, delivery, the concurrency harness, the order screens.
The deployment and the UI system are also done. Remaining:

- Review every PR into `dev`
- Install the backup cron on the VM, run one restore test, do the reboot test
- Final `dev` → `main` merge for the evaluation
- Keep `docs/DECISIONS.md` current

**Do not pick up tasks from sections 3–6.** The contribution graph is part of what gets marked.

---

## 8. Order of work

```
Week 1   E1  E2         ← reports reachable. Nothing else matters as much.
         B1  C2  D1
Week 2   E3  E4
         B2  B4  C1  C3  D2  D3
Week 3   B3  C4  D4
         integration, the reboot and restore tests, final merge
```

Reports before polish. A beautiful site with no reports loses marks the brief hands us for free.

---

## 9. Definition of done, for every task

- [ ] `cd client && npm run build` exits 0
- [ ] CI green on your PR — it builds the client and runs the concurrency test against a real MySQL
- [ ] The three greps in §11 of `docs/UI-GUIDE.md` return only what that section says they should
- [ ] Branch named `feat/<surname>/<what>`, PR into **`dev`**, never `main`
- [ ] PR description lists the REQ-IDs it satisfies
- [ ] New API field or column? It goes in `docs/API.md` / `docs/SCHEMA.md` **in the same PR**
- [ ] Loading, error, empty and content states all handled

## 10. Rules nobody gets to break

- SQL only in `*.repo.js`. Never a controller, never a service.
- Placeholders (`?`) always. Never string-concatenate into SQL.
- Migrations are **append-only**. New numbered file, never edit a merged one.
- Money is `DECIMAL(10,2)` in SQL and a **string** in JSON. Never `FLOAT`.
- ENUM strings are exact: `'Placed'`, not `'placed'`.
- The table is `orders`, never `order`.
- Never invent data to fill a design — no fake ratings, no fake discounts, no fake counts.
  If the database cannot support it, it does not go on screen.
