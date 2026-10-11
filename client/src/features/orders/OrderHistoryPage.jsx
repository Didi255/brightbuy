/**
 * OrderHistoryPage — a customer's own orders, newest first.   OWNER: Slice A
 *
 * /orders and /orders/:orderId are ONE component in two states. The list
 * renders the rows; a selected order expands into OrderDetailModal and the
 * URL syncs, so the detail view is linkable and the back button works.
 *
 * GET /orders returns full Order shapes — items, delivery and payment — so
 * expanding a row costs no further request. Everything on this page,
 * including the summary tiles, derives from that one call.
 *
 * Covers: REQ-5.5, REQ-5.6
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack, Group, Text, Box, Paper, Skeleton, UnstyledButton,
} from '@mantine/core';
import { IconPackageOff, IconChevronDown, IconTruck, IconBuildingStore } from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { StatusBadge, Money, EmptyState, ErrorAlert, ProductTile } from '../../components/ui';
import { api } from '../../api/client';
import OrderDetailModal from './OrderDetailModal';

const LINE = 'rgba(255,236,214,0.10)';
const LINE_HOT = 'rgba(255,140,0,0.35)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* orderDate is a full ISO timestamp, so a local date is correct here. */
function formatTimestamp(iso) {
  return new Date(iso).toLocaleDateString('en-US',
    { year: 'numeric', month: 'short', day: 'numeric' });
}

/* estimatedDeliveryDate is a plain "YYYY-MM-DD" — no time, no zone. Passing
   it to new Date() invents midnight UTC and can land on the previous day. */
function formatPlainDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

const isDone      = (o) => o.orderStatus === 'DeliveredOrPicked';
const isCancelled = (o) => o.orderStatus === 'Cancelled';

const FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'In progress' },
  { value: 'delivered', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/* ── pieces ───────────────────────────────────────────────────────── */

function StatTile({ label, children }) {
  return (
    <Box p={16} style={{ flex: '1 1 180px', minWidth: 0 }}>
      <Text style={MONO} c="ink.4">{label}</Text>
      <Text
                fz={32}
        fw={500}
        c="ink.0"
        mt={4}
        style={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
      >
        {children}
      </Text>
    </Box>
  );
}

/** Up to three overlapping thumbnails, then a +N square. */
function ThumbStack({ items }) {
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  return (
    <Group gap={0} wrap="nowrap" style={{ flexShrink: 0 }}>
      {shown.map((it, i) => (
        <Box
          key={it.orderItemId}
          style={{
            marginLeft: i === 0 ? 0 : -14,
            zIndex: shown.length - i,
            border: `1px solid ${LINE}`,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
          }}
        >
          <ProductTile src={it.imageUrl} alt="" size={52} zoom={1} />
        </Box>
      ))}
      {extra > 0 && (
        <Box
          style={{
            width: 52, height: 52, borderRadius: 4, marginLeft: -14,
            background: 'var(--mantine-color-ink-6)', border: `1px solid ${LINE}`,
            display: 'grid', placeItems: 'center',
          }}
        >
          <Text fz={12} c="ink.2">+{extra}</Text>
        </Box>
      )}
    </Group>
  );
}

function OrderRow({ order, onOpen }) {
  const [hover, setHover] = useState(false);
  const { delivery, items = [] } = order;
  const pickup = delivery?.deliveryMode === 'store_pickup';

  const when = isDone(order)
    ? `${pickup ? 'Picked up at' : 'Delivered to'} ${delivery?.cityName ?? ''}`
    : isCancelled(order)
      ? delivery?.cityName ?? ''
      : `${pickup ? 'Ready at' : 'Arrives by'} ${formatPlainDate(delivery?.estimatedDeliveryDate)}`;

  return (
    <UnstyledButton
      onClick={() => onOpen(order)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Open order ${order.orderId}`}
      style={{
        display: 'block', width: '100%', padding: 16, borderRadius: 8,
        background: hover ? 'var(--mantine-color-ink-6)' : 'var(--mantine-color-ink-7)',
        border: `1px solid ${hover ? LINE_HOT : LINE}`,
        transition: `background 150ms ${EASE}, border-color 150ms ${EASE}`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" gap={16}>
        <Group gap={16} wrap="nowrap" style={{ minWidth: 0 }}>
          <ThumbStack items={items} />

          <Stack gap={4} style={{ minWidth: 0 }}>
            <Group gap={8} wrap="nowrap">
              <Text fz={14} fw={500} c="ink.0">#{order.orderId}</Text>
              <StatusBadge status={order.orderStatus} deliveryMode={delivery?.deliveryMode} />
            </Group>
            <Text style={MONO} c="ink.4">
              {formatTimestamp(order.orderDate)} · {items.length}{' '}
              {items.length === 1 ? 'item' : 'items'}
            </Text>
            <Group gap={4} wrap="nowrap">
              {pickup
                ? <IconBuildingStore size={13} style={{ color: 'var(--mantine-color-ink-3)' }} />
                : <IconTruck size={13} style={{ color: 'var(--mantine-color-ink-3)' }} />}
              <Text fz={12} c="ink.3">{when}</Text>
            </Group>
          </Stack>
        </Group>

        <Group gap={16} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Money value={order.totalAmount} fz={18} fw={500} />
          <IconChevronDown
            size={16}
            style={{
              color: 'var(--mantine-color-ink-3)',
              transform: hover ? 'translateY(2px)' : 'none',
              transition: `transform 150ms ${EASE}`,
            }}
          />
        </Group>
      </Group>
    </UnstyledButton>
  );
}

function OrdersSkeleton() {
  return (
    <Stack gap={16}>
      <Skeleton height={92} radius={8} />
      <Skeleton height={36} radius={4} width={380} />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={92} radius={8} />)}
    </Stack>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export default function OrderHistoryPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setOrders(await api.get('/orders'));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  /* [] = run once on mount. NOT [load] — load is a new function object on
     every render, so that would re-fire the effect forever. */
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="My orders" crumbs={[{ label: 'Home', to: '/' }, { label: 'Orders' }]} />
        <OrdersSkeleton />
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader title="My orders" crumbs={[{ label: 'Home', to: '/' }, { label: 'Orders' }]} />
        <ErrorAlert error={error} onRetry={load} />
      </>
    );
  }

  /* Derived, never stored — these are facts ABOUT orders, so a second
     useState would be a second source of truth that can drift. */
  const activeCount    = orders.filter((o) => !isDone(o) && !isCancelled(o)).length;
  const cancelledCount = orders.filter(isCancelled).length;

  /* Money is a DECIMAL string. Summing floats would undo the precision
     DECIMAL exists to protect, so add whole cents and divide once. */
  const spentCents = orders
    .filter((o) => !isCancelled(o))
    .reduce((sum, o) => sum + Math.round(Number(o.totalAmount) * 100), 0);
  const totalSpent = (spentCents / 100).toFixed(2);

  const counts = {
    all: orders.length,
    active: activeCount,
    delivered: orders.filter(isDone).length,
    cancelled: cancelledCount,
  };

  const visible = orders.filter((o) => {
    if (filter === 'active')    return !isDone(o) && !isCancelled(o);
    if (filter === 'delivered') return isDone(o);
    if (filter === 'cancelled') return isCancelled(o);
    return true;
  });

  const selected = orderId ? orders.find((o) => String(o.orderId) === String(orderId)) : null;

  return (
    <>
      <PageHeader
        title="My orders"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Orders' }]}
        subtitle={
          orders.length
            ? 'Every order you have placed, newest first. Open one for its delivery and payment detail.'
            : undefined
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={IconPackageOff}
          title="No orders yet"
          message="Browse the catalogue to place your first order."
          actionLabel="Browse products"
          actionTo="/products"
        />
      ) : (
        <Stack gap={24}>
          {/* summary — shared hairline dividers, one outer border, no gaps */}
          <Box
            style={{
              display: 'flex', flexWrap: 'wrap',
              border: `1px solid ${LINE}`, borderRadius: 8, overflow: 'hidden',
            }}
          >
            <Box style={{ flex: '1 1 180px', borderRight: `1px solid ${LINE}` }}>
              <StatTile label="Orders">{orders.length}</StatTile>
            </Box>
            <Box style={{ flex: '1 1 180px', borderRight: `1px solid ${LINE}` }}>
              <StatTile label="Total spent"><Money value={totalSpent} fz={32} fw={500} /></StatTile>
            </Box>
            <Box style={{ flex: '1 1 180px', borderRight: `1px solid ${LINE}` }}>
              <StatTile label="In progress">{activeCount}</StatTile>
            </Box>
            <Box style={{ flex: '1 1 180px' }}>
              <StatTile label="Cancelled">{cancelledCount}</StatTile>
            </Box>
          </Box>

          {/* mono status chips with live counts */}
          <Group gap={8} wrap="wrap">
            {FILTERS.map((f) => {
              const on = filter === f.value;
              return (
                <UnstyledButton
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 32, padding: '0 14px', borderRadius: 999,
                    border: `1px solid ${on ? 'var(--mantine-color-brand-5)' : LINE}`,
                    background: on ? 'var(--mantine-color-ink-6)' : 'transparent',
                    color: on ? 'var(--mantine-color-brand-5)' : 'var(--mantine-color-ink-2)',
                    transition: `all 150ms ${EASE}`,
                  }}
                >
                  <Text component="span" style={{ ...MONO, fontSize: 11 }} c="inherit">
                    {f.label}
                  </Text>
                  <Text component="span" fz={11} c="inherit" opacity={0.7}>
                    {counts[f.value]}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Group>

          {visible.length === 0 ? (
            /* Filtered to nothing is NOT the same as having no orders, and
               must not tell someone they have never ordered. */
            <Paper p="xl" radius={8}>
              <Text ta="center" c="ink.2">No orders in this category.</Text>
            </Paper>
          ) : (
            <Stack gap={8}>
              {visible.map((o) => (
                <OrderRow
                  key={o.orderId}
                  order={o}
                  onOpen={(ord) => navigate(`/orders/${ord.orderId}`)}
                />
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {selected && (
        <OrderDetailModal order={selected} onClose={() => navigate('/orders')} />
      )}
    </>
  );
}
