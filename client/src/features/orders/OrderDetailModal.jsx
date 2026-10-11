/**
 * OrderDetailModal — the expanded state of an order row.   OWNER: Slice A
 *
 * /orders and /orders/:orderId are the same component in two states: the
 * list renders the rows, and a selected order expands into this overlay.
 * The URL syncs as it opens and closes, so the detail page is linkable and
 * the back button behaves.
 *
 * Covers: REQ-5.5, REQ-5.6, REQ-5.7
 */
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Group, Stack, Text, Button, Divider, ScrollArea, UnstyledButton,
} from '@mantine/core';
import { IconX, IconDownload, IconRefresh, IconCreditCard } from '@tabler/icons-react';
import { StatusBadge, Money, ProductTile } from '../../components/ui';
import OrderProgress from './OrderProgress';

const LINE = 'rgba(255,236,214,0.10)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* estimatedDeliveryDate is a plain "YYYY-MM-DD": no time, no zone. Never
   pass it to new Date(), which invents midnight UTC and can shift the day. */
function formatPlainDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

function formatTimestamp(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function Field({ label, children }) {
  return (
    <Stack gap={4}>
      <Text style={MONO} c="ink.4">{label}</Text>
      <Text fz={14} c="ink.0" style={{ lineHeight: 1.5 }}>{children}</Text>
    </Stack>
  );
}

function MoneyRow({ label, value, strong }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text fz={14} c={strong ? 'ink.0' : 'ink.2'} fw={strong ? 600 : 400}>{label}</Text>
      <Money value={value} fz={strong ? 20 : 14} fw={strong ? 500 : 400} accent={strong} />
    </Group>
  );
}

export default function OrderDetailModal({ order, onClose }) {
  const panel = useRef(null);

  /* Escape and outside-click both close. Focus moves into the panel so the
     keyboard does not stay behind the overlay. */
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    function onDown(e) {
      if (panel.current && !panel.current.contains(e.target)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!order) return null;

  const { delivery, payment, items = [] } = order;
  const pickup = delivery?.deliveryMode === 'store_pickup';
  const canPay = payment?.paymentStatus === 'Pending' && order.orderStatus !== 'Cancelled';
  /* An invoice is a document asserting that money changed hands.
     Offering one on a Pending order would be a lie on headed
     paper, so the action does not exist until it is true. */
  const paid = payment?.paymentStatus === 'Paid';

  return (
    <Box
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
    >
      <Box
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.orderId}`}
        style={{
          width: '100%', maxWidth: 860, maxHeight: '90vh',
          background: 'var(--mantine-color-ink-8)',
          border: `1px solid ${LINE}`, borderRadius: 8,
          display: 'flex', flexDirection: 'column', outline: 'none',
        }}
      >
        {/* header */}
        <Group
          justify="space-between"
          wrap="nowrap"
          p={16}
          style={{ borderBottom: `1px solid ${LINE}` }}
        >
          <Group gap={12} wrap="wrap">
            <Text fz={18} fw={500} c="ink.0">
              #{order.orderId}
            </Text>
            <StatusBadge status={order.orderStatus} deliveryMode={delivery?.deliveryMode} />
            <Text style={MONO} c="ink.4">{formatTimestamp(order.orderDate)}</Text>
          </Group>
          <UnstyledButton
            onClick={onClose}
            aria-label="Close order detail"
            style={{
              width: 32, height: 32, borderRadius: 4,
              border: `1px solid ${LINE}`, display: 'grid', placeItems: 'center',
              color: 'var(--mantine-color-ink-2)',
            }}
          >
            <IconX size={16} />
          </UnstyledButton>
        </Group>

        <ScrollArea.Autosize mah="calc(90vh - 150px)">
          <Stack gap={24} p={16}>
            <OrderProgress status={order.orderStatus} deliveryMode={delivery?.deliveryMode} />

            {/* line items */}
            <Stack gap={8}>
              <Text style={MONO} c="ink.4">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
              <Stack gap={8}>
                {items.map((it) => (
                  <Box key={it.orderItemId} style={{ position: 'relative' }}>
                    {/* Built here rather than through ProductCard's compact
                        variant, because an order line has to show the
                        arithmetic: a line total alone is ambiguous the
                        moment someone orders two of something. */}
                    <Group
                      gap={12}
                      wrap="nowrap"
                      align="center"
                      style={{ padding: 12, border: `1px solid ${LINE}`, borderRadius: 8 }}
                    >
                      <ProductTile src={it.imageUrl} alt="" size={56} zoom={1} />
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="nowrap" gap={12} align="flex-start">
                          <Text fz={16} fw={600} c="ink.0" lineClamp={2}>
                            {it.productName}
                          </Text>
                          <Money
                            value={it.lineTotal}
                            fz={16}
                            fw={600}
                            c="ink.0"
                            style={{ flexShrink: 0 }}
                          />
                        </Group>
                        <Text fz={14} c="ink.2">
                          {Money.format(it.unitPriceAtOrder)} × {it.quantity}
                        </Text>
                      </Stack>
                    </Group>
                    {it.outOfStockFlag && (
                      <Text
                                                fz={10}
                        c="brand.5"
                        style={{
                          position: 'absolute', top: 12, right: 96,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}
                      >
                        Back-order
                      </Text>
                    )}
                  </Box>
                ))}
              </Stack>
            </Stack>

            <Divider color={LINE} />

            {/* delivery / payment / money */}
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 28,
              }}
            >
              <Stack gap={16}>
                <Field label={pickup ? 'Collection' : 'Delivery address'}>
                  {pickup
                    ? `Store pickup · ${delivery?.cityName ?? '—'}`
                    : (delivery?.addressSnapshot || '—')}
                </Field>
                <Field label={pickup ? 'Ready by' : 'Estimated delivery'}>
                  {formatPlainDate(delivery?.estimatedDeliveryDate)}
                </Field>
              </Stack>

              <Stack gap={16}>
                <Field label="Payment method">
                  {payment
                    ? (payment.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card')
                    : 'Not recorded'}
                </Field>
                {payment && (
                  <Stack gap={4}>
                    <Text style={MONO} c="ink.4">Payment status</Text>
                    <Box><StatusBadge status={payment.paymentStatus} /></Box>
                  </Stack>
                )}
                {payment?.gatewayRef && (
                  <Field label="Gateway reference">{payment.gatewayRef}</Field>
                )}
              </Stack>

              <Stack gap={8}>
                <Text style={MONO} c="ink.4">Summary</Text>
                <MoneyRow label="Items total" value={order.totalAmount} />
                <Group justify="space-between">
                  <Text fz={14} c="ink.2">Delivery</Text>
                  <Text fz={14} c="ink.2">Free</Text>
                </Group>
                <Divider color={LINE} />
                <MoneyRow label="Total" value={order.totalAmount} strong />
              </Stack>
            </Box>
          </Stack>
        </ScrollArea.Autosize>

        {/* actions */}
        {/* Three actions of equal weight made none of them the answer.
            Ranked: Pay now is the only filled button, Reorder is a ghost,
            and the invoice is a text link at the far left. */}
        <Group
          justify="space-between"
          gap={8}
          p={16}
          wrap="wrap"
          style={{ borderTop: `1px solid ${LINE}` }}
        >
          {paid ? (
            <UnstyledButton
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                color: 'var(--mantine-color-ink-2)',
              }}
            >
              <IconDownload size={15} />
              Download invoice
            </UnstyledButton>
          ) : (
            /* nothing in its place: a disabled ghost button still
               advertises a document that should not exist yet */
            <span />
          )}

          <Group gap={8} wrap="wrap">
            <Button variant="default" size="sm" leftSection={<IconRefresh size={15} />}>
              Reorder
            </Button>
            {canPay && (
              <Button
                component={Link}
                to={`/orders/${order.orderId}/pay`}
                size="sm"
                color="brand.5"
                c="black"
                leftSection={<IconCreditCard size={15} />}
              >
                Pay now
              </Button>
            )}
          </Group>
        </Group>
      </Box>
    </Box>
  );
}
