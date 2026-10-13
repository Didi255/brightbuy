/**
 * StaffDashboardPage — the operations overview. OWNER: Slice E
 *
 * Covers: REQ-11.1 (shell)
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Group, Stack, Text } from '@mantine/core';

import { PageHeader } from '../../components/layout';
import {
  Money,
  DataTable,
  StatusBadge,
  ErrorAlert,
} from '../../components/ui';
import { api } from '../../api/client';

const LINE = 'rgba(255,236,214,0.10)';

/* Sentence-case body label. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

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
      setOrders(Array.isArray(result) ? result.slice(0, 10) : []);
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
      render: (order) => (
        <Text fz={13} c="ink.0">
          #{order.orderId}
        </Text>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      render: (order) => `${order.firstName} ${order.lastName}`,
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (order) => (
        <StatusBadge
          status={order.orderStatus}
          deliveryMode={order.deliveryMode}
        />
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total',
      align: 'right',
      render: (order) => (
        <Money value={order.totalAmount} fz={14} />
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
        subtitle="Review recent orders and open staff reports."
      />

      <Stack gap={24}>
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
                  <ErrorAlert
                    error={ordersError}
                    onRetry={loadOrders}
                  />
                </Box>
              )}

              <DataTable
                columns={columns}
                data={orders}
                loading={ordersLoading}
                emptyMessage={
                  ordersError
                    ? 'Unable to load orders. Try again.'
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
            <Panel title="Reports">
              <Box p={16}>
                <Stack gap={8}>
                  <Text c="ink.2">
                    Review sales, products, categories, deliveries, and customer
                    activity in the reports dashboard.
                  </Text>
                  <Text
                    component={Link}
                    to="/staff/reports"
                    style={MONO}
                    c="brand.5"
                  >
                    Open reports →
                  </Text>
                </Stack>
              </Box>
            </Panel>
          </Box>
        </Box>
      </Stack>
    </>
  );
}