/**
 * Money — formats a DECIMAL string consistently
 * OWNER: Slice C (Vidura)
 *
 * The API sends money as a string ("231990.00") — never a float.
 *
 * Usage:
 *   <Money value="231990.00" />           → Rs 231,990
 *   <Money value="4490.50" />             → Rs 4,490.50
 *   <Money value="231990.00" accent />    → orange
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
 *   3. `.00` IS DROPPED on whole-rupee amounts. Almost every price in this
 *      catalogue is whole rupees, so printing ".00" forty-four times adds
 *      noise and nothing else. A genuine 4,490.50 still shows its cents.
 */
import { Text } from '@mantine/core';

const SYMBOL = 'Rs';

function formatMoney(value) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num == null || isNaN(num)) return `${SYMBOL} 0`;

  const whole = Number.isInteger(num) || Math.abs(num % 1) < 0.005;
  return `${SYMBOL} ` + num.toLocaleString('en-US', {
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
