/**
 * Money — formats a DECIMAL string consistently
 * OWNER: Slice C (Vidura)
 *
 * The API sends money as a string ("1299.00") — never a float.
 *
 * Usage:
 *   <Money value="1299.00" />             → $1,299
 *   <Money value="749.99" />              → $749.99
 *   <Money value="1299.00" accent />      → orange
 *
 * Three deliberate choices:
 *
 *   1. BODY FONT, not monospace. Monospace is reserved for SKU codes and
 *      order numbers — identifiers you might read aloud or copy. A price
 *      is prose, and setting it in mono is a strong generated-page tell.
 *      Tabular figures still apply so columns align.
 *
 *   2. NO SUPERSCRIPT CENTS. One size, one weight. Raised cents are a
 *      supermarket-flyer device and read as decoration here.
 *
 *   3. `.00` IS DROPPED on whole-dollar amounts. A price of $249 reads
 *      better than $249.00, and the catalogue has plenty of both. A
 *      genuine 749.99 still shows its cents.
 */
import { Text } from '@mantine/core';

const SYMBOL = '$';

function formatMoney(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return `${SYMBOL}0`;

  const whole = Number.isInteger(num) || Math.abs(num % 1) < 0.005;
  return `${SYMBOL}` + num.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export default function Money({ value, accent = false, ...textProps }) {
  return (
    <Text
      component="span"
      c={accent ? 'brand.5' : undefined}
      style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
      {...textProps}
    >
      {formatMoney(value)}
    </Text>
  );
}

// Export the formatter so services can use it too
Money.format = formatMoney;
