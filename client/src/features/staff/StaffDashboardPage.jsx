
/**
 * StaffDashboardPage — the operations overview. OWNER: Slice E
 *
 * Covers: REQ-11.1 (shell)
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
} from '@tabler/icons-react';

import { PageHeader } from '../../components/layout';
import {
  Money,
  DataTable,
  StatusBadge,
  EmptyState,
  ErrorAlert,
} from '../../components/ui';
import { api } from '../../api/client';

const LINE = 'rgba(255,236,214,0.10)';

/* Sentence-case body label. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

/** One KPI. delta is a signed percentage. */
function Kpi({ label, value, delta, goodWhenUp = true }) {
  const up = typeof delta === 'number' && delta >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Box
      p={16}
      style={{
        flex: '1 1 200px',
        minWidth: 0,
        outline: `1px solid ${LINE}`,
      }}
    >
      <Text style={MONO} c="ink.4">
        {label}
      </Text>

      <Text
        fz={32}
        fw={500}
        c="ink.0"
        mt={8}
        style={{
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </Text>

      {typeof delta === 'number' && (
        <Group gap={4} mt={8} wrap="nowrap">
          <Icon
            size={13}
            style={{
              color: good
                ? 'var(--mantine-color-green-5)'
                : 'var(--mantine-color-red-5)',
            }}
          />

          <Text fz={12} c={good ? 'green.5' : 'red.5'}>
            {Math.abs(delta)}%
          </Text>

          <Text fz={12} c="ink.4">
            vs last week
          </Text>
        </Group>
      )}
    </Box>
  );
}

function Panel({ title, action, children }) {
  return (
    <Box
      style={{
        border: `1px solid ${LINE}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Group
        justify="space-between"
        wrap="nowrap"
        px={16}
        py={12}
        style={{
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <Text style={MONO} c="ink.4">
          {title}
        </Text>

        {action}
      </Group>

      {children}
    </Box>
  );
}

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const result = await api.get('/admin/orders');

      setOrders(
        Array.isArray(result) ? result.slice(0, 10) : []
      );
    } catch (error) {
      setOrdersError(error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const columns = [
    {
      key: 'orderId',
      label: 'Order',
      render: (r) => (
        <Text fz={13} c="ink.0">
          #{r.orderId}
        </Text>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (r) => (
        <StatusBadge
          status={r.orderStatus}
          deliveryMode={r.deliveryMode}
        />
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      align: 'right',
      render: (r) => (
        <Money value={r.totalAmount} fz={14} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        crumbs={[
          { label: 'Staff', to: '/staff' },
          { label: 'Dashboard' },
        ]}
        subtitle="Today's operations at a glance."
        right={
          <Group gap={8} wrap="wrap">
            <Button
              component={Link}
              to="/staff/catalogue"
              variant="default"
              size="sm"
            >
              Catalogue
            </Button>
            <Button
              component={Link}
              to="/staff/orders"
              variant="default"
              size="sm"
            >
              Orders
            </Button>
            <Button
              component={Link}
              to="/staff/stock"
              variant="default"
              size="sm"
            >
              Stock
            </Button>
            <Button
              component={Link}
              to="/staff/reports"
              variant="default"
              size="sm"
            >
              Reports
            </Button>
          </Group>
        }
      />

      <Stack gap={24}>
        {/* KPI row */}
        <Box
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            border: `1px solid ${LINE}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Kpi
            label="Orders today"
            value="—"
          />

          <Kpi
            label="Revenue today"
            value="—"
          />

          <Kpi
            label="Pending fulfilment"
            value="—"
            goodWhenUp={false}
          />

          <Kpi
            label="Low-stock SKUs"
            value="—"
            goodWhenUp={false}
          />
        </Box>

        {/* Recent orders and attention panel */}
        <Box
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <Box
            style={{
              flex: '999 1 480px',
              minWidth: 0,
            }}
          >
            <Panel
              title="Recent orders"
              action={
                <Text
                  component={Link}
                  to="/staff/orders"
                  style={MONO}
                  c="brand.5"
                >
                  View all →
                </Text>
              }
            >
              {ordersError && (
                <Box p={16}>
                  <ErrorAlert error={ordersError} />
                </Box>
              )}

              <DataTable
                columns={columns}
                data={orders}
                loading={ordersLoading}
                emptyMessage={
                  ordersError
                    ? 'Unable to load orders. Please try again.'
                    : 'No orders to show.'
                }
              />
            </Panel>
          </Box>

          <Box
            style={{
              flex: '1 1 300px',
              minWidth: 0,
            }}
          >
            <Panel title="Needs attention">
              <Box p={16}>
                <EmptyState
                  icon={IconAlertTriangle}
                  title="Nothing flagged"
                  message="Failed payments, out-of-stock orders and overdue dispatches will appear here once the reports API is connected."
                />
              </Box>
            </Panel>
          </Box>
        </Box>
      </Stack>
    </>
  );
}
