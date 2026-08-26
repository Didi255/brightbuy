---
description: Review a BrightBuy screen for professional finish and consistency. Use before marking a screen done, or during the team consistency pass.
disable-model-invocation: true
---

Review the screen the user names, or the most recently edited screen, against
`.claude/skills/design-system/SKILL.md`.

Read the component file and everything it renders. Report **specific findings
with file and line**, not general advice.

## Check, in order

**Spacing** — every value on the 4/8/12/16/24/32/48/64 scale? Any arbitrary
number? Do related elements sit closer than unrelated ones?

**Type** — more than five distinct sizes on this screen? Are prices and table
numbers using tabular figures? Is any body text centred?

**Colour** — more than one accent colour? Any hardcoded hex instead of a theme
token? Status colours from `theme.js`?

**Shape** — more than one border radius? More than one shadow depth? Any
gradient?

**States** — does every list and fetch have loading, empty, and error states?
Is the empty state actionable, or a bare "No data"? Do submit buttons disable
while submitting?

**Forms** — labels above inputs, not placeholders-as-labels? Errors beneath the
specific field? Validation on blur rather than keystroke?

**Tables** — numbers right-aligned? Row height 44–48px? Sticky header if long?

**Microcopy** — buttons name their action, not "Submit"? Sentence case? Any raw
ENUM shown to the user? Do errors say what to do next?

**Floor** — visible focus rings? Labels on inputs, `aria-label` on icon buttons?
Anything overflowing at 375px?

**Shared components** — is anything reimplemented here that already exists in
`components/ui/`? Money formatted anywhere except `<Money>`? Status rendered
anywhere except `<StatusBadge>`?

## Report as

1. **Must fix** — breaks a project rule or the accessibility floor
2. **Should fix** — visible inconsistency with other screens
3. **Consider** — would improve finish

Then name the **single highest-impact change**. Spacing inconsistency and
missing empty states are usually the two that most affect how finished a screen
looks.
