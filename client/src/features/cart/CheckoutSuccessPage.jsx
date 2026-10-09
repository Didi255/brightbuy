/**
 * CheckoutSuccessPage — order confirmation after successful checkout
 * OWNER: Slice C (Vidura)
 *
 * Shown after POST /checkout/confirm succeeds.
 * Displays order details, delivery estimate, and navigation links.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  ThemeIcon,
  Paper,
  Divider,
  Badge,
  Center,
} from '@mantine/core';
import {
  IconCircleCheck,
  IconPackage,
  IconTruck,
  IconBuildingStore,
  IconShoppingBag,
  IconArrowRight,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { Money, StatusBadge, LoadingSpinner, ErrorAlert } from '../../components/ui';
import { api } from '../../api/client';

export default function CheckoutSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(setOrder)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingSpinner fullPage label="Loading order details..." />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="bb-page-enter">
      <PageHeader
        title="Order Confirmed!"
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Checkout' },
          { label: 'Confirmation' },
        ]}
      />

      <Center>
        <Card
          withBorder
          radius="lg"
          padding="xl"
          style={{ maxWidth: 600, width: '100%' }}
        >
          <Stack align="center" gap={20}>
            {/* success icon */}
            <ThemeIcon
              size={80}
              radius="xl"
              variant="light"
              color="green"
              style={{
                animation: 'fadeInUp 0.5s ease-out',
              }}
            >
              <IconCircleCheck size={44} stroke={1.5} />
            </ThemeIcon>

            <Text fw={800} size="xl" ta="center">
              Thank you for your order!
            </Text>

            <Text size="sm" c="dimmed" ta="center" maw={400}>
              Your order <strong>#{orderId}</strong> has been placed successfully.
              {order?.delivery?.deliveryMode === 'store_pickup'
                ? " We'll notify you when it's ready for pickup."
                : " We'll deliver it to your address."}
            </Text>

            {order && (
              <>
                <Divider w="100%" />

                {/* order details */}
                <Paper withBorder radius="md" p="md" w="100%">
                  <Stack gap={12}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Order Number</Text>
                      <Text fw={600} size="sm">#{order.orderId}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Status</Text>
                      <StatusBadge status={order.orderStatus} />
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Delivery</Text>
                      <Group gap={6}>
                        {order.delivery?.deliveryMode === 'store_pickup' ? (
                          <IconBuildingStore size={16} color="#0066ff" />
                        ) : (
                          <IconTruck size={16} color="#0066ff" />
                        )}
                        <Text size="sm">
                          {order.delivery?.deliveryMode === 'store_pickup'
                            ? 'Store Pickup'
                            : 'Standard Delivery'}
                        </Text>
                      </Group>
                    </Group>
                    {order.delivery?.estimatedDeliveryDate && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Estimated Date</Text>
                        <Text size="sm" fw={500}>
                          {new Date(order.delivery.estimatedDeliveryDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </Group>
                    )}
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Payment</Text>
                      <Badge variant="light" color="blue" size="sm">
                        {order.payment?.paymentMethod === 'card' ? 'Card' : 'Cash on Delivery'}
                      </Badge>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text fw={700}>Total</Text>
                      <Money value={order.totalAmount} fw={800} size="lg" c="blue" />
                    </Group>
                  </Stack>
                </Paper>
              </>
            )}

            {/* action buttons */}
            <Group>
              <Button
                component={Link}
                to={`/orders/${orderId}`}
                leftSection={<IconPackage size={16} />}
              >
                View Order
              </Button>
              <Button
                component={Link}
                to="/products"
                variant="light"
                rightSection={<IconArrowRight size={16} />}
              >
                Continue Shopping
              </Button>
            </Group>
          </Stack>
        </Card>
      </Center>
    </div>
  );
}
