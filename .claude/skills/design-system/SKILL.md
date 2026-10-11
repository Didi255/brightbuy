---
name: design-system
description: Visual craft rules for BrightBuy's interface — spacing, type, colour, motion, states, microcopy. Use for any styling, layout, or component work in client/.
---

The direction is **Circuit Noir**: an electronics shop should look
**engineered, not decorated**. Near-black canvas, hairline borders instead of
shadows, one amber accent, oversized display type used as a graphic, and
technical data set in mono so numbers read as the output of a real inventory
system.

The tension that makes it work is **showroom warmth against spec-sheet
precision** — amber, generous product imagery and real photography inside a
rigid, visible grid.

Configure the theme rather than writing custom CSS. Custom CSS is where five
people's work starts to diverge. See `DECISIONS.md` #27 for why this replaced
the previous light direction.

## The six rules

Everything downstream follows from these.

1. **One accent.** Amber `#FF8C00` is the only accent colour. Blue survives
   *solely* inside `StatusBadge`, where colour carries meaning. Never a blue
   eyebrow, icon or border.
2. **Borders, not shadows.** `1px solid rgba(255,255,255,0.08)` replaces every
   `shadow`. Elevation is border brightness and background lift, never blur.
3. **Mono for data.** Prices, SKUs, stock counts, order IDs, spec values and
   section eyebrows are JetBrains Mono. Prose and UI chrome stay Inter.
4. **Display type is a graphic.** Headings run 40–120px in Space Grotesk,
   left-aligned, tight leading. **Never centre a heading above 40px.**
5. **Asymmetry by default.** Alternate section shape — left-rail, then
   full-bleed, then split. The reader should not be able to predict the next
   section.
6. **Motion is mechanical.** 150–250ms on `cubic-bezier(0.2, 0, 0, 1)`. Things
   slide and reveal on a grid. Nothing bounces, nothing floats.

## Colour

Tokens live in `theme.js` as the `ink` and `amber` scales. Never write a hex
literal in a component.

| Token | Value | Used for |
|---|---|---|
| `ink.9` | `#07080B` | page background |
| `ink.8` | `#0C0E13` | alternating section background |
| `ink.7` | `#12151C` | card and surface fill |
| `ink.6` | `#1A1E27` | raised surface, input fill, hover |
| `ink.4` | `#3A4252` | **dividers and disabled only** |
| `ink.3` | `#7D8699` | mono micro-labels |
| `ink.2` | `#9AA3B4` | secondary text |
| `ink.0` | `#E8EBF0` | primary text |
| `amber.5` | `#FF8C00` | the accent — CTAs, active state, focus ring |

**Contrast is not negotiable.** Amber on `ink.9` passes AA for large text and
**fails for body text at 14px**. Amber is for headings, numerals, icons,
borders and button fills. **Text on an amber fill is always black** — white on
amber is 2.3:1. Body copy stays `ink.0` or `ink.2`. `ink.3` exists precisely
because `ink.4` fails contrast for small mono labels.

**Never rely on colour alone.** A red badge also says "Failed".

Status colours come from `theme.other.statusColors`. Never pick your own, or
the same order status appears in two colours on two screens.

## Spacing — still the biggest signal of quality

4px base, only these steps: **4, 8, 12, 16, 24, 32, 48, 64**. Nothing in
between. Arbitrary values like 13px are what make an interface feel
hand-assembled.

Related things sit closer than unrelated things. Section gaps 48–96px. Page
padding 24px desktop, 16px mobile. Cramped layouts read as unfinished more
than any other single flaw.

## Type

| Role | Face | Size |
|---|---|---|
| Display | Space Grotesk 700 | headings, hero, page titles |
| UI / prose | Inter 400/500/600 | body, buttons, labels, fields |
| Data | JetBrains Mono 400/500 | prices, SKUs, IDs, eyebrows, numerics |

Display leading `0.95`, tracking `-0.03em`. Mono eyebrows: 11–12px, uppercase,
`0.18em` tracking. Body line height 1.5, line length 60–75 characters.

**Numbers use tabular figures.** `Money` already does; any hand-written
numeric column must too, or rows visibly misalign.

Never centre body text or form labels. Centre only a short hero line or an
empty state.

## Shape and motion

- `4px` for UI, `8px` for cards. Pills **only** on status badges and filter
  chips. Mixed radii is the most visible sign of an unfinished interface.
- No `shadow` anywhere. `Card` and `Paper` default to `withBorder` and
  `shadow: 'none'`.
- Transitions `150ms` for colour and border, `250ms` for transform and height.
- Animate only `opacity` and `transform`.
- Focus ring: `2px solid amber.5` at `2px` offset. Never removed.
- Always honour `prefers-reduced-motion` — `index.css` does this globally.

## The states that actually matter

Every list, table and form needs four, and most amateur interfaces have one.

**Loading** — a skeleton matching the eventual layout, not a centred spinner.
Skeletons stop the page jumping when data lands.

**Empty** — say what would appear and give an action. Never a bare "No data".

**Error** — say what failed and what to do, with a retry. Never a raw error
object.

**Populated** — the normal case.

A filtered-to-nothing result is a **fifth** state and must not say "you have
no orders".

Buttons additionally need disabled and loading states. A submit button that
stays clickable during submission produces duplicate orders.

## Forms

Labels above inputs, never as placeholders. Placeholders show format examples.
Validate on blur. Errors beneath the specific field, in red, never one banner.
Mark optional fields, not required ones. Disable submit while submitting and
change its label: "Placing order…".

## Tables

No zebra striping — hairline row rules only. Header row in mono uppercase
`ink.3` with a bottom hairline and no fill. Rows 48px. **Left-align text,
right-align numbers and currency.** Row hover lifts to `ink.7` with a 2px amber
bar on the left edge. Sticky header on scroll.

## Microcopy

Buttons name their action: "Place order", not "Submit". Sentence case
everywhere — Title Case looks dated. Write from the user's side: "Your order
is on its way", not "Order status updated to dispatched". Errors don't
apologise and aren't vague. Never expose internals — the user sees
"Ready for pickup", never `ReadyOrOut`.

## Never invent data

This project is marked on whether the interface reflects its database. Do not
put a figure on screen the schema cannot produce. There is no `review`,
`wishlist`, `promo` or `rrp` entity — so no star ratings, no review counts, no
struck-through RRPs, no "10,000+ SKUs" over a 74-SKU catalogue. Where a
component supports such a field, it renders only when the API supplies it.

## The floor, always

- Visible keyboard focus rings
- Every input has a `<label>`; every icon-only button an `aria-label`
- Real `<button>` and `<a href>`, never `onClick` on a div
- Text contrast 4.5:1 (3:1 at 24px+)
- Nothing overflows horizontally at 375px
- Destructive actions confirm first

## Before you call a screen done

Does anything sit at an odd distance from anything else? More than one radius?
Any shadow at all? Any blue outside `StatusBadge`? Any number column
left-aligned? Any heading above 40px centred? Does the empty state say
something useful? Is there white text on an amber fill?
