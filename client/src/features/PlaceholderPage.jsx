/**
 * PlaceholderPage — temporary stand-in for screens not yet built
 *
 * Shows a styled card telling the user which slice owns this page
 * and what will go here. Replace each with the real component when ready.
 */
import { Card, Text, Badge, Group, Stack, Center, ThemeIcon } from '@mantine/core';
import { IconHammer } from '@tabler/icons-react';
import { PageHeader } from '../components/layout';

const sliceOwners = {
  A: { name: 'Dihini',    label: 'Order Transaction & Delivery' },
  B: { name: 'Risandu',   label: 'Catalogue & Search' },
  C: { name: 'Vidura',    label: 'Cart, Checkout & UI Foundation' },
  D: { name: 'Ajini',     label: 'Auth, Accounts & Audit' },
  E: { name: 'Maathumai', label: 'Payments, Staff Ops & Reports' },
};

export default function PlaceholderPage({ title, slice }) {
  const owner = sliceOwners[slice] || { name: '—', label: 'Unknown' };

  return (
    <div className="bb-page-enter">
      <PageHeader
        title={title}
        crumbs={[{ label: 'Home', to: '/' }, { label: title }]}
      />

      <Center py={48}>
        <Card
          withBorder
          shadow="sm"
          radius="lg"
          padding="xl"
          style={{ maxWidth: 420, textAlign: 'center' }}
        >
          <Stack align="center" gap={16}>
            <ThemeIcon size={64} radius="xl" variant="light" color="blue">
              <IconHammer size={32} stroke={1.5} />
            </ThemeIcon>
            <Text fw={700} size="lg">Under Construction</Text>
            <Text size="sm" c="dimmed">
              This page is being built by the team. Check back soon!
            </Text>
            {slice && (
              <Group gap={8}>
                <Badge color="blue" variant="light">Slice {slice}</Badge>
                <Badge color="gray" variant="light">{owner.name}</Badge>
              </Group>
            )}
            <Text size="xs" c="dimmed">{owner.label}</Text>
          </Stack>
        </Card>
      </Center>
    </div>
  );
}
