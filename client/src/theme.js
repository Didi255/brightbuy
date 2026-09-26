/**
 * BrightBuy — Global Mantine Theme
 * OWNER: Slice C (Vidura)
 *
 * This is the single source of truth for colours, typography, and
 * component-level overrides. Nobody else edits this file. If you need a
 * colour or spacing value that isn't here, ask in the group chat.
 */
import { createTheme, rem } from '@mantine/core';

/* ─── brand palette ─────────────────────────────────────────────────── */
const brightBlue = [
  '#e6f2ff', '#cce0ff', '#99c2ff', '#66a3ff',
  '#3385ff', '#0066ff', '#0052cc', '#003d99',
  '#002966', '#001433',
];

const brightOrange = [
  '#fff4e6', '#ffe8cc', '#ffd199', '#ffba66',
  '#ffa333', '#ff8c00', '#cc7000', '#995400',
  '#663800', '#331c00',
];

/* ─── theme ─────────────────────────────────────────────────────────── */
export const theme = createTheme({
  primaryColor: 'brightBlue',
  colors: {
    brightBlue,
    brightOrange,
  },
  fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  headings: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',

  other: {
    /* ── status colour map ────────────────────────────────────────── */
    statusColors: {
      /* order statuses  */
      Placed:            'blue',
      Processing:        'yellow',
      ReadyOrOut:        'orange',
      DeliveredOrPicked: 'green',
      Cancelled:         'gray',
      /* payment statuses */
      Pending:           'yellow',
      Paid:              'green',
      Failed:            'red',
      Refunded:          'gray',
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
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
