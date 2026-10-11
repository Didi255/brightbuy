/**
 * LoadingSpinner — consistent loading indicator
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner label="Loading orders..." />
 *   <LoadingSpinner fullPage />
 *
 * Circuit Noir: three amber squares on a staggered 600ms loop. Squares, not
 * circles, and no rotation — motion here is mechanical. Under
 * prefers-reduced-motion the global rule freezes the animation, so the mono
 * label below carries the meaning on its own.
 *
 * Prefer a Skeleton shaped like the eventual layout where one is practical;
 * reserve this for cases where the layout is not yet known.
 */
import { Center, Text, Stack, Group } from '@mantine/core';

export default function LoadingSpinner({ label, fullPage = false, size = 'md', ...rest }) {
  const dot = size === 'lg' ? 8 : size === 'sm' ? 5 : 6;

  const content = (
    <Stack align="center" gap={12} {...rest}>
      <Group gap={4} wrap="nowrap" role="status" aria-live="polite" aria-label={label || 'Loading'}>
        <span className="bb-load-dot" style={{ width: dot, height: dot }} />
        <span className="bb-load-dot" style={{ width: dot, height: dot }} />
        <span className="bb-load-dot" style={{ width: dot, height: dot }} />
      </Group>
      <Text
        fz={14}
        c="ink.3"
      >
        {label || 'Loading'}
      </Text>
    </Stack>
  );

  if (fullPage) {
    return <Center style={{ minHeight: '60vh' }}>{content}</Center>;
  }

  return <Center py={48}>{content}</Center>;
}
