import { useState } from 'react';
import { Button, NumberInput, Paper, Stack, Text, TextInput } from '@mantine/core';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { ErrorAlert } from '../../components/ui';

export default function StockAdjustmentsPage() {
  const [variantId, setVariantId] = useState('');
  const [changeQty, setChangeQty] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError(null);
    setMessage('');

    const id = Number(variantId);
    const quantity = Number(changeQty);
    if (!Number.isInteger(id) || id <= 0) {
      setError(new Error('Enter a valid variant ID.'));
      return;
    }
    if (!Number.isInteger(quantity) || quantity === 0) {
      setError(new Error('Adjustment quantity must be a non-zero integer.'));
      return;
    }
    if (!reason.trim()) {
      setError(new Error('Enter a reason for this stock adjustment.'));
      return;
    }
    if (
      quantity < 0
      && !window.confirm(`Reduce stock by ${Math.abs(quantity)} units?`)
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('/admin/stock-adjustments', {
        variantId: id,
        changeQty: quantity,
        reason: reason.trim(),
      });
      setMessage(
        `Adjustment ${result.adjustmentId} recorded for variant ${result.variantId}.`
      );
      setVariantId('');
      setChangeQty('');
      setReason('');
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap={24}>
      <PageHeader
        title="Stock adjustments"
        crumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Stock adjustments' }]}
        subtitle="Record a reason for every manual stock change."
      />

      {error && <ErrorAlert error={error} title="Could not adjust stock" />}
      {message && <Text role="status" c="ink.0">{message}</Text>}

      <Paper withBorder p="lg" maw={560}>
        <form onSubmit={submit}>
          <Stack gap={16}>
            <NumberInput
              label="Variant ID"
              value={variantId}
              onChange={setVariantId}
              min={1}
              allowDecimal={false}
              required
            />
            <NumberInput
              label="Quantity change"
              description="Use a positive number to add stock and a negative number to remove stock."
              value={changeQty}
              onChange={setChangeQty}
              allowDecimal={false}
              required
            />
            <TextInput
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
              maxLength={255}
              required
            />
            <Button type="submit" loading={loading} disabled={loading}>
              Record adjustment
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}