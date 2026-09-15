/**
 * Money — formats a DECIMAL string consistently
 * OWNER: Slice C (Vidura)
 *
 * The API sends money as a string ("1299.00") — never a float.
 * This component formats it with locale-aware thousand separators
 * and a fixed "$" prefix (BrightBuy is a Texas retailer).
 *
 * Usage:
 *   <Money value="1299.00" />          → $1,299.00
 *   <Money value="1299.00" size="xl" fw={700} />
 */
import { Text } from '@mantine/core';

function formatMoney(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Money({ value, ...textProps }) {
  return (
    <Text
      component="span"
      ff="monospace, 'Courier New', monospace"
      style={{ fontVariantNumeric: 'tabular-nums' }}
      {...textProps}
    >
      {formatMoney(value)}
    </Text>
  );
}

// Export the formatter so services can use it too
Money.format = formatMoney;
