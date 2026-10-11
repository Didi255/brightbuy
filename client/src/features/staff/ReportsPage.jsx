import { useState, useEffect } from 'react';
import { Tabs, Group, Select, Button } from '@mantine/core';
import { PageHeader, DataTable, Money } from '../../components/ui';
import { api } from '../../api/client';

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [from, setFrom] = useState('2025-01-01');
  const [to, setTo] = useState('2025-12-31');
  const [quarterly, setQuarterly] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryOrders, setCategoryOrders] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [customerSummary, setCustomerSummary] = useState([]);

  useEffect(() => {
    api.get(`/reports/quarterly-sales?year=${year}`)
      .then(r => setQuarterly(r.data.data || []))
      .catch(() => setQuarterly([]));

    api.get(`/reports/top-products?from=${from}&to=${to}&limit=10`)
      .then(r => setTopProducts(r.data.data || []))
      .catch(() => setTopProducts([]));

    api.get('/reports/category-orders')
      .then(r => setCategoryOrders(r.data.data || []))
      .catch(() => setCategoryOrders([]));

    api.get('/reports/upcoming-deliveries')
      .then(r => setUpcoming(r.data.data || []))
      .catch(() => setUpcoming([]));

    api.get('/reports/customer-summary')
      .then(r => setCustomerSummary(r.data.data || []))
      .catch(() => setCustomerSummary([]));
  }, [year, from, to]);

  return (
    <>
      <PageHeader title="Reports" subtitle="Operational reporting" />

      <Tabs defaultValue="quarterly">
        <Tabs.List>
          <Tabs.Tab value="quarterly">Quarterly sales</Tabs.Tab>
          <Tabs.Tab value="top">Top products</Tabs.Tab>
          <Tabs.Tab value="categories">Category orders</Tabs.Tab>
          <Tabs.Tab value="deliveries">Upcoming deliveries</Tabs.Tab>
          <Tabs.Tab value="customers">Customer summary</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="quarterly">
          <DataTable
            columns={[
              { key: 'quarter', label: 'Quarter' },
              { key: 'orderCount', label: 'Orders' },
              { key: 'totalRevenue', label: 'Revenue', render: (row) => <Money value={row.totalRevenue} /> }
            ]}
            rows={quarterly}
          />
        </Tabs.Panel>

        <Tabs.Panel value="top">
          <DataTable
            columns={[
              { key: 'productName', label: 'Product' },
              { key: 'quantitySold', label: 'Sold' },
              { key: 'revenue', label: 'Revenue', render: (row) => <Money value={row.revenue} /> }
            ]}
            rows={topProducts}
          />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}