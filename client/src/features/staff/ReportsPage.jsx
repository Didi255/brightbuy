import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Stack,
  Tabs,
  TextInput,
} from '@mantine/core';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { DataTable, ErrorAlert, Money } from '../../components/ui';

const emptyReports = {
  quarterly: [],
  products: [],
  categories: [],
  deliveries: [],
  customers: [],
};

export default function ReportsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(`${new Date().getFullYear()}-12-31`);
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [quarterly, products, categories, deliveries, customers] = await Promise.all([
        api.get(`/reports/quarterly-sales?year=${encodeURIComponent(year)}`),
        api.get(
          `/reports/top-products?from=${encodeURIComponent(from)}`
          + `&to=${encodeURIComponent(to)}&limit=10`
        ),
        api.get('/reports/category-orders'),
        api.get('/reports/upcoming-deliveries'),
        api.get('/reports/customer-summary'),
      ]);

      setReports({
        quarterly: quarterly.data,
        products: products.data,
        categories: categories.data,
        deliveries: deliveries.data,
        customers: customers.data,
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [year, from, to]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const quarterlyChartData = useMemo(
    () => reports.quarterly
      .filter((row) => row.quarter !== 'Total')
      .map((row) => ({
        quarter: row.quarter,
        revenue: Number(row.totalRevenue),
      })),
    [reports.quarterly]
  );

  const quarterlyColumns = [
    { key: 'quarter', label: 'Quarter', sortable: true },
    { key: 'orderCount', label: 'Orders', align: 'right', sortable: true },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      align: 'right',
      render: (row) => <Money value={row.totalRevenue} />,
    },
  ];

  const productColumns = [
    { key: 'productName', label: 'Product', sortable: true },
    { key: 'quantitySold', label: 'Units sold', align: 'right', sortable: true },
    {
      key: 'revenue',
      label: 'Revenue',
      align: 'right',
      render: (row) => <Money value={row.revenue} />,
    },
  ];

  const categoryColumns = [
    { key: 'categoryName', label: 'Category', sortable: true },
    { key: 'orderCount', label: 'Orders', align: 'right', sortable: true },
  ];

  const deliveryColumns = [
    { key: 'orderId', label: 'Order', align: 'right', sortable: true },
    { key: 'cityName', label: 'City', sortable: true },
    { key: 'estimatedDeliveryDate', label: 'Estimated date', sortable: true },
    { key: 'orderStatus', label: 'Order status' },
    {
      key: 'hasOutOfStockItems',
      label: 'Back-order',
      render: (row) => row.hasOutOfStockItems ? 'Yes' : 'No',
    },
  ];

  const customerColumns = [
    { key: 'customerName', label: 'Customer', sortable: true },
    { key: 'orderCount', label: 'Orders', align: 'right', sortable: true },
    {
      key: 'totalSpent',
      label: 'Total spent',
      align: 'right',
      render: (row) => <Money value={row.totalSpent} />,
    },
    { key: 'pendingPayments', label: 'Pending payments', align: 'right' },
  ];

  return (
    <Stack gap={24}>
      <PageHeader
        title="Reports"
        crumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Reports' }]}
        subtitle="Sales, products, deliveries and customer activity."
      />

      <Group align="end" wrap="wrap">
        <TextInput
          label="Sales year"
          type="number"
          min="2000"
          max="2099"
          value={year}
          onChange={(event) => setYear(event.currentTarget.value)}
        />
        <TextInput
          label="Top products from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.currentTarget.value)}
        />
        <TextInput
          label="Top products to"
          type="date"
          value={to}
          onChange={(event) => setTo(event.currentTarget.value)}
        />
        <Button onClick={loadReports} loading={loading}>Refresh reports</Button>
      </Group>

      {error && (
        <ErrorAlert
          error={error}
          title="Could not load reports"
          onRetry={loadReports}
        />
      )}

      <Tabs defaultValue="quarterly">
        <Tabs.List>
          <Tabs.Tab value="quarterly">Quarterly sales</Tabs.Tab>
          <Tabs.Tab value="products">Top products</Tabs.Tab>
          <Tabs.Tab value="categories">Category orders</Tabs.Tab>
          <Tabs.Tab value="deliveries">Upcoming deliveries</Tabs.Tab>
          <Tabs.Tab value="customers">Customer summary</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="quarterly" pt="md">
          <Stack gap={24}>
            <Box h={280} aria-label="Quarterly revenue chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                  <Bar dataKey="revenue" fill="var(--mantine-color-brand-5)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <DataTable
              columns={quarterlyColumns}
              data={reports.quarterly}
              loading={loading}
              emptyMessage="No sales were recorded for that year."
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="products" pt="md">
          <DataTable
            columns={productColumns}
            data={reports.products}
            loading={loading}
            emptyMessage="No products sold in that date range."
          />
        </Tabs.Panel>

        <Tabs.Panel value="categories" pt="md">
          <DataTable
            columns={categoryColumns}
            data={reports.categories}
            loading={loading}
            emptyMessage="No category orders are available."
          />
        </Tabs.Panel>

        <Tabs.Panel value="deliveries" pt="md">
          <DataTable
            columns={deliveryColumns}
            data={reports.deliveries}
            loading={loading}
            emptyMessage="There are no upcoming deliveries."
          />
        </Tabs.Panel>

        <Tabs.Panel value="customers" pt="md">
          <DataTable
            columns={customerColumns}
            data={reports.customers}
            loading={loading}
            emptyMessage="No customer orders are available."
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}