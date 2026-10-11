/**
 * StaffDashboardPage — the operations overview.   OWNER: Slice E
 *
 * Same tokens as the storefront, higher density and no marketing flourish:
 * no ticker, no spotlight, no hover-reveal buttons. Staff are reading, not
 * browsing.
 *
 * The KPI tiles use the SAME bordered-grid treatment as the home page's
 * "Why BrightBuy" block — shared hairline dividers, no gaps, one outer
 * border — so the two read as one system at different densities.
 *
 * DATA NOTE: /admin/orders and /reports/* are Slice E's and are not built
 * yet, so each panel shows its own empty state rather than a fabricated
 * number. Wire the endpoints and the tiles fill themselves.
 *
 * Covers: REQ-11.1 (shell)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Group, Stack, Text, Button } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconAlertTriangle } from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { Money, DataTable, StatusBadge, EmptyState } from '../../components/ui';
import { api } from '../../api/client';

const LINE = 'rgba(255,236,214,0.10)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

/** One KPI. `delta` is a signed percentage; green is good, red is bad. */
function Kpi({ label, value, delta, goodWhenUp = true }) {
  const up = typeof delta === 'number' && delta >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Box p={16} style={{ flex: '1 1 200px', minWidth: 0, outline: `1px solid ${LINE}` }}>
      <Text style={MONO} c="ink.4">{label}</Text>
      <Text
                fz={32}
        fw={500}
        c="ink.0"
        mt={8}
        style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
      >
        {value}
      </Text>
      {typeof delta === 'number' && (
        <Group gap={4} mt={8} wrap="nowrap">
          <Icon size={13} style={{ color: good ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)' }} />
          <Text fz={12} c={good ? 'green.5' : 'red.5'}>
            {Math.abs(delta)}%
          </Text>
          <Text fz={12} c="ink.4">vs last week</Text>
        </Group>
      )}
    </Box>
  );
}

function Panel({ title, action, children }) {
  return (
    <Box style={{ border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden' }}>
      <Group
        justify="space-between"
        wrap="nowrap"
        px={16}
        py={12}
        style={{ borderBottom: `1px solid ${LINE}` }}
      >
        <Text style={MONO} c="ink.4">{title}</Text>
        {action}
      </Group>
      {children}
    </Box>
  );
}

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    /* /admin/orders is Slice E's and is not mounted yet. Fail quietly to an
       empty state — a dashboard that 500s is worse than one that says the
       feed is not connected. */
    api.get('/admin/orders?pageSize=10')
      .then((r) => setOrders(r.data || r.items || []))
      .catch(() => setOrders([]));
  }, []);

  const columns = [
    {
      key: 'orderId', label: 'Order',
      render: (r) => <Text fz={13} c="ink.0">#{r.orderId}</Text>,
    },
    { key: 'customerName', label: 'Customer' },
    {
      key: 'orderStatus', label: 'Status',
      render: (r) => <StatusBadge status={r.orderStatus} deliveryMode={r.deliveryMode} />,
    },
    {
      key: 'totalAmount', label: 'Total', align: 'right',
      render: (r) => <Money value={r.totalAmount} fz={14} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Dashboard' }]}
        subtitle="Today's operations at a glance."
      />

      <Stack gap={24}>
        {/* KPI row — one bordered block, shared dividers */}
        <Box
          style={{
            display: 'flex', flexWrap: 'wrap',
            border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden',
          }}
        >
          <Kpi label="Orders today" value="—" />
          <Kpi label="Revenue today" value="—" />
          <Kpi label="Pending fulfilment" value="—" goodWhenUp={false} />
          <Kpi label="Low-stock SKUs" value="—" goodWhenUp={false} />
        </Box>

        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <Box style={{ flex: '999 1 480px', minWidth: 0 }}>
            <Panel
              title="Recent orders"
              action={
                <Text component={Link} to="/staff/orders" style={{ ...MONO }} c="brand.5">
                  View all →
                </Text>
              }
            >
              <DataTable
                columns={columns}
                data={orders || []}
                loading={orders === null}
                emptyMessage="No orders to show. The admin order feed is not connected yet."
              />
            </Panel>
          </Box>

          <Box style={{ flex: '1 1 300px', minWidth: 0 }}>
            <Panel title="Needs attention">
              <Box p={16}>
                <EmptyState
                  icon={IconAlertTriangle}
                  title="Nothing flagged"
                  message="Failed payments, out-of-stock orders and overdue dispatches appear here once the reports API is wired."
                />
              </Box>
            </Panel>
          </Box>
        </Box>
      </Stack>
    </>
  );
}
