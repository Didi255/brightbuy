/**
 * PlaceholderPage — temporary stand-in for screens not yet built
 *
 * Shows which slice owns this page and what will go here. Replace each with
 * the real component when ready.
 *
 * Circuit Noir: a dashed hairline slot, the same treatment EmptyState uses,
 * because that is honestly what this is — a gap in the grid. Deliberately
 * NOT dressed up as a finished screen: a page that looks built but does
 * nothing is worse at a demo than one that says plainly it is not built.
 */
import { Box, Text, Group, Stack } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';
import { PageHeader } from '../components/layout';

const LINE = 'rgba(255,236,214,0.10)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

const sliceOwners = {
  A: { name: 'Dihini',    label: 'Order Transaction & Delivery' },
  B: { name: 'Risandu',   label: 'Catalogue & Search' },
  C: { name: 'Vidura',    label: 'Cart, Checkout & UI Foundation' },
  D: { name: 'Ajini',     label: 'Auth, Accounts & Audit' },
  E: { name: 'Maathumai', label: 'Payments, Staff Ops & Reports' },
};

function Chip({ children }) {
  return (
    <Text
      component="span"
      style={{ ...MONO, padding: '4px 10px', borderRadius: 999, border: `1px solid ${LINE}` }}
      c="ink.2"
    >
      {children}
    </Text>
  );
}

export default function PlaceholderPage({ title, slice }) {
  const owner = sliceOwners[slice];

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[{ label: 'Home', to: '/' }, { label: title }]}
      />

      <Box
        style={{
          border: `1px dashed var(--mantine-color-ink-5)`,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          padding: '72px 24px',
        }}
      >
        <Stack align="center" gap={16} style={{ maxWidth: 440, textAlign: 'center' }}>
          <IconTool size={36} stroke={1.3} color="var(--mantine-color-ink-4)" aria-hidden="true" />

          <Text
            c="ink.0"
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            Not built yet
          </Text>

          <Text fz={14} c="ink.2" style={{ lineHeight: 1.6 }}>
            This screen is waiting on its API. The design system, routing and
            navigation around it are already in place.
          </Text>

          {owner && (
            <Group gap={8} mt={4} justify="center">
              <Chip>Slice {slice}</Chip>
              <Chip>{owner.name}</Chip>
            </Group>
          )}
          {owner && (
            <Text style={{ ...MONO, fontSize: 10 }} c="ink.4">
              {owner.label}
            </Text>
          )}
        </Stack>
      </Box>
    </>
  );
}
