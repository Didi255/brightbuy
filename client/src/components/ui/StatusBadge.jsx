/**
 * StatusBadge — renders order/payment status with consistent colours
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <StatusBadge status="Placed" />
 *   <StatusBadge status="ReadyOrOut" deliveryMode="store_pickup" />
 *
 * Reads colour and label from theme.other.statusColors / statusLabels.
 * When deliveryMode is supplied, uses the mode-aware label
 * (e.g. "Ready for Pickup" vs "Out for Delivery").
 *
 * Circuit Noir: this is the ONLY component allowed a colour other than
 * amber, because here colour carries meaning rather than emphasis. Never
 * colour alone though — the label always says the status in words too.
 *
 * The dot pulses for the two statuses that are still in motion, so a staff
 * console shows at a glance what is live. Frozen under prefers-reduced-motion
 * by the global rule in index.css.
 */
import { Box, Group, Text, useMantineTheme } from '@mantine/core';

/* Statuses that mean "something is still happening". */
const LIVE = new Set(['Processing', 'ReadyOrOut', 'Pending']);

export default function StatusBadge({ status, deliveryMode, size = 'sm', ...rest }) {
  const theme = useMantineTheme();
  const colors = theme.other?.statusColors || {};
  const labels = theme.other?.statusLabels || {};
  const byMode = theme.other?.statusLabelsByMode || {};

  /* Each status carries its own background and text colour. Most tint
     (Processing, Paid), one fills solid (ReadyOrOut) — which is exactly
     why this cannot be derived from a single hue. */
  const tone = colors[status] || { bg: '#2A2621', fg: '#7A7267' };

  let label = labels[status] || status;
  if (deliveryMode && byMode[deliveryMode]?.[status]) {
    label = byMode[deliveryMode][status];
  }

  return (
    <Group
      component="span"
      gap={4}
      wrap="nowrap"
      style={{
        display: 'inline-flex',
        height: size === 'lg' ? 28 : 24,
        padding: '0 10px',
        borderRadius: 999,
        background: tone.bg,
      }}
      {...rest}
    >
      <Box
        component="span"
        className={LIVE.has(status) ? 'bb-status-dot--live' : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: tone.fg,
          flexShrink: 0,
        }}
      />
      <Text
        component="span"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: tone.fg,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Text>
    </Group>
  );
}
