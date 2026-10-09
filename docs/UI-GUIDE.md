# BrightBuy — UI Collaboration Guide

Five people building screens independently will produce five different-looking applications
unless a few things are agreed up front. This file covers those things.

**Set expectations first:** the marks in CS3043 are in the database — the transaction, the
indexes, the reports. The UI needs to be **clean, consistent, and functional**. It does not need
to be beautiful. Budget accordingly: if you are spending an evening on hover animations, you are
spending it in the wrong place.

---

## 1. Decide the styling approach (kickoff, 10 minutes)

**Decide this once, as a group, before anyone writes a component.** Changing it in week 3 means
rewriting every screen.

The scaffold ships with plain inline styles, which is fine for the health banner and nothing
else. Pick one of these instead:

| Option | Learning curve | Why choose it |
|---|---|---|
| **Mantine** *(recommended)* | Low | Complete component set, theme in one file, good defaults, works cleanly with Vite |
| **MUI** | Medium | Most documentation and StackOverflow answers of any React library |
| **React-Bootstrap** | Lowest | If anyone has used Bootstrap before, this is instant familiarity |
| **Plain CSS + variables** | None | No dependency, but you build every component yourself — most work, easiest to diverge |

**Recommendation: Mantine.** A component library means nobody hand-rolls a modal or a date
picker, everything is accessible and consistent by default, and Slice C's "UI kit" becomes thin
wrappers plus a theme file rather than building primitives from scratch. That saves several days
across the team, which you can spend on SQL.

Whichever you choose matters less than choosing *once* and writing it down. Record the decision
in `DECISIONS.md`.

```bash
# if Mantine
cd client && npm install @mantine/core @mantine/hooks @mantine/dates @mantine/notifications
```

---

## 2. Agree the route map (kickoff, 10 minutes)

This matters more than it looks. Five people build screens that link to each other — if Slice B's
product card links to `/product/12` and Slice C's cart expects `/products/12`, navigation breaks
in week 3 integration.

**Proposed map. Confirm or amend at the kickoff, then treat as fixed:**

### Customer
| Route | Screen | Slice |
|---|---|---|
| `/` | Home — category tree, search, featured | B |
| `/products` | Listing with filters | B |
| `/products/:productId` | Detail with variant selector | B |
| `/cart` | Cart | C |
| `/checkout` | Checkout flow | C |
| `/checkout/success/:orderId` | Order confirmation | C |
| `/login` | Login | D |
| `/register` | Register | D |
| `/account` | Profile | D |
| `/account/addresses` | Address book | D |
| `/orders` | Order history | **A** |
| `/orders/:orderId` | Order detail + status timeline | **A** |
| `/orders/:orderId/pay` | Payment / retry | E |

### Staff
| Route | Screen | Slice |
|---|---|---|
| `/staff` | Dashboard landing | E |
| `/staff/catalogue` | Products, categories, variants | B |
| `/staff/stock` | Stock adjustments | E |
| `/staff/orders` | Order & payment console | E |
| `/staff/cities` | Main-city list | D |
| `/staff/users` | Staff & customer accounts, roles | D |
| `/staff/reports` | Five reports | E |

All `/staff/*` routes sit behind `<ProtectedRoute requireStaff>` (Slice D builds it, on Slice A's
`requireRole` middleware).

---

## 3. The theme file — one place, one owner

Slice C creates `client/src/theme.js` in week 1. **Nobody else edits it.** If you need a colour
or a spacing value that isn't there, ask — don't add a hex code to your component.

```js
// client/src/theme.js  — owner: Slice C
export const theme = {
  primaryColor: 'blue',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  colors: {
    // brand palette — agreed at kickoff, changed only by group decision
  },
  // status colours used across slices, so everyone shows the same thing
  other: {
    statusColors: {
      Placed:            'blue',
      Processing:        'yellow',
      ReadyOrOut:        'orange',
      DeliveredOrPicked: 'green',
      Cancelled:         'gray',
      Pending:           'yellow',
      Paid:              'green',
      Failed:            'red',
      Refunded:          'gray',
    },
  },
};
```

That `statusColors` map matters: order status appears in Slice D's order history, Slice E's staff
console, and Slice C's confirmation page. Without a shared map, "Placed" is blue on one screen
and grey on another, and it looks broken.

---

## 4. Who owns which components

```
client/src/
├── theme.js                    ← Slice C only
├── components/
│   ├── layout/                 ← Slice C only
│   │   ├── AppShell.jsx        navbar + container + footer
│   │   ├── Navbar.jsx          nav links, auth state, cart badge
│   │   └── PageHeader.jsx      title + breadcrumb, used by every page
│   └── ui/                     ← Slice C only
│       ├── StatusBadge.jsx     reads theme.other.statusColors
│       ├── Money.jsx           formats the DECIMAL string consistently
│       ├── DataTable.jsx       sortable table used by staff screens
│       ├── EmptyState.jsx      "no results", "cart is empty"
│       ├── ErrorAlert.jsx      renders the shared error envelope
│       └── LoadingSpinner.jsx
└── features/
    ├── orders/components/      ← Slice A's alone, do as you like
    ├── catalogue/components/   ← Slice B's alone
    ├── cart/components/        ← Slice C's alone
    ├── account/components/     ← Slice D's alone
    └── reports/components/     ← Slice E's alone
```

**The rule:** if **two or more slices** need a component, it belongs in `components/ui/` and
Slice C owns it. If only you need it, keep it in your own feature folder and build it however
you like.

**Requesting a shared component:** post in the group chat with what you need and a rough sketch.
Slice C builds it. Don't build your own version "temporarily" — temporary versions survive to
submission.

Three components everyone will need, so Slice C should build them in week 1:
`StatusBadge`, `Money`, `ErrorAlert`.

---

## 5. Wireframes — 30 minutes, paper, once

Before anyone builds screens (end of week 1 or start of week 2), sit together for half an hour
and sketch the main pages on paper or a whiteboard:

Home · Product listing · Product detail · Cart · Checkout · Order history · Staff order console
· Reports dashboard

**Low fidelity. Boxes and labels.** No colours, no fonts. The purpose is to agree *what goes
where* — does the cart summary sit on the right or the bottom? Does the staff console use tabs or
a sidebar? — not what it looks like.

Photograph them, commit to `docs/wireframes/`. Ten minutes of agreement here prevents a week 3
argument about layout.

Use Figma if someone already knows it. Do not learn Figma for this.

---

## 6. The one file everyone edits

`client/src/routes/AppRoutes.jsx` is the single shared file all five of you must touch, so it's
where merge conflicts will happen.

**Conventions to avoid that:**

1. Group routes by slice, with a comment header, in the order in the §2 table
2. Everyone adds only inside their own block
3. **Always `git pull` immediately before editing it**, and push that change promptly — don't sit
   on an uncommitted routes change for two days

```jsx
<Routes>
  {/* --- Slice B: catalogue --- */}
  <Route path="/" element={<Home />} />
  <Route path="/products" element={<ProductList />} />
  <Route path="/products/:productId" element={<ProductDetail />} />

  {/* --- Slice C: cart & checkout --- */}
  <Route path="/cart" element={<CartPage />} />
  ...
</Routes>
```

Same convention applies to `server/src/app.js`, where everyone mounts their module router.

---

## 7. Consistency rules everyone follows

These are the things that make five people's screens look like one application:

**Every page uses `PageHeader`.** Same title placement everywhere.

**Every list has three states:** loading, empty, error. Use `LoadingSpinner`, `EmptyState`,
`ErrorAlert`. A page that shows nothing while fetching looks broken.

**Every form shows field-level errors** from the `fields` object in the error envelope, next to
the relevant input — not as one banner at the top.

**Every money value goes through `<Money>`.** The API sends `"1299.00"` as a string; if everyone
formats it themselves you'll get `$1299`, `1,299.00`, and `Rs. 1299` on three different screens.

**Every status goes through `<StatusBadge>`.** Never render the raw ENUM string — the user should
see "Ready for Pickup", not `ReadyOrOut`.

**Every destructive action confirms.** Cancel order, delete cart item, deactivate product.

**Buttons say what they do.** "Place Order", not "Submit".

---

## 8. Week 4: the consistency pass

One person — ideally whoever's slice finishes first — walks every screen in the app in one
sitting and files issues for anything inconsistent. Typical findings:

- Three different button sizes on the checkout flow
- One page's table has borders, another's doesn't
- Currency formatted two ways
- A page with no loading state
- Staff screens that don't share the customer navbar

This takes about an hour and makes a disproportionate difference to how finished the project
looks in the demo. Put it in week 4, not week 5 — you need time to act on it.

---

## 9. Responsive layout

§3.1 of the SRS specifies responsive layout for desktop and mobile. Realistically:

- Build for desktop. That's what the demo runs on
- Use the component library's grid so it degrades reasonably on narrow screens
- Before submission, open each main page at mobile width and fix anything that overflows
  horizontally or overlaps

Don't build separate mobile screens. Don't spend more than an hour total on this.

---

## 10. What not to do

- **Don't add a CSS framework mid-project.** Decide at kickoff, live with it.
- **Don't hand-roll components the library provides.** You will build a worse modal.
- **Don't use a different icon set from everyone else.** Agree one (Tabler ships with Mantine;
  `lucide-react` is a good standalone).
- **Don't put business logic in components.** Compute in the service layer or the API; components
  render.
- **Don't polish before week 4.** Working screens across all five slices beats two beautiful
  screens and three missing ones.
