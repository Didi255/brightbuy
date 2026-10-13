import { useState } from 'react';
import { useEffect, useState } from 'react';
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { ErrorAlert, StatusBadge } from '../../components/ui';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

      useEffect(() => {
      let cancelled = false;

      api.get(`/orders/${orderId}`)
        .then((order) => {
          if (!cancelled && order.payment) setPayment(order.payment);
        })
        .catch((requestError) => {
          if (!cancelled) setError(requestError);
        });

      return () => { cancelled = true; };
    }, [orderId]);

  async function submitPayment(outcome) {
    const numericOrderId = Number(orderId);

    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      setError(new Error('The order ID is invalid.'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = payment?.canRetry
        ? await api.post(`/payments/${payment.paymentId}/retry`, {
            mockOutcome: outcome,
          })
        : await api.post('/payments/card', {
            orderId: numericOrderId,
            mockOutcome: outcome,
          });

      setPayment(result);
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
        subtitle="Mock card payment. No card number, CVV, or expiry is collected."
      />

      {error && (
        <ErrorAlert
          error={error}
          title="Payment could not be processed"
        />
      )}

      <Paper withBorder p="lg">
        <Stack gap={16}>
          <Text c="ink.2">
            Choose a mock gateway outcome to demonstrate the payment flow.
          </Text>

          <Group>
            <Button
              loading={submitting}
              disabled={submitting}
              onClick={() => submitPayment('success')}
            >
              Simulate successful payment
            </Button>

            <Button
              variant="default"
              loading={submitting}
              disabled={submitting}
              onClick={() => submitPayment('failure')}
            >
              Simulate failed payment
            </Button>
          </Group>

          {payment && (
            <Stack gap={8}>
              <Group>
                <Text c="ink.2">Payment status</Text>
                <StatusBadge status={payment.paymentStatus} />
              </Group>

              {payment.gatewayRef && (
                <Text c="ink.2">Gateway reference: {payment.gatewayRef}</Text>
              )}

              {payment.canRetry && (
                <Text c="ink.2">
                  Payment failed. You can retry within the allowed time window.
                </Text>
              )}

              <Button
                component={Link}
                to={`/orders/${orderId}`}
                variant="default"
                style={{ alignSelf: 'flex-start' }}
              >
                Return to order
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}