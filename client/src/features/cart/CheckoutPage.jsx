/**
 * CheckoutPage — multi-step checkout flow
 * OWNER: Slice C (Vidura)
 *
 * Steps: Delivery Mode → Address → Payment Method → Review & Confirm
 * Covers: REQ-5.1–5.7, 6.1, 7.x
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stepper,
  Card,
  Text,
  Group,
  Button,
  Radio,
  Stack,
  Select,
  Paper,
  Divider,
  Badge,
  Alert,
} from '@mantine/core';
import {
  IconTruck,
  IconBuildingStore,
  IconMapPin,
  IconCreditCard,
  IconCash,
  IconCheck,
  IconShoppingCart,
  IconArrowLeft,
  IconArrowRight,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { Money, LoadingSpinner, ErrorAlert } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/client';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [step, setStep] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState('standard');
  const [addressId, setAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [addresses, setAddresses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart if not loaded
  useEffect(() => {
    if (!cart) fetchCart();
  }, [cart, fetchCart]);

  // Fetch user addresses
  useEffect(() => {
    api.get('/me/addresses')
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  // Fetch checkout summary when delivery details change
  useEffect(() => {
    if (step >= 2 && (deliveryMode === 'store_pickup' || addressId)) {
      setLoading(true);
      const params = new URLSearchParams({ deliveryMode });
      if (deliveryMode === 'standard' && addressId) {
        params.append('addressId', addressId);
      }
      api.get(`/checkout/summary?${params}`)
        .then(setSummary)
        .catch((err) => setError(err))
        .finally(() => setLoading(false));
    }
  }, [step, deliveryMode, addressId]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.post('/checkout/confirm', {
        deliveryMode,
        addressId: deliveryMode === 'standard' ? addressId : undefined,
        paymentMethod,
      });
      navigate(`/checkout/success/${order.orderId}`);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!deliveryMode;
    if (step === 1) return deliveryMode === 'store_pickup' || !!addressId;
    if (step === 2) return !!paymentMethod;
    return true;
  };

  if (!cart) return <LoadingSpinner fullPage label="Loading checkout..." />;

  return (
    <div className="bb-page-enter">
      <PageHeader
        title="Checkout"
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Cart', to: '/cart' },
          { label: 'Checkout' },
        ]}
      />

      {error && <ErrorAlert error={error} mb={20} />}

      <Stepper
        active={step}
        onStepClick={setStep}
        size="sm"
        mb={32}
        styles={{
          stepIcon: { borderWidth: 2 },
          separator: { marginLeft: 2, marginRight: 2 },
        }}
      >
        <Stepper.Step label="Delivery" icon={<IconTruck size={18} />}>
          <Card withBorder radius="md" p="xl" mt={16}>
            <Text fw={600} size="lg" mb={16}>How would you like to receive your order?</Text>
            <Radio.Group value={deliveryMode} onChange={setDeliveryMode}>
              <Stack gap={12}>
                <Radio
                  value="standard"
                  label={
                    <Group gap={8}>
                      <IconTruck size={18} color="#0066ff" />
                      <div>
                        <Text fw={500} size="sm">Standard Delivery</Text>
                        <Text size="xs" c="dimmed">Delivered to your address</Text>
                      </div>
                    </Group>
                  }
                />
                <Radio
                  value="store_pickup"
                  label={
                    <Group gap={8}>
                      <IconBuildingStore size={18} color="#0066ff" />
                      <div>
                        <Text fw={500} size="sm">Store Pickup</Text>
                        <Text size="xs" c="dimmed">Pick up from our Houston store</Text>
                      </div>
                    </Group>
                  }
                />
              </Stack>
            </Radio.Group>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Address" icon={<IconMapPin size={18} />}>
          <Card withBorder radius="md" p="xl" mt={16}>
            {deliveryMode === 'store_pickup' ? (
              <Stack gap={12}>
                <Text fw={600} size="lg">Store Pickup</Text>
                <Paper withBorder radius="sm" p="md" style={{ background: '#f8f9fa' }}>
                  <Group gap={8}>
                    <IconBuildingStore size={20} color="#0066ff" />
                    <div>
                      <Text fw={500} size="sm">BrightBuy Store</Text>
                      <Text size="xs" c="dimmed">Houston, Texas</Text>
                    </div>
                  </Group>
                </Paper>
                <Text size="xs" c="dimmed">
                  Your order will be ready for pickup. We'll notify you when it's ready.
                </Text>
              </Stack>
            ) : (
              <Stack gap={12}>
                <Text fw={600} size="lg">Select Delivery Address</Text>
                {addresses.length === 0 ? (
                  <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
                    No addresses found. Please add one in your profile first.
                  </Alert>
                ) : (
                  <Select
                    label="Delivery Address"
                    placeholder="Choose an address"
                    data={addresses.map((a) => ({
                      value: String(a.addressId),
                      label: [a.houseNum, a.address1, a.address2, a.cityName]
                        .filter(Boolean)
                        .join(', '),
                    }))}
                    value={addressId}
                    onChange={setAddressId}
                    size="md"
                  />
                )}
              </Stack>
            )}
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Payment" icon={<IconCreditCard size={18} />}>
          <Card withBorder radius="md" p="xl" mt={16}>
            <Text fw={600} size="lg" mb={16}>Payment Method</Text>
            <Radio.Group value={paymentMethod} onChange={setPaymentMethod}>
              <Stack gap={12}>
                <Radio
                  value="card"
                  label={
                    <Group gap={8}>
                      <IconCreditCard size={18} color="#0066ff" />
                      <div>
                        <Text fw={500} size="sm">Credit / Debit Card</Text>
                        <Text size="xs" c="dimmed">Pay securely online</Text>
                      </div>
                    </Group>
                  }
                />
                <Radio
                  value="cod"
                  label={
                    <Group gap={8}>
                      <IconCash size={18} color="#0066ff" />
                      <div>
                        <Text fw={500} size="sm">Cash on Delivery</Text>
                        <Text size="xs" c="dimmed">Pay when you receive your order</Text>
                      </div>
                    </Group>
                  }
                />
              </Stack>
            </Radio.Group>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Review" icon={<IconCheck size={18} />}>
          <Card withBorder radius="md" p="xl" mt={16}>
            <Text fw={600} size="lg" mb={16}>Order Review</Text>

            {loading ? (
              <LoadingSpinner label="Preparing summary..." />
            ) : summary ? (
              <Stack gap={16}>
                <Paper withBorder radius="sm" p="md">
                  <Text fw={600} size="sm" mb={8}>Delivery</Text>
                  <Group gap={8}>
                    <Badge variant="light" color="blue">
                      {deliveryMode === 'store_pickup' ? 'Store Pickup' : 'Standard Delivery'}
                    </Badge>
                    {summary.cityName && <Text size="sm">{summary.cityName}</Text>}
                  </Group>
                  <Text size="sm" mt={8}>
                    Estimated: {summary.estimatedDeliveryDays} days
                    ({summary.estimatedDeliveryDate})
                  </Text>
                </Paper>

                <Paper withBorder radius="sm" p="md">
                  <Text fw={600} size="sm" mb={8}>Payment</Text>
                  <Badge variant="light" color="blue">
                    {paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
                  </Badge>
                </Paper>

                <Paper withBorder radius="sm" p="md">
                  <Text fw={600} size="sm" mb={8}>Items ({cart.itemCount})</Text>
                  {cart.items.map((item) => (
                    <Group key={item.itemId} justify="space-between" mb={4}>
                      <Text size="sm">
                        {item.variant?.productName} × {item.quantity}
                      </Text>
                      <Money value={item.lineTotal} size="sm" />
                    </Group>
                  ))}
                  <Divider my={8} />
                  <Group justify="space-between">
                    <Text fw={700}>Total</Text>
                    <Money value={summary.total} fw={800} size="lg" c="blue" />
                  </Group>
                </Paper>

                {summary.hasOutOfStockItems && (
                  <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>
                    Some items are out of stock. Your order will still be placed,
                    but delivery may take additional time.
                  </Alert>
                )}
              </Stack>
            ) : null}
          </Card>
        </Stepper.Step>
      </Stepper>

      {/* navigation buttons */}
      <Group justify="space-between" mt={24}>
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => step === 0 ? navigate('/cart') : setStep(step - 1)}
        >
          {step === 0 ? 'Back to Cart' : 'Back'}
        </Button>

        {step < 3 ? (
          <Button
            rightSection={<IconArrowRight size={16} />}
            disabled={!canProceed()}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            size="md"
            loading={submitting}
            leftSection={<IconShoppingCart size={18} />}
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg, #0066ff 0%, #0052cc 100%)',
              fontWeight: 700,
            }}
          >
            Place Order
          </Button>
        )}
      </Group>
    </div>
  );
}
