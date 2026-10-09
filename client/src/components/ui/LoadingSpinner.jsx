/**
 * LoadingSpinner — consistent loading indicator
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner label="Loading orders..." />
 *   <LoadingSpinner fullPage />
 */
import { Center, Loader, Text, Stack } from '@mantine/core';

export default function LoadingSpinner({ label, fullPage = false, size = 'md', ...rest }) {
  const content = (
    <Stack align="center" gap={12} {...rest}>
      <Loader size={size} type="dots" color="brightBlue" />
      {label && (
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
      )}
    </Stack>
  );

  if (fullPage) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        {content}
      </Center>
    );
  }

  return (
    <Center py={48}>
      {content}
    </Center>
  );
}
