/**
 * PriceHistogram — the price distribution behind the range slider.
 * OWNER: Slice B
 *
 * WHERE THE DATA COMES FROM: the page fetches the whole catalogue once
 * (43 rows) and passes every product's price in. These are real counts,
 * not a decorative shape.
 *
 * It is deliberately NOT a server-side `GROUP BY`. That would mean a new
 * endpoint, and API.md is binding on five people — adding one silently is
 * exactly what the project rules forbid. If the catalogue ever outgrows a
 * single fetch, this moves server-side and only the prop changes.
 */
import { useMemo } from 'react';
import { Box } from '@mantine/core';

export default function PriceHistogram({
  values = [], bounds = [0, 1], range, bars = 28, height = 48,
}) {
  const [lo, hi] = bounds;
  const [selLo, selHi] = range ?? bounds;

  const buckets = useMemo(() => {
    const out = new Array(bars).fill(0);
    if (!(hi > lo)) return out;
    for (const v of values) {
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      /* the dearest product lands exactly on `hi`, which would index one
         past the end — clamp rather than drop it */
      const i = Math.floor(((n - lo) / (hi - lo)) * bars);
      out[Math.min(bars - 1, Math.max(0, i))] += 1;
    }
    return out;
  }, [values, lo, hi, bars]);

  const peak = Math.max(1, ...buckets);
  const span = (hi - lo) / bars;

  return (
    <Box
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}
    >
      {buckets.map((n, i) => {
        const mid = lo + span * (i + 0.5);
        const inRange = mid >= selLo && mid <= selHi;
        return (
          <Box
            key={i}
            style={{
              flex: 1,
              /* a 2px floor, so an empty bucket still reads as a bucket
                 rather than as a gap in the chart */
              height: Math.max(2, Math.round((n / peak) * height)),
              borderRadius: 2,
              background: 'var(--mantine-color-brand-5)',
              opacity: inRange ? 1 : 0.3,
              transition: 'opacity 160ms linear',
            }}
          />
        );
      })}
    </Box>
  );
}
