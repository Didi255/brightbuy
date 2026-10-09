/**
 * DataTable — sortable, responsive table for staff screens
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   const columns = [
 *     { key: 'orderId', label: 'Order #', sortable: true },
 *     { key: 'total',   label: 'Total',   align: 'right', render: (row) => <Money value={row.total} /> },
 *     { key: 'status',  label: 'Status',  render: (row) => <StatusBadge status={row.status} /> },
 *   ];
 *
 *   <DataTable
 *     columns={columns}
 *     data={orders}
 *     loading={isLoading}
 *     emptyMessage="No orders found"
 *   />
 */
import { useState, useMemo } from 'react';
import { Table, Text, Center, Skeleton, Group, UnstyledButton } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import EmptyState from './EmptyState';

/**
 * @param {Array}   columns  – [{ key, label, sortable?, align?, render?(row) }]
 * @param {Array}   data     – row objects
 * @param {boolean} loading
 * @param {string}  emptyMessage
 * @param {Function} onRowClick – (row) => void
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  ...rest
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  /* loading skeleton */
  if (loading) {
    return (
      <Table striped highlightOnHover {...rest}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th key={col.key}>{col.label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <Table.Tr key={i}>
              {columns.map((col) => (
                <Table.Td key={col.key}>
                  <Skeleton height={16} radius="sm" />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  /* empty */
  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  /* data */
  return (
    <Table.ScrollContainer minWidth={600}>
      <Table striped highlightOnHover verticalSpacing="sm" {...rest}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <Group gap={4} justify={col.align === 'right' ? 'flex-end' : 'flex-start'}>
                  <Text fw={600} size="xs" tt="uppercase" c="dimmed">
                    {col.label}
                  </Text>
                  {col.sortable && (
                    <SortIcon
                      active={sortKey === col.key}
                      direction={sortKey === col.key ? sortDir : null}
                    />
                  )}
                </Group>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {sorted.map((row, ri) => (
            <Table.Tr
              key={row.id || row[columns[0]?.key] || ri}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.15s ease',
              }}
            >
              {columns.map((col) => (
                <Table.Td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function SortIcon({ active, direction }) {
  if (!active) return <IconSelector size={14} stroke={1.5} color="#adb5bd" />;
  return direction === 'asc' ? (
    <IconChevronUp size={14} stroke={2} color="#0066ff" />
  ) : (
    <IconChevronDown size={14} stroke={2} color="#0066ff" />
  );
}
