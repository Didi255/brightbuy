---
description: Visual craft rules for BrightBuy's interface — spacing, type, colour, motion, states, microcopy. Use for any styling, layout, or component work in client/.
paths: client/**
---

The goal is a calm, professional retail interface a stranger would trust with a
card payment. Not decorative, not obviously templated. **Restraint reads as
professional; decoration reads as amateur.**

Use the component library chosen at kickoff (see `docs/DECISIONS.md`). Configure
its theme rather than writing custom CSS. Custom CSS is where five people's work
starts to diverge.

## Spacing — the single biggest signal of quality

Use a 4px base and only these steps: **4, 8, 12, 16, 24, 32, 48, 64**. Nothing
in between. Arbitrary values like 13px or 22px are what make an interface feel
hand-assembled.

Related things sit closer than unrelated things. A label sits 4px from its
input; the next field starts 16px below. Section gaps are 32–48px. Page padding
is 24px on desktop, 16px on mobile.

Give content room. Cramped layouts read as unfinished more than any other single
flaw.

## Type

A retail interface needs about five sizes, no more:

| Role | Size | Weight |
|---|---|---|
| Page title | 28–32px | 600 |
| Section heading | 20px | 600 |
| Body / table cells | 14–15px | 400 |
| Labels, captions | 13px | 500 |
| Price display | 18–20px | 600, tabular numerals |

Line height 1.5 for body, 1.2 for headings. Line length 60–75 characters
maximum — full-width paragraphs are hard to read.

**Numbers use tabular figures** (`font-variant-numeric: tabular-nums`). In price
columns and report tables, proportional digits make rows visibly misalign. This
is a small change that makes tables look markedly more professional.

Never centre body text or form labels. Centre only a short hero line or an empty
state.

## Colour

One accent colour, used sparingly — primary buttons and active states. If
everything is emphasised, nothing is.

Most of the interface is neutral: near-black text (not pure `#000`, which is
harsh), a light grey page background, white cards. Borders should be barely
visible — a very light grey, not a hard line.

Status colours come from `theme.js` `statusColors`. Never pick your own, or the
same order status appears in two colours on two screens.

**Never rely on colour alone.** A red badge also says "Failed".

## Depth and shape

Pick one border radius and use it everywhere — 6px or 8px. Mixed radii is one of
the most visible signs of an unfinished interface.

Shadows should be almost imperceptible: a small offset with very low opacity.
Heavy drop shadows read as dated. Cards can use a light border instead of a
shadow entirely — often cleaner.

Never use gradients on buttons or cards. Never use more than one shadow depth.

## Motion

Transitions are **150–200ms, ease-out**. Faster feels abrupt, slower feels
sluggish.

Animate only `opacity` and `transform` — animating `width`, `height`, or `top`
causes visible jank.

Worth animating: hover states, modal entry, toast entry, accordion expansion.
Not worth animating: page loads, list items appearing one by one, anything
decorative. Scattered animation is a strong tell that an interface was generated
rather than designed.

Always honour `prefers-reduced-motion`.

## The states that actually matter

Most amateur interfaces have exactly one state — the happy path with data. Every
list, table, and form needs four:

**Loading** — use a skeleton matching the eventual layout, not a centred
spinner. Skeletons prevent the page jumping when data lands.

**Empty** — say what would appear here and give an action. "No orders yet.
Browse the catalogue to place your first order." Never a bare "No data".

**Error** — say what failed and what to do. "Couldn't load your orders. Check
your connection and try again," with a retry button. Never a raw error object.

**Populated** — the normal case.

Buttons additionally need a disabled and a loading state. A submit button that
stays clickable during submission produces duplicate orders.

## Forms

Labels sit above inputs, never inside as placeholders — placeholder-only labels
vanish once typing starts. Placeholders show format examples: "e.g. 0771234567".

Validate on blur, not on every keystroke. Errors appear beneath the specific
field, in red, with an icon. Never one banner listing every problem.

Mark optional fields, not required ones — in most forms nearly everything is
required, so the asterisks become noise.

Disable the submit button while submitting and change its label: "Placing
order…".

## Tables

Left-align text, **right-align numbers and currency**. This is the standard
convention and looks wrong when broken.

Row height 44–48px. Header row in a slightly heavier weight with a subtle
background. Zebra striping is unnecessary if row spacing is adequate; a light
bottom border per row is cleaner.

Long tables get a sticky header. Truncate long text with an ellipsis and show
the full value on hover.

## Microcopy

Buttons name their action: **"Place Order"**, not "Submit". **"Save Changes"**,
not "OK". The name stays consistent through the flow — a button saying "Publish"
produces a toast saying "Published".

Write from the user's side. "Your order is on its way", not "Order status
updated to dispatched".

Errors don't apologise and aren't vague. "That email is already registered", not
"An error occurred".

Sentence case for everything — buttons, headings, labels. Title Case Everywhere
looks dated.

Never expose internals. The user sees "Ready for pickup", never `ReadyOrOut`.

## The floor, always

- Visible keyboard focus rings — never `outline: none` without a replacement
- Every input has a `<label>`; every icon-only button has an `aria-label`
- Text contrast at least 4.5:1
- Nothing overflows horizontally at 375px width
- Destructive actions confirm first

## Before you call a screen done

Look at it and ask: does anything sit at an odd distance from anything else? Is
there more than one border radius? More than one shadow depth? More than five
type sizes? Is any number column left-aligned? Does the empty state say
something useful?

Chanel's rule applies: before leaving the house, remove one accessory.
