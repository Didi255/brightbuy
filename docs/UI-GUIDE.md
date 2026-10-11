# BrightBuy — UI Guide

**Binding.** AGENTS.md names this file as the authority on styling, the route map, and
component ownership.

This is the conformance guide for the `redesign/ui` branch. Work through **§9, your slice's
checklist** — the sections before it are the reference you'll need while you do.

Rule of thumb for everything here: **if you are typing a hex code, a pixel radius, or a
duration into a component, stop.** It already exists as a token.

---

## 1. The rules

| # | Rule | Why |
|---|---|---|
| 1 | **No blue. No purple. No indigo.** | Amber is the only accent. Colour that isn't amber must *mean* something (status). |
| 2 | **Amber is action, never decoration.** | Buttons, links, the active state. Not headings, not borders, not money. |
| 3 | **Money is `ink.0`.** | `<Money value={x} />`. Never `c="blue"`, never amber. |
| 4 | **Every product image sits in a `#F4F1EC` tile**, `object-fit: contain`. | Use `<ProductTile>`. Photos have inconsistent backgrounds; the tile hides that. |
| 5 | **Page content lives in a 1200px centred column**, `padding: 0 24px`. | The hero is the only full-bleed exception. |
| 6 | **Titles clamp to two lines** with `minHeight: '2.8em'`. | Cards in a row must be the same height whether the title is short or long. |
| 7 | **Never render a raw ENUM.** | `'pending'` is a database value. Use `<StatusBadge>` or `statusLabels`. |
| 8 | **Never render a zero count.** | Hide the badge instead. `{n > 0 && <Badge/>}` |
| 9 | **Don't build a control the API can't serve.** | A filter that returns nothing is worse than no filter. See §10. |
| 10 | **Animate `transform` and `opacity` only**, and honour `prefers-reduced-motion`. | Anything else repaints. The global reduced-motion block is at the bottom of `index.css`. |
| 11 | **No element may default to `opacity: 0` waiting for JS.** | A reveal that misses leaves a blank section, not a missing animation. See §13. |
| 12 | **Product images carry no white background.** | They sit in a `#F4F1EC` tile; a white JPEG shows as a second tile inside the first. |

---

## 2. Tokens — `client/src/theme.js`

**Nobody adds a colour here without asking.** Five people build against this file.

### The ink ramp

| Token | Hex | Use for |
|---|---|---|
| `ink.0` | `#F5F0E8` | primary text, **money** |
| `ink.1` | `#D8D1C6` | secondary headings |
| `ink.2` | `#A89F93` | secondary text, captions |
| `ink.3` | `#7A7267` | muted meta |
| `ink.4` | `#4A443C` | dividers, disabled |
| `ink.6` | `#2A2621` | raised: hover, dropdowns, chips |
| `ink.7` | `#211E1B` | **surface: cards, inputs** |
| `ink.8` | `#1A1816` | alternating sections |
| `ink.9` | `#121110` | **page background** |

### Everything else

```js
import { LINE, LINE_HOT, EASE, TILE, STOCK } from '../theme';

LINE      // rgba(255,236,214,0.10)  every hairline border
LINE_HOT  // rgba(255,140,0,0.28)    border on hover
EASE      // cubic-bezier(0.2, 0, 0, 1)
TILE      // #F4F1EC                 product image tiles
STOCK     // #7BB686                 in-stock green
```

`brand.5` is `#FF8C00` — the one accent. `defaultRadius` is `lg`; `Button`, `ActionIcon`,
`Badge` and `Chip` are all `radius: 999` (pills) by default, so **don't pass `radius`**.

### Status colours

`theme.other.statusColors` holds a `{ bg, fg }` **pair** per status, not a Mantine hue name.
One hue can't express "amber fill, black label". **Only `StatusBadge` reads this** — if you
need a status chip, use the component.

---

## 3. The page skeleton

Every screen below the hero:

```jsx
<Box component="section" py={96} style={{ background: 'var(--mantine-color-ink-9)' }}>
  <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
    {/* content */}
  </Box>
</Box>
```

That `maxWidth: 1200 / padding: 0 24px` is the page grid. **Every section shares it**, so
every heading on the page lines up on one left edge. Alternate `ink.9` and `ink.8` backgrounds
between sections for rhythm.

A section header with a right-hand link uses `.bb-cat-head` (see §6) — the link sits on the
**heading's baseline**, not the centre of the block.

---

## 4. The shared kit — use it, don't rebuild it

`client/src/components/ui/`

| Component | Use when |
|---|---|
| `ProductCard` | Any product in a grid or rail. `variant="compact"` for cart rows and order lines. |
| `ProductTile` | The `#F4F1EC` image tile on its own. |
| `ProductRail` | A horizontal strip of cards. |
| `Money` | Any amount. `Money.format(x)` for a bare string. |
| `StatusBadge` | Any order or payment status. |
| `CategoryChips` | Horizontal category selector. |
| `PriceHistogram` | Price distribution behind a range slider. |
| `EmptyState` | No results. Always give it an action. |
| `ErrorAlert` | A failed fetch. Always give it a retry. |
| `LoadingSpinner` / `ProductCardSkeleton` | Loading. Skeletons for grids, spinner otherwise. |
| `DataTable` | Staff tables. |
| `Reveal` | Scroll-reveal wrapper. |

**Every screen needs all four states**: loading → error → empty → content. A screen that only
handles the happy path is not finished.

---

## 5. Utility classes — `client/src/index.css`

`index.css` was pruned from 1796 lines to 999: 72 classes and 19 CSS
variables from the pre-redesign home page had no markup left. **If you are
about to use a class you remember from before, check it still exists.** The
whole `.bb-scroll-reveal` / `.bb-slide-left` / `.bb-slide-right` system is
gone — `.bb-observe` is the only reveal mechanism now.

| Class | Effect |
|---|---|
| `.bb-press` | Press-down feedback on a button. |
| `.bb-observe` | Scroll-reveal target. Pair with `useReveal()`. Never hides content — see §13. |
| `.bb-catalogue-grid` | 3 / 2 / 1 columns at 1280 / 768 / below, 20px gap. |
| `.bb-filter-card` | Filter card surface: `ink.7`, 16px radius, 1px border, 20px pad. |
| `.bb-chips` · `.bb-chips__track` · `.bb-chip` / `--on` | Horizontal scrolling pill row with a right-edge fade. |
| `.bb-carousel` · `__track` · `__cell` | Paged carousel. Set `--per` and `--page` inline. |
| `.bb-price-pill` | The outlined amber price button. |
| `.bb-heart` / `--on` | 32px favourite button on a tile. |
| `.bb-brand-mark` | 24px initial disc where a logo would go. |
| `.bb-price-chip` | Small `ink.6` value pill. |
| `.bb-cat-head` | Section header: heading left, link right, one baseline. |
| `.bb-delivery` · `__stats` · `.bb-stat-card` | The delivery band's 46/8/46 grid and its stat cards. |
| `.bb-rail` | Free-scrolling horizontal strip (ProductRail). |
| `.bb-visually-hidden` | Screen-reader-only text. Unused today, kept deliberately. |

---

## 6. Patterns

### The product card

The price **is** the button. There is no full-width button underneath it — that said the same
thing twice and cost the card 40px.

```
┌─────────────────────────┐
│ [♡]   image on #F4F1EC  │  heart: 32px, top-right
├─────────────────────────┤
│ Product name over two   │  16px/600, clamp 2, minHeight 2.8em
│ lines if it needs them  │
│ Brand · Category        │  14px ink.2
│ R̶s̶ ̶2̶2̶5̶,̶9̶9̶0̶  [🛒 Rs 194,990] │  struck ink.3, then .bb-price-pill
└─────────────────────────┘
```

Hover: `translateY(-6px)`, border → `LINE_HOT`, `box-shadow: var(--glow-lift)`.

### Filters

Separate cards with 16px gaps, **not one panel**. Each has a 13px amber `Reset` top-right.
Categories are **chips across the top**, never a list down the side — that frees the rail for
filters that actually filter.

### Status

Use `<StatusBadge status={...} deliveryMode={...} />`. Never print the enum. Never state the
same status more than twice on one screen — a header badge plus a stepper is the limit; a
third "Status: pending" field is noise *and* an enum leak.

### The order stepper

Circles joined by a line. **Squares with no connector read as checkboxes waiting to be
ticked.** 20px circles, 2px track, amber before a reached step and
`rgba(255,236,214,0.12)` after.

### Destructive and financial actions

Don't offer an action the data doesn't support. `Download invoice` must not render on an
unpaid order — an invoice asserts money changed hands. Show **nothing** in its place, not a
disabled ghost button.

### Carousels

Paged, never a continuous drift — cards must sit still long enough to read
a price and press a button. 4 / 3 / 2 / 1 cards by breakpoint, advancing one
page every 6s, looping, with page **dots** rather than an "n of m" counter.

It pauses for three independent reasons, kept as separate state because they
switch off at different moments: pointer hover, keyboard focus anywhere
inside (use `onFocusCapture`, so the heart and the price pill count), and
`document.hidden`. Under `prefers-reduced-motion` there is no auto-advance
at all and the arrows still work.

The page shift is **not** 100%. With `n` cards and a gap `g`, one page
measures `100% + g`; shift by 100% alone and the track creeps left by one
gap per page.

### Product imagery

Every product image sits in a `#F4F1EC` tile via `<ProductTile>`, and the
image itself must have **no white background** — an opaque white JPEG renders
as a second, nested tile and makes the product look small and inset.

[tint-product-bg.py](../database/tools/tint-product-bg.py) fixes a photo
shot on white: it flood-fills inward from the border, so white *enclosed* by
the product (a sneaker sole, earbuds, a shirt) survives. A global threshold
would punch holes straight through those. Originals are backed up to
`database/scratch/sources/` before anything is written.

**22 of the 43 product images are generated mockups with the product name
rendered into the artwork**, so the card shows the name twice. Tinting cannot
help those; they need replacing. Replace them in one batch — a grid of some
real photos and some mockups looks like a bug, where all of either looks like
a decision.

### Button hierarchy

One filled button per view. Everything else is a ghost (1px neutral border) or a text link.
Three buttons of equal weight means none of them is the answer.

---

## 7. Motion

| Thing | Spec |
|---|---|
| Hover / press | 160–240ms, `EASE` |
| Scroll reveal | 420ms, max 24px travel, **once** (the hook unobserves) |
| Stagger | 40–50ms per item, never more than 400ms total |
| Idle loops | Give each a different duration — 7s / 9s / 11s / 13s. Shared factors make them visibly lock into step. |

One animation **per property per element**. Two `@keyframes` both touching `transform` do not
compose — the last one declared silently wins. Split them across nested elements.

Everything goes in the `prefers-reduced-motion` block at the bottom of `index.css`. Name every
layer explicitly; miss one and it keeps animating alone.

---

## 8. Route map (unchanged, still binding)

**Customer:** `/` `/products` `/products/:productId` (B) · `/cart` `/checkout`
`/checkout/success/:orderId` (C) · `/login` `/register` `/account` `/account/addresses` (D) ·
`/orders` `/orders/:orderId` (A) · `/orders/:orderId/pay` (E)

**Staff:** `/staff` `/staff/stock` `/staff/orders` `/staff/reports` (E) · `/staff/catalogue`
(B) · `/staff/cities` `/staff/users` (D)

All `/staff/*` sit behind `<ProtectedRoute requireStaff>`.

---

## 9. Your slice — what to change

### Everyone, first

```bash
git checkout dev && git merge redesign/ui    # or rebase your branch on it
cd client && npm install && npm run dev
```

Then on **every screen you own**:

- [ ] Wrap content in the 1200 / 24px grid (§3). Check your headings line up with the ones above and below.
- [ ] Replace every hardcoded hex with a token (§2).
- [ ] Replace raw `<img>` on products with `<ProductTile>`.
- [ ] Replace hand-rolled status text with `<StatusBadge>`.
- [ ] Confirm all four states exist: loading, error, empty, content.
- [ ] One filled button only. Rest ghost or text link.
- [ ] Run the checks in §11.

### Slice A — Orders *(Dihini)*

Done on this branch. `OrderHistoryPage`, `OrderDetailModal`, `OrderProgress` all conform.
Nothing to migrate.

### Slice B — Catalogue

`HomePage` and `ProductListPage` are done on this branch.

- [ ] **`ProductDetailPage`** is the remaining one. Bring it to the 1200 grid, put the gallery
      in `ProductTile`, make the price `ink.0`, use the `.bb-price-pill` treatment for
      add-to-cart, and give the variant selector pill chips (`.bb-chip`).
- [ ] **`/staff/catalogue`** — use `DataTable`, not a hand-rolled table.
- [ ] `GET /products` has **no `sort` parameter**. Sorting is currently client-side over the
      current page only, which is wrong once there's more than one page. Add `sort` to the API
      (and to `docs/API.md`) or drop the control.

### Slice C — Cart & checkout *(Vidura)*

Three blue leaks, all on money, all one token each:

- [ ] `cart/CartPage.jsx:249` — `c="blue"` → remove (Money defaults to `ink.0`)
- [ ] `cart/CheckoutPage.jsx:285` — same
- [ ] `cart/CheckoutSuccessPage.jsx:145` — same
- [ ] Cart rows: use `<ProductCard variant="compact">`, and show `unit × qty`, not just a line total.
- [ ] Checkout steps: if you have a stepper, match `OrderProgress` — circles joined by a line.

You own `theme.js`. The status palette changed shape this branch (`{bg, fg}` pairs) — read §2.

### Slice D — Auth & admin *(Ajini)*

- [ ] `auth/UserManagementPage.jsx:299` — blue staff badge → `<StatusBadge>` or an `ink.6` chip
- [ ] `auth/AuditLogPage.jsx:48` — `return 'blue'` → an ink token
- [ ] `LoginPage` / `RegisterPage` — centred card on `ink.9`, `ink.7` surface, pill buttons.
      Keep the login error deliberately vague: never reveal whether it was the email or the password.
- [ ] `/staff/users`, `/staff/cities` — `DataTable`.

### Slice E — Payments, staff console, reports

- [ ] `StaffDashboardPage` — stat tiles on `ink.7`, numbers in `ink.0`, labels `ink.2`.
- [ ] `/orders/:orderId/pay` — card form on `ink.7`. **Never render or store the card number,
      CVV or expiry** (REQ-8.3). Only `gateway_ref`.
- [ ] Reports — `DataTable` for every one. Money through `<Money>`.
- [ ] `sp_report_upcoming_deliveries` still returns cancelled orders. Needs
      `AND o.order_status != 'Cancelled'`.

---

## 10. Known blockers — don't build these yet

These need backend that doesn't exist. **Don't fake them.**

| Feature | Blocked on |
|---|---|
| Star ratings / reviews | No `review` table in `SCHEMA.md` |
| "On sale", struck-through original price | **No discount column anywhere in the schema** |
| "In stock only" filter | `GET /products` returns no stock figure |
| Delivery-mode product filter | `delivery_mode` is a checkout choice, not a product attribute |
| "Top item" badge | Order counts are behind `/reports/top-products`, which is **staff-only** |
| Lifestyle feature cards | No lifestyle photography |
| Favourites page / sync | No `favourite` table — hearts are localStorage, per-browser |

If you need one of these, the fix is a migration plus an `API.md` entry, agreed with the team
— **not** a hardcoded value in a component.

---

## 11. Before you push

```bash
cd client && npm run build
```

Must exit 0. Then three greps:

```bash
# A — stray colour. Should return ONLY the rows still listed in §9.
grep -rnE "'blue'|\"blue\"|indigo|purple|#6C4FE0" src --include=*.jsx --include=*.js

# B — raw hex in components. Should return ONLY the definitions below.
grep -rnE "#(F5F0E8|A89F93|7A7267|2A2621|211E1B|121110|F4F1EC)" src --include=*.jsx

# C — full-width solid buttons on cards. Should be empty.
grep -rn "fullWidth" src/components/ui
```

**Grep A** currently returns the five leaks assigned in §9 — three in Slice C, two in Slice D.
When those are fixed it returns nothing. Anything else it finds is yours.

**Grep B** is noisy by design: it finds definitions as well as violations. These five are
**correct** and must stay — ignore them, chase anything else:

| Hit | Why it is fine |
|---|---|
| `ProductTile.jsx` — `TILE_BG` | defines the tile colour |
| `HomeUI.jsx` — `TILE` | same, local to the home sections |
| `HomeUI.jsx` — hero scrim gradient | a multi-stop gradient, not a token slot |
| `HomeUI.jsx` — hero ghost button border | an alpha of `ink.0`, no token exists |
| `StatusBadge.jsx` — fallback `{bg, fg}` | the default for an unknown status |

**Grep C** must be empty. A card never carries a full-width solid button — the price pill is
the action.

---

## 12. What not to do

- Don't add a hex code to a component. Ask for a token.
- Don't add an API field or column without it going into `API.md` / `SCHEMA.md` first.
- Don't invent data to fill a design — no fake ratings, no fake discounts, no fake counts.
- Don't glow every card in a grid. Hover only, one card at a time.
- Don't use `useState` for mousemove or scroll handlers — write to the node through a ref
  inside a `requestAnimationFrame` loop.
- Don't put source assets in `client/public/`. They ship to every visitor. Consumed sources
  live in `database/scratch/sources/` (gitignored).

---

## 13. Gotchas that have already bitten us

Each of these cost real debugging time on this branch. They are written down
so nobody pays for them twice.

**A reveal must never be the thing that makes content visible.**
`.bb-observe` used to be `opacity: 0`, revealed when an IntersectionObserver
added `.bb-in`. Three whole sections of the home page silently vanished,
because any miss — a short block, a layout shift, an `overflow: hidden`
ancestor, a threshold never reached — hides the content permanently rather
than skipping an animation. The resting state is now `opacity: 1` and the
entrance uses `animation-fill-mode: backwards`. Same animation, but no JS
failure can blank the page.

**One animation per property per element.** Two `@keyframes` that both touch
`transform` do not compose: the last declared silently wins and the other is
dropped. Split them across nested elements.

**Declaring a class twice is a silent bug.** `.bb-observe` was defined in two
places with different animations and different staggers; whichever came last
in the file won. Search before you add.

**`ImageDraw.floodfill` does nothing on an `Image.fromarray()` image.** That
image shares a read-only buffer with numpy, the pixel write fails without
raising, and you get back exactly what you put in. Use `Image.frombytes`.
This silently broke two asset scripts.

**`GET /products` caps `pageSize` at 100.** `MAX_PAGE_SIZE` in
`catalogue.service.js`. Ask for more and it is a 400 — which, behind a
`.catch(() => {})`, looks like an empty brand list and a dead price slider.

**React Router does not reset scroll.** `routes/ScrollToTop.jsx` does, keyed
on `pathname` only. Never key it on `search`, or changing a filter yanks the
grid to the top.

**The cart is keyed by `variantId`, which `GET /products` does not return.**
So a grid card cannot simply add to cart. One in-stock variant may be added
outright; anything else must send the customer to the product page to choose.
Never guess a variant for them.

**Verification greps match your own comments.** Three of my acceptance checks
"failed" on prose inside the comment explaining the fix. Exclude comments, or
grep for the JSX element (`<ProductCard`) rather than the bare word.
