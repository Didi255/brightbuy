import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { ErrorAlert, StatusBadge } from '../../components/ui';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function simulatePayment(mockOutcome) {
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/payments/card', {
        orderId: Number(orderId),
        mockOutcome,
      });
      setResult(response);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap={24}>
      <PageHeader
        title="Payment"
        crumbs={[
          { label: 'Orders', to: '/orders' },
          { label: `Order ${orderId}` },
          { label: 'Payment' },
        ]}
        subtitle="This demo simulates a card gateway. No card details are collected."
      />

      {error && <ErrorAlert error={error} title="Payment could not be processed" />}

      <Group>
        <Button
          loading={submitting}
          disabled={submitting}
          onClick={() => simulatePayment('success')}
        >
          Simulate successful payment
        </Button>
        <Button
          variant="default"
          loading={submitting}
          disabled={submitting}
          onClick={() => simulatePayment('failure')}
        >
          Simulate failed payment
        </Button>
      </Group>

      {result && (
        <Stack gap={8}>
          <Group>
            <Text>Payment status</Text>
            <StatusBadge status={result.paymentStatus} />
          </Group>
          {result.gatewayRef && <Text>Gateway reference: {result.gatewayRef}</Text>}
          {result.canRetry && <Text>This failed payment can be retried from your order.</Text>}
          <Button component={Link} to={`/orders/${orderId}`} variant="default">
            Return to order
          </Button>
        </Stack>
      )}
    </Stack>
  );
}