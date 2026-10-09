/**
 * CartPage — shopping cart
 * OWNER: Slice C (Vidura)
 *
 * Shows cart items with variant attributes, unit price, quantity editor,
 * line totals, subtotal, and out-of-stock warnings.
 * Covers: REQ-3.1, 3.2, 3.3, 3.7
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Group,
  Text,
  Image,
  NumberInput,
  ActionIcon,
  Button,
  Divider,
  Badge,
  Stack,
  Grid,
  Paper,
  Tooltip,
  Modal,
} from '@mantine/core';
import {
  IconTrash,
  IconShoppingBag,
  IconShoppingCart,
  IconAlertTriangle,
  IconArrowRight,
  IconArrowLeft,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { Money, EmptyState, LoadingSpinner, ErrorAlert } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading, error, fetchCart, updateItem, removeItem } = useCart();
  const [removing, setRemoving] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (itemId, qty) => {
    if (qty < 1) return;
    try {
      await updateItem(itemId, qty);
    } catch (err) {
      // error is set in context
    }
  };

  const handleRemove = async (itemId) => {
    setRemoving(itemId);
    try {
      await removeItem(itemId);
    } catch (err) {
      // error is set in context
    } finally {
      setRemoving(null);
      setConfirmRemove(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage label="Loading your cart..." />;

  return (
    <div className="bb-page-enter">
      <PageHeader
        title="Shopping Cart"
        subtitle={cart?.items?.length ? `${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''} in your cart` : undefined}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Cart' }]}
      />

      {error && <ErrorAlert error={error} onRetry={fetchCart} mb={24} />}

      {(!cart || !cart.items || cart.items.length === 0) ? (
        <EmptyState
          icon={IconShoppingCart}
          title="Your cart is empty"
          message="Browse our collection of electronics and find something you love."
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <Grid gutter={24}>
          {/* ── cart items ───────────────────────────────────────── */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap={16}>
              {cart.items.map((item) => (
                <Card key={item.itemId} withBorder radius="md" padding="md">
                  <Group align="flex-start" wrap="nowrap" gap={16}>
                    {/* product image */}
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        background: '#f1f3f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {item.variant?.imageUrl ? (
                        <Image
                          src={item.variant.imageUrl}
                          alt={item.variant.productName}
                          w={100}
                          h={100}
                          fit="cover"
                        />
                      ) : (
                        <IconShoppingBag size={32} stroke={1.2} color="#adb5bd" />
                      )}
                    </div>

                    {/* details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Text fw={600} size="sm" lineClamp={2}>
                            {item.variant?.productName || 'Product'}
                          </Text>
                          {item.variant?.attributes?.length > 0 && (
                            <Group gap={6} mt={4}>
                              {item.variant.attributes.map((attr) => (
                                <Badge
                                  key={attr.name}
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                >
                                  {attr.name}: {attr.value}
                                </Badge>
                              ))}
                            </Group>
                          )}
                          <Text size="xs" c="dimmed" mt={4}>
                            SKU: {item.variant?.sku}
                          </Text>
                        </div>

                        <Tooltip label="Remove item" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            loading={removing === item.itemId}
                            onClick={() => setConfirmRemove(item.itemId)}
                            aria-label="Remove from cart"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>

                      {/* out-of-stock warning */}
                      {!item.variant?.inStock && (
                        <Group gap={6} mt={8}>
                          <IconAlertTriangle size={14} color="#e67700" />
                          <Text size="xs" c="orange" fw={500}>
                            Currently out of stock — delivery may be delayed
                          </Text>
                        </Group>
                      )}

                      {/* quantity + price row */}
                      <Group justify="space-between" mt={12} align="center">
                        <Group gap={8}>
                          <Text size="xs" c="dimmed">Qty:</Text>
                          <NumberInput
                            value={item.quantity}
                            onChange={(val) => handleQuantityChange(item.itemId, val)}
                            min={1}
                            max={99}
                            size="xs"
                            w={80}
                            styles={{ input: { textAlign: 'center' } }}
                          />
                        </Group>

                        <Group gap={12}>
                          <Text size="xs" c="dimmed">
                            <Money value={item.variant?.price} size="xs" /> × {item.quantity}
                          </Text>
                          <Money value={item.lineTotal} fw={700} size="sm" />
                        </Group>
                      </Group>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>

            {/* continue shopping */}
            <Group mt={20}>
              <Button
                component={Link}
                to="/products"
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
              >
                Continue Shopping
              </Button>
            </Group>
          </Grid.Col>

          {/* ── order summary sidebar ────────────────────────────── */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              withBorder
              radius="md"
              p="xl"
              style={{
                position: 'sticky',
                top: 88,
                background: 'linear-gradient(180deg, #fff 0%, #f8f9fa 100%)',
              }}
            >
              <Text fw={700} size="lg" mb={16}>
                Order Summary
              </Text>

              <Stack gap={10}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Items ({cart.itemCount})</Text>
                  <Money value={cart.subtotal} size="sm" />
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Shipping</Text>
                  <Text size="sm" c="dimmed">Calculated at checkout</Text>
                </Group>
              </Stack>

              <Divider my={16} />

              <Group justify="space-between">
                <Text fw={700}>Subtotal</Text>
                <Money value={cart.subtotal} fw={800} size="lg" c="blue" />
              </Group>

              {cart.hasOutOfStockItems && (
                <Paper
                  withBorder
                  radius="sm"
                  p="xs"
                  mt={12}
                  style={{ borderColor: '#ffd43b', background: '#fffbe6' }}
                >
                  <Group gap={8} wrap="nowrap">
                    <IconAlertTriangle size={16} color="#e67700" style={{ flexShrink: 0 }} />
                    <Text size="xs" c="orange.8">
                      Some items are out of stock. You can still order — delivery will be extended.
                    </Text>
                  </Group>
                </Paper>
              )}

              <Button
                fullWidth
                size="md"
                mt={20}
                rightSection={<IconArrowRight size={18} />}
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: '/checkout' } });
                  } else {
                    navigate('/checkout');
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
                  fontWeight: 700,
                }}
              >
                {user ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              </Button>
            </Paper>
          </Grid.Col>
        </Grid>
      )}

      {/* ── confirm remove modal ─────────────────────────────────── */}
      <Modal
        opened={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title="Remove Item"
        centered
        size="sm"
      >
        <Text size="sm">Are you sure you want to remove this item from your cart?</Text>
        <Group justify="flex-end" mt={20}>
          <Button variant="default" onClick={() => setConfirmRemove(null)}>
            Keep
          </Button>
          <Button
            color="red"
            loading={removing === confirmRemove}
            onClick={() => handleRemove(confirmRemove)}
          >
            Remove
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
