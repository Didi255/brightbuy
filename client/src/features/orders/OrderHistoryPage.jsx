/**
 * OrderHistoryPage — a customer's own orders, newest first.   OWNER: Slice A
 *
 * GET /orders returns full Order shapes including items, delivery and payment,
 * so the accordion expands and the summary cards compute without any further
 * request. Everything on this page comes from that single call.
 *
 * Covers: REQ-5.5
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stack,
  Accordion,
  Group,
  Text,
  Table,
  Badge,
  Button,
  Paper,
  SegmentedControl,
  Box,
  Image,
  Skeleton,
  useMantineTheme,
} from '@mantine/core';
import {
  IconPackage,
  IconArrowRight,
  IconTruck,
  IconBuildingStore,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import {
  StatusBadge,
  Money,
  EmptyState,
  ErrorAlert,
} from '../../components/ui';
import { api } from '../../api/client';

/* ── dates ──────────────────────────────────────────────────────────────
 * Two different kinds of date come back from the API and they must NOT be
 * formatted the same way.
 *
 *   orderDate              full ISO timestamp  "2026-10-09T10:40:29.000Z"
 *   estimatedDeliveryDate  plain date          "2026-10-14"
 *
 * A plain date has no time and no timezone. Passing it to new Date() makes
 * JavaScript invent midnight UTC, which in a negative-offset timezone lands
 * on the previous day. The server already dodged this with DATE_FORMAT; we
 * dodge it here by never constructing a Date at all.
 * ---------------------------------------------------------------------- */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTimestamp(iso) {
  return new Date(iso).toLocaleDateString('en-US',
    { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPlainDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

/* One radius for everything on this page, per the design skill. */
const RADIUS = 'md';

/* ── small presentational pieces ─────────────────────────────────────── */

function Thumb({ src, alt, size }) {
  return (
    <Image
      src={src}
      alt={alt}
      w={size}
      h={size}
      radius={RADIUS}
      fit="cover"
      fallbackSrc="https://placehold.co/200x200?text=%20"
      style={{ flexShrink: 0 }}
    />
  );
}

function StatCard({ label, children }) {
  return (
    <Paper withBorder radius={RADIUS} p="md" style={{ flex: 1, minWidth: 160 }}>
      {/* Sentence case, not uppercase - the design skill calls Title Case and
          shouty labels dated. */}
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="xl" fw={600} mt={4}>{children}</Text>
    </Paper>
  );
}

/**
 * Four segments for the four forward states. A cancelled order never reached
 * the end, so it is not drawn as a partly-filled track - that would imply it
 * is still on its way.
 */
const FLOW = ['Placed', 'Processing', 'ReadyOrOut', 'DeliveredOrPicked'];

function OrderProgress({ status, color }) {
  if (status === 'Cancelled') {
    return <Text size="xs" c="dimmed">Order cancelled</Text>;
  }
  const reached = FLOW.indexOf(status);
  return (
    <Group gap={4} wrap="nowrap" w={160}>
      {FLOW.map((step, i) => (
        <Box
          key={step}
          style={{
            height: 4,
            flex: 1,
            borderRadius: 4,
            backgroundColor: i <= reached ? color : 'var(--mantine-color-gray-3)',
          }}
        />
      ))}
    </Group>
  );
}

/**
 * A skeleton shaped like the real page, not a centred spinner. The design
 * skill asks for this specifically: a skeleton reserves the space the content
 * will occupy, so nothing jumps when the data lands.
 */
function OrdersSkeleton() {
  return (
    <Stack gap="lg">
      <Group gap="md" grow wrap="wrap">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={88} radius={RADIUS} style={{ minWidth: 160 }} />
        ))}
      </Group>
      <Skeleton height={36} radius={RADIUS} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={96} radius={RADIUS} />
      ))}
    </Stack>
  );
}

/* ── page ────────────────────────────────────────────────────────────── */

const FILTERS = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'In progress' },
  { value: 'delivered', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderHistoryPage() {
  const theme = useMantineTheme();
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

  // [] = run once on mount. NOT [load] - load is a new function object every
  // render, so that would re-fire the effect forever.
  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <Stack gap="lg">
        <PageHeader title="My orders" />
        <OrdersSkeleton />
      </Stack>
    );
  }
  if (error) return <ErrorAlert error={error} onRetry={load} />;

  /* Derived, never stored. These are facts ABOUT orders, so holding them in
   * their own useState would create a second source of truth that can drift
   * out of step with the first. */
  const isDone      = (o) => o.orderStatus === 'DeliveredOrPicked';
  const isCancelled = (o) => o.orderStatus === 'Cancelled';
  const activeCount    = orders.filter((o) => !isDone(o) && !isCancelled(o)).length;
  const cancelledCount = orders.filter(isCancelled).length;

  /* Money is a DECIMAL string ("749.99"). Summing with floats would undo the
   * precision DECIMAL exists to protect: 749.99 + 989.97 lands on
   * 1739.9599999999998. Add in whole cents, divide once at the very end. */
  const spentCents = orders
    .filter((o) => !isCancelled(o))
    .reduce((sum, o) => sum + Math.round(Number(o.totalAmount) * 100), 0);
  const totalSpent = (spentCents / 100).toFixed(2);

  const visible = orders.filter((o) => {
    if (filter === 'active')    return !isDone(o) && !isCancelled(o);
    if (filter === 'delivered') return isDone(o);
    if (filter === 'cancelled') return isCancelled(o);
    return true;
  });

  return (
    <Stack gap="lg">
      <PageHeader
        title="My orders"
        subtitle={orders.length === 1 ? '1 order' : `${orders.length} orders`}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={IconPackage}
          title="No orders yet"
          message="Browse the catalogue to place your first order."
          actionLabel="Browse products"
          actionTo="/"
        />
      ) : (
        <>
          <Group gap="md" grow wrap="wrap">
            <StatCard label="Orders">{orders.length}</StatCard>
            <StatCard label="Total spent"><Money value={totalSpent} /></StatCard>
            <StatCard label="In progress">{activeCount}</StatCard>
            <StatCard label="Cancelled">{cancelledCount}</StatCard>
          </Group>

          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={FILTERS}
            radius={RADIUS}
          />

          {visible.length === 0 ? (
            /* Filtered to nothing is a different situation from having no
             * orders at all, and must not say "you have never ordered". */
            <Paper withBorder radius={RADIUS} p="xl">
              <Text ta="center" c="dimmed">No orders in this category.</Text>
            </Paper>
          ) : (
            <Accordion variant="separated" radius={RADIUS} chevronPosition="right">
              {visible.map((o) => {
                // Same colour the StatusBadge uses, read from Slice C's theme
                // so the accent stripe can never disagree with the badge.
                const name   = theme.other?.statusColors?.[o.orderStatus] || 'gray';
                const accent = theme.colors[name]?.[6] ?? theme.colors.gray[6];
                const pickup = o.delivery.deliveryMode === 'store_pickup';
                const first  = o.items[0];
                const extra  = o.items.length - 1;

                return (
                  <Accordion.Item
                    key={o.orderId}
                    value={String(o.orderId)}
                    style={{ borderLeft: `4px solid ${accent}` }}
                  >
                    <Accordion.Control>
                      <Group justify="space-between" wrap="nowrap" pr="sm" gap="md">
                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                          <Thumb src={first?.imageUrl} alt={first?.productName} size={48} />

                          <Stack gap={4} style={{ minWidth: 0 }}>
                            <Group gap="xs" wrap="nowrap">
                              <Text fw={600}>Order #{o.orderId}</Text>
                              <StatusBadge
                                status={o.orderStatus}
                                deliveryMode={o.delivery.deliveryMode}
                              />
                            </Group>

                            <Text size="sm" c="dimmed" truncate>
                              {formatTimestamp(o.orderDate)} &middot; {first?.productName}
                              {extra > 0 && ` + ${extra} more`}
                            </Text>

                            <Group gap={8} wrap="nowrap" c="dimmed">
                              {pickup
                                ? <IconBuildingStore size={14} />
                                : <IconTruck size={14} />}
                              <Text size="xs">
                                {isDone(o)
                                  ? `${pickup ? 'Picked up at' : 'Delivered to'} ${o.delivery.cityName}`
                                  : isCancelled(o)
                                    ? o.delivery.cityName
                                    : `${pickup ? 'Ready at' : 'Arrives by'} ` +
                                      `${formatPlainDate(o.delivery.estimatedDeliveryDate)}` +
                                      ` · ${o.delivery.cityName}`}
                              </Text>
                            </Group>
                          </Stack>
                        </Group>

                        <Stack gap={8} align="flex-end" style={{ flexShrink: 0 }}>
                          <Money value={o.totalAmount} fw={600} size="lg" />
                          <OrderProgress status={o.orderStatus} color={accent} />
                        </Stack>
                      </Group>
                    </Accordion.Control>

                    <Accordion.Panel>
                      {/* verticalSpacing md gives ~44px rows, the height the
                          design skill asks for. */}
                      <Table verticalSpacing="md" withRowBorders={false}>
                        <Table.Tbody>
                          {o.items.map((it) => (
                            <Table.Tr key={it.orderItemId}>
                              <Table.Td w={56}>
                                <Thumb src={it.imageUrl} alt={it.productName} size={40} />
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{it.productName}</Text>
                                <Text size="xs" c="dimmed">{it.sku}</Text>
                              </Table.Td>
                              <Table.Td w={112}>
                                {it.outOfStockFlag && (
                                  <Badge color="orange" size="sm" variant="light">
                                    Back-order
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td w={144} ta="right">
                                <Text size="sm" c="dimmed">
                                  {it.quantity} &times;{' '}
                                  <Money value={it.unitPriceAtOrder} span />
                                </Text>
                              </Table.Td>
                              <Table.Td w={112} ta="right">
                                <Money value={it.lineTotal} fw={600} />
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>

                      <Group justify="space-between" mt="md">
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">Payment</Text>
                          {o.payment ? (
                            <>
                              <Text size="sm">
                                {o.payment.paymentMethod === 'cod'
                                  ? 'Cash on delivery'
                                  : 'Card'}
                              </Text>
                              <StatusBadge status={o.payment.paymentStatus} />
                            </>
                          ) : (
                            <Text size="sm" c="dimmed">Not recorded</Text>
                          )}
                        </Group>

                        <Button
                          component={Link}
                          to={`/orders/${o.orderId}`}
                          variant="light"
                          size="xs"
                          radius={RADIUS}
                          rightSection={<IconArrowRight size={14} />}
                        >
                          View details
                        </Button>
                      </Group>
                    </Accordion.Panel>
                  </Accordion.Item>
                );
              })}
            </Accordion>
          )}
        </>
      )}
    </Stack>
  );
}
