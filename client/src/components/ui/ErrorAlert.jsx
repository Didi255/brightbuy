/**
 * ErrorAlert — renders the shared error envelope
 * OWNER: Slice C (Vidura)
 *
 * Reads the error shape from API.md:
 *   { code, message, fields? }
 *
 * Usage:
 *   <ErrorAlert error={error} />
 *   <ErrorAlert error={error} onRetry={() => refetch()} />
 */
import { Alert, Text, List, Button, Group } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export default function ErrorAlert({ error, onRetry, title, ...rest }) {
  if (!error) return null;

  const message =
    typeof error === 'string'
      ? error
      : error.message || 'Something went wrong. Please try again.';

  const fields = error?.fields || null;

  return (
    <Alert
      color="red"
      variant="light"
      radius="md"
      title={title || 'Error'}
      icon={<IconAlertCircle size={20} />}
      styles={{
        root: { animation: 'fadeInUp 0.25s ease-out' },
      }}
      {...rest}
    >
      <Text size="sm">{message}</Text>

      {fields && Object.keys(fields).length > 0 && (
        <List size="sm" mt={8} spacing={4}>
          {Object.entries(fields).map(([key, val]) => (
            <List.Item key={key}>
              <Text span fw={600}>{key}:</Text> {val}
            </List.Item>
          ))}
        </List>
      )}

      {onRetry && (
        <Group mt={12}>
          <Button
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </Group>
      )}
    </Alert>
  );
}
