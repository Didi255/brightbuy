/**
 * EmptyState — actionable "nothing here" placeholders
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <EmptyState
 *     icon={IconShoppingCart}
 *     title="Your cart is empty"
 *     message="Browse our products and add items to your cart."
 *     actionLabel="Shop Now"
 *     actionTo="/products"
 *   />
 */
import { Stack, Text, Button, ThemeIcon, Center } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconMoodEmpty } from '@tabler/icons-react';

export default function EmptyState({
  icon: Icon = IconMoodEmpty,
  title = 'Nothing here yet',
  message,
  actionLabel,
  actionTo,
  onAction,
  ...rest
}) {
  return (
    <Center py={64} {...rest}>
      <Stack align="center" gap={16} style={{ maxWidth: 360, textAlign: 'center' }}>
        <ThemeIcon
          size={72}
          radius="xl"
          variant="light"
          color="gray"
          style={{ opacity: 0.7 }}
        >
          <Icon size={36} stroke={1.4} />
        </ThemeIcon>

        <Text fw={700} size="lg">{title}</Text>

        {message && (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
            {message}
          </Text>
        )}

        {(actionLabel && (actionTo || onAction)) && (
          <Button
            component={actionTo ? Link : undefined}
            to={actionTo}
            onClick={onAction}
            variant="light"
            size="sm"
            mt={4}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
