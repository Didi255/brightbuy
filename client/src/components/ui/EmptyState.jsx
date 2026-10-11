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
 *
 * Circuit Noir: a dashed hairline outline rather than a filled card — an
 * empty region should read as an unfilled slot in the grid, not as content.
 * An empty state always says what would appear here and offers a way to
 * make it appear; a bare "No data" is never acceptable.
 */
import { Stack, Text, Button, Center, Box } from '@mantine/core';
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
    <Box
      style={{
        border: '1px dashed var(--mantine-color-ink-5)',
        borderRadius: 8,
      }}
      {...rest}
    >
      <Center py={64} px={24}>
        <Stack align="center" gap={16} style={{ maxWidth: 380, textAlign: 'center' }}>
          <Icon size={40} stroke={1.3} color="var(--mantine-color-ink-4)" aria-hidden="true" />

          <Text
            fw={600}
            size="20px"
            c="ink.0"
            style={{ letterSpacing: '-0.02em' }}
          >
            {title}
          </Text>

          {message && (
            <Text size="sm" c="ink.2" style={{ lineHeight: 1.6 }}>
              {message}
            </Text>
          )}

          {(actionLabel && (actionTo || onAction)) && (
            <Button
              component={actionTo ? Link : undefined}
              to={actionTo}
              onClick={onAction}
              color="brand.5"
              c="black"
              size="sm"
              mt={8}
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Center>
    </Box>
  );
}
