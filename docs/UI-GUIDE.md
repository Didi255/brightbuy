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
picker, everything is accessible and consistent by default, and Slice 3's "UI kit" becomes thin
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

This matters more than it looks. Five people build screens that link to each other — if Slice 2's
product card links to `/product/12` and Slice 3's cart expects `/products/12`, navigation breaks
in week 3 integration.

**Proposed map. Confirm or amend at the kickoff, then treat as fixed:**

### Customer
| Route | Screen | Slice |
|---|---|---|
| `/` | Home — category tree, search, featured | 2 |
| `/products` | Listing with filters | 2 |
| `/products/:productId` | Detail with variant selector | 2 |
| `/cart` | Cart | 3 |
| `/checkout` | Checkout flow | 3 |
| `/checkout/success/:orderId` | Order confirmation | 3 |
| `/login` | Login | 4 |
| `/register` | Register | 4 |
| `/account` | Profile | 4 |
| `/account/addresses` | Address book | 4 |
| `/orders` | Order history | **1** |
| `/orders/:orderId` | Order detail + status timeline | **1** |
| `/orders/:orderId/pay` | Payment / retry | 5 |

### Staff
| Route | Screen | Slice |
|---|---|---|
| `/staff` | Dashboard landing | 5 |
| `/staff/catalogue` | Products, categories, variants | 2 |
| `/staff/stock` | Stock adjustments | 5 |
| `/staff/orders` | Order & payment console | 5 |
| `/staff/cities` | Main-city list | 4 |
| `/staff/users` | Staff & customer accounts, roles | 4 |
| `/staff/reports` | Five reports | 5 |

All `/staff/*` routes sit behind `<ProtectedRoute requireStaff>` (Slice 4 builds it, on Slice 1's
`requireRole` middleware).

---

## 3. The theme file — one place, one owner

Slice 3 creates `client/src/theme.js` in week 1. **Nobody else edits it.** If you need a colour
or a spacing value that isn't there, ask — don't add a hex code to your component.

```js
// client/src/theme.js  — owner: Slice 3
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

That `statusColors` map matters: order status appears in Slice 4's order history, Slice 5's staff
console, and Slice 3's confirmation page. Without a shared map, "Placed" is blue on one screen
and grey on another, and it looks broken.

---

## 4. Who owns which components

```
client/src/
├── theme.js                    ← Slice 3 only
├── components/
│   ├── layout/                 ← Slice 3 only
│   │   ├── AppShell.jsx        navbar + container + footer
│   │   ├── Navbar.jsx          nav links, auth state, cart badge
│   │   └── PageHeader.jsx      title + breadcrumb, used by every page
│   └── ui/                     ← Slice 3 only
│       ├── StatusBadge.jsx     reads theme.other.statusColors
│       ├── Money.jsx           formats the DECIMAL string consistently
│       ├── DataTable.jsx       sortable table used by staff screens
│       ├── EmptyState.jsx      "no results", "cart is empty"
│       ├── ErrorAlert.jsx      renders the shared error envelope
│       └── LoadingSpinner.jsx
└── features/
    ├── orders/components/      ← Slice 1's alone, do as you like
    ├── catalogue/components/   ← Slice 2's alone
    ├── cart/components/        ← Slice 3's alone
    ├── account/components/     ← Slice 4's alone
    └── reports/components/     ← Slice 5's alone
```

**The rule:** if **two or more slices** need a component, it belongs in `components/ui/` and
Slice 3 owns it. If only you need it, keep it in your own feature folder and build it however
you like.

**Requesting a shared component:** post in the group chat with what you need and a rough sketch.
Slice 3 builds it. Don't build your own version "temporarily" — temporary versions survive to
submission.

Three components everyone will need, so Slice 3 should build them in week 1:
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
  {/* --- Slice 2: catalogue --- */}
  <Route path="/" element={<Home />} />
  <Route path="/products" element={<ProductList />} />
  <Route path="/products/:productId" element={<ProductDetail />} />

  {/* --- Slice 3: cart & checkout --- */}
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
