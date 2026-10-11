/**
 * NotFoundPage — the 404.   OWNER: shared
 *
 * A giant mono numeral sits behind the heading as a graphic, in ink.6 so it
 * reads as texture rather than content. Centred is allowed here: the design
 * rules reserve centring for short hero lines and empty states, and this is
 * both.
 */
import { Link } from 'react-router-dom';
import { Stack, Text, Button, Box } from '@mantine/core';

export default function NotFoundPage() {
  return (
    <Box style={{ position: 'relative', minHeight: '58vh', display: 'grid', placeItems: 'center' }}>
      <Text
        aria-hidden="true"
        ff="monospace"
        c="ink.6"
        style={{
          position: 'absolute',
          fontSize: 'clamp(7rem, 22vw, 14rem)',
          fontWeight: 500,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        404
      </Text>

      <Stack align="center" gap={16} style={{ position: 'relative', textAlign: 'center' }}>
        <Text
          component="h1"
          c="ink.0"
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Page not found
        </Text>
        <Text fz={16} c="ink.2" style={{ maxWidth: '40ch' }}>
          That address does not match anything in the store. It may have moved,
          or the link may be out of date.
        </Text>
        <Button component={Link} to="/" color="brand.5" c="black" mt={8}>
          Back to home
        </Button>
      </Stack>
    </Box>
  );
}
