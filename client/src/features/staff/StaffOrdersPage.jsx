import { useCallback, useEffect, useState } from 'react';
import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { DataTable, ErrorAlert, Money, StatusBadge } from '../../components/ui';

const statusOptions = [
  { value: 'Placed', label: 'Placed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'ReadyOrOut', label: 'Ready for pickup / dispatch' },
  { value: 'DeliveredOrPicked', label: 'Delivered / picked up' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const transitions = {
  Placed: ['Processing', 'Cancelled'],
  Processing: ['ReadyOrOut', 'Cancelled'],
  ReadyOrOut: ['DeliveredOrPicked'],
  DeliveredOrPicked: [],
  Cancelled: [],
};

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    deliveryMode: 'all',
    from: '',
    to: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value && value !== 'all') params.set(key, value);
      }

      const query = params.toString();
      const result = await api.get(`/admin/orders${query ? `?${query}` : ''}`);
      setOrders(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function changeStatus(order, nextStatus) {
    if (!nextStatus) return;
    if (
      nextStatus === 'Cancelled'
      && !window.confirm(`Cancel order ${order.orderId}?`)
    ) {
      return;
    }

    setUpdatingOrderId(order.orderId);
    setError(null);

    try {
      await api.patch(`/admin/orders/${order.orderId}/status`, {
        orderStatus: nextStatus,
      });
      await loadOrders();
    } catch (requestError) {
      setError(requestError);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const columns = [
    {
      key: 'orderId',
      label: 'Order',
      align: 'right',
      sortable: true,
      render: (order) => `#${order.orderId}`,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order) => `${order.firstName} ${order.lastName}`,
    },
    { key: 'email', label: 'Email' },
    { key: 'orderDate', label: 'Date', sortable: true },
    {
      key: 'totalAmount',
      label: 'Total',
      align: 'right',
      render: (order) => <Money value={order.totalAmount} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (order) =>
        order.paymentStatus
          ? <StatusBadge status={order.paymentStatus} />
          : 'Not recorded',
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (order) => <StatusBadge status={order.orderStatus} />,
    },
    {
      key: 'deliveryMode',
      label: 'Delivery',
      render: (order) =>
        order.deliveryMode === 'store_pickup' ? 'Store pickup' : 'Standard delivery',
    },
    {
      key: 'actions',
      label: 'Update status',
      render: (order) => (
        <Select
          aria-label={`Update status for order ${order.orderId}`}
          placeholder="Choose status"
          data={statusOptions.filter((option) =>
            (transitions[order.orderStatus] || []).includes(option.value)
          )}
          value={null}
          disabled={updatingOrderId !== null}
          onChange={(value) => changeStatus(order, value)}
        />
      ),
    },
  ];

  return (
    <Stack gap={24}>
      <PageHeader
        title="Orders"
        crumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Orders' }]}
        subtitle="Review orders and apply permitted status transitions."
      />

      <Group align="end" wrap="wrap">
        <Select
          label="Order status"
          value={filters.status}
          data={[
            { value: 'all', label: 'All statuses' },
            ...statusOptions,
          ]}
          onChange={(status) =>
            setFilters((current) => ({ ...current, status: status || 'all' }))
          }
        />
        <Select
          label="Payment status"
          value={filters.paymentStatus}
          data={['all', 'Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled']
            .map((value) => ({ value, label: value === 'all' ? 'All payments' : value }))}
          onChange={(paymentStatus) =>
            setFilters((current) => ({
              ...current,
              paymentStatus: paymentStatus || 'all',
            }))
          }
        />
        <Select
          label="Delivery mode"
          value={filters.deliveryMode}
          data={[
            { value: 'all', label: 'All delivery modes' },
            { value: 'standard', label: 'Standard delivery' },
            { value: 'store_pickup', label: 'Store pickup' },
          ]}
          onChange={(deliveryMode) =>
            setFilters((current) => ({
              ...current,
              deliveryMode: deliveryMode || 'all',
            }))
          }
        />
        <TextInput
          label="From"
          type="date"
          value={filters.from}
          onChange={(event) =>
            setFilters((current) => ({ ...current, from: event.currentTarget.value }))
          }
        />
        <TextInput
          label="To"
          type="date"
          value={filters.to}
          onChange={(event) =>
            setFilters((current) => ({ ...current, to: event.currentTarget.value }))
          }
        />
        <Button onClick={loadOrders} loading={loading}>Apply filters</Button>
      </Group>

      {error && (
        <ErrorAlert error={error} title="Could not load or update orders" onRetry={loadOrders} />
      )}

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        emptyMessage="No orders match these filters."
      />
    </Stack>
  );
}