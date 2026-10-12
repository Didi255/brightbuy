import { useParams } from 'react-router-dom';
import { Button, Group, Stack, Text, Paper } from '@mantine/core';
import { api } from '../../api/client';

export default function PaymentPage() {
  const { orderId } = useParams();

  const handlePay = async () => {
    const res = await api.post('/payments/card', {
      orderId: Number(orderId),
      mockOutcome: 'success',
    });
    console.log(res.data);
  };

  return (
    <Paper p="xl">
      <Stack>
        <Text fw={700} size="lg">Pay now</Text>
        <Text c="dimmed">
          This is a mock payment flow. No card number, CVV or expiry is stored.
        </Text>
        <Group>
          <Button onClick={handlePay}>Pay now</Button>
        </Group>
      </Stack>
    </Paper>
  );
}