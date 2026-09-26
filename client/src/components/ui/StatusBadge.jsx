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
 */
import { Badge, useMantineTheme } from '@mantine/core';

export default function StatusBadge({ status, deliveryMode, size = 'sm', ...rest }) {
  const theme = useMantineTheme();
  const colors = theme.other?.statusColors || {};
  const labels = theme.other?.statusLabels || {};
  const byMode = theme.other?.statusLabelsByMode || {};

  const color = colors[status] || 'gray';

  let label = labels[status] || status;
  if (deliveryMode && byMode[deliveryMode]?.[status]) {
    label = byMode[deliveryMode][status];
  }

  return (
    <Badge
      color={color}
      variant="light"
      size={size}
      radius="sm"
      style={{ fontWeight: 600, textTransform: 'none' }}
      {...rest}
    >
      {label}
    </Badge>
  );
}
