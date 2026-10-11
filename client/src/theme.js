/**
 * BrightBuy — Global Mantine Theme
 * OWNER: Slice C (Vidura)
 *
 * Single source of truth for colour, typography and component defaults.
 * Nobody else edits this file.
 *
 * BrightBuy is a GENERAL MERCHANDISE retailer in Sri Lanka — laptops and
 * monitors, yes, but also kitchen, cleaning, footwear and sports.
 *
 * ── Premium dark e-commerce ──────────────────────────────────────────
 * Bang & Olufsen or Nike SNKRS, not a developer-tool landing page.
 *
 *  1. WARM NEUTRALS. This is the change that makes everything else work.
 *     A cold blue-grey ramp with a warm amber accent is why the accent
 *     read as foreign. The ramp now carries the same warmth as the amber.
 *
 *  2. ONE ACCENT. Amber, for action AND state. No blue — it fought the
 *     warm ramp and read as a second brand.
 *
 *  3. ROUNDED. Small radii are a developer-tool signal; consumer retail
 *     is soft. Cards 16px, buttons pill. The pill does the most work of
 *     any single change here.
 *
 *  4. Text on an amber fill is ALWAYS black. White on amber is 2.3:1 and
 *     fails outright. Amber on the page ground is 8.9:1 and safe at any
 *     size.
 */
import { createTheme, rem } from '@mantine/core';

/* ─── warm neutral ramp ─────────────────────────────────────────────
   0 is the lightest text, 9 the page ground. Every step carries a little
   warmth, so amber sits in the same family rather than on top of it. */
const ink = [
  '#F5F0E8', // 0  primary text
  '#D8D1C6', // 1
  '#A89F93', // 2  secondary text
  '#7A7267', // 3  muted meta and captions
  '#4A443C', // 4  dividers, disabled
  '#332F2A', // 5
  '#2A2621', // 6  raised: hover, dropdowns, modals
  '#211E1B', // 7  surface: cards, inputs
  '#1A1816', // 8  alternating sections
  '#121110', // 9  page
];

/* ─── amber: the only accent ────────────────────────────────────────
   CTA, price, active and selected states. */
const brand = [
  '#FFF4E6', '#FFE3C2', '#FFCE94', '#FFB866',
  '#FFA333', // 4  hover
  '#FF8C00', // 5  THE accent
  '#E07A00', // 6  pressed
  '#B35F00', '#854700', '#573000',
];

/* ─── shared fragments ─────────────────────────────────────────────── */
export const LINE = 'rgba(255,236,214,0.10)';
export const LINE_HOT = 'rgba(255,140,0,0.28)';
export const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/** The light panel every product image sits in. */
export const TILE = '#F4F1EC';

/** In-stock indicator. The one colour outside amber, and it is a dot. */
export const STOCK = '#7BB686';

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 5,
  colors: { brand, ink },

  fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',

  /* 48 / 32 / 24 / 18 / 16 / 14. Nothing larger. */
  headings: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: rem(48), lineHeight: '1.05' },
      h2: { fontSize: rem(32), lineHeight: '1.15' },
      h3: { fontSize: rem(24), lineHeight: '1.25' },
      h4: { fontSize: rem(18), lineHeight: '1.35' },
    },
  },

  /* Soft. Cards and tiles land on lg (16px); buttons override to a pill. */
  defaultRadius: 'lg',
  radius: {
    xs: rem(6),
    sm: rem(8),
    md: rem(12),
    lg: rem(16),
    xl: rem(24),
  },

  cursorType: 'pointer',

  other: {
    line: LINE,
    lineHot: LINE_HOT,
    ease: EASE,
    tile: TILE,
    stock: STOCK,

    /* ── status colour map ────────────────────────────────────────── */
    /* A background + text PAIR per status, not a Mantine hue name.
       Two reasons: `Placed: 'blue'` was the last blue left in the app,
       and one hue cannot express "amber fill, black label" — the fill
       and the text have to be stated separately. */
    statusColors: {
      /* order statuses  */
      Placed:            { bg: '#2A2621',                fg: '#A89F93' },
      Processing:        { bg: 'rgba(255,140,0,0.15)',   fg: '#FF8C00' },
      ReadyOrOut:        { bg: '#FF8C00',                fg: '#121110' },
      DeliveredOrPicked: { bg: 'rgba(123,182,134,0.15)', fg: '#7BB686' },
      Cancelled:         { bg: '#2A2621',                fg: '#7A7267' },
      /* payment statuses */
      Pending:           { bg: 'rgba(255,140,0,0.15)',   fg: '#FF8C00' },
      Paid:              { bg: 'rgba(123,182,134,0.15)', fg: '#7BB686' },
      Failed:            { bg: 'rgba(229,72,77,0.15)',   fg: '#E5484D' },
      Refunded:          { bg: '#2A2621',                fg: '#7A7267' },
    },

    /* ── human-readable labels for ENUM strings ───────────────────── */
    statusLabels: {
      Placed:            'Placed',
      Processing:        'Processing',
      ReadyOrOut:        'Ready / Out',
      DeliveredOrPicked: 'Delivered / Picked Up',
      Cancelled:         'Cancelled',
      Pending:           'Pending',
      Paid:              'Paid',
      Failed:            'Failed',
      Refunded:          'Refunded',
    },

    /* ── delivery-mode aware labels ───────────────────────────────── */
    statusLabelsByMode: {
      standard: {
        ReadyOrOut:        'Out for Delivery',
        DeliveredOrPicked: 'Delivered',
      },
      store_pickup: {
        ReadyOrOut:        'Ready for Pickup',
        DeliveredOrPicked: 'Picked Up',
      },
    },
  },

  components: {
    /* The pill is the single highest-impact change in this theme. */
    Button:        { defaultProps: { radius: 999 } },
    ActionIcon:    { defaultProps: { radius: 999 } },
    Badge:         { defaultProps: { radius: 999 } },
    Chip:          { defaultProps: { radius: 999 } },
    Card:          { defaultProps: { radius: 'lg', shadow: 'none', withBorder: true } },
    Paper:         { defaultProps: { radius: 'lg', shadow: 'none', withBorder: true } },
    Modal:         { defaultProps: { radius: 'xl' } },
    TextInput:     { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select:        { defaultProps: { radius: 'md' } },
    NumberInput:   { defaultProps: { radius: 'md' } },
  },
});
