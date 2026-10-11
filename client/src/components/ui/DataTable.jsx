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
 *
 * Circuit Noir: no zebra striping — hairline row rules only. Mono uppercase
 * headers, 48px rows, numerics right-aligned, and a 2px amber bar on the
 * hovered row's left edge. The header sticks once the table scrolls.
 */
import { useState, useMemo } from 'react';
import { Table, Text, Skeleton, Group, Box } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import EmptyState from './EmptyState';

const LINE = 'rgba(255,236,214,0.10)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const HEAD = {
  fontSize: 14,
  fontWeight: 400,
};

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
  const [hovered, setHovered] = useState(null);

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

  const head = (
    <Table.Thead
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        background: 'var(--mantine-color-ink-8)',
      }}
    >
      <Table.Tr style={{ borderBottom: `1px solid ${LINE}` }}>
        {columns.map((col) => (
          <Table.Th
            key={col.key}
            style={{
              textAlign: col.align || 'left',
              cursor: col.sortable ? 'pointer' : 'default',
              userSelect: 'none',
              background: 'transparent',
              borderBottom: 'none',
              padding: '12px 16px',
            }}
            onClick={col.sortable ? () => handleSort(col.key) : undefined}
          >
            <Group
              gap={4}
              wrap="nowrap"
              justify={col.align === 'right' ? 'flex-end' : 'flex-start'}
            >
              <Text component="span" style={HEAD} c="ink.3">{col.label}</Text>
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
  );

  /* loading — skeleton rows keep the layout from jumping */
  if (loading) {
    return (
      <Table withRowBorders={false} {...rest}>
        {head}
        <Table.Tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <Table.Tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
              {columns.map((col) => (
                <Table.Td key={col.key} style={{ height: 48, padding: '0 16px' }}>
                  <Skeleton height={12} radius={2} />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table withRowBorders={false} {...rest}>
        {head}
        <Table.Tbody>
          {sorted.map((row, ri) => {
            const key = row.id || row[columns[0]?.key] || ri;
            const isHot = hovered === key;
            return (
              <Table.Tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: isHot ? 'var(--mantine-color-ink-7)' : 'transparent',
                  borderBottom: `1px solid ${LINE}`,
                  transition: `background 150ms ${EASE}`,
                }}
              >
                {columns.map((col, ci) => (
                  <Table.Td
                    key={col.key}
                    style={{
                      textAlign: col.align || 'left',
                      height: 48,
                      padding: '0 16px',
                      /* the 2px amber bar rides on the first cell */
                      boxShadow:
                        ci === 0 && isHot
                          ? 'inset 2px 0 0 0 var(--mantine-color-brand-5)'
                          : 'none',
                      /* numeric columns are mono and tabular */
                      fontFamily:
                        col.align === 'right'
                          ? undefined
                          : undefined,
                      fontVariantNumeric: col.align === 'right' ? 'tabular-nums' : undefined,
                      fontSize: 14,
                      color: 'var(--mantine-color-ink-0)',
                    }}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function SortIcon({ active, direction }) {
  /* a sort direction is a STATE, so the active one is blue */
  const on = 'var(--mantine-color-brand-5)';
  const dim = 'var(--mantine-color-ink-4)';
  if (!active) return <IconSelector size={13} stroke={1.6} style={{ color: dim }} />;
  return direction === 'asc' ? (
    <IconChevronUp size={13} stroke={2.2} style={{ color: on }} />
  ) : (
    <IconChevronDown size={13} stroke={2.2} style={{ color: on }} />
  );
}
