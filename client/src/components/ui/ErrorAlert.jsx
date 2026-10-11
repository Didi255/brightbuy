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
 *
 * Circuit Noir: left-aligned, a hairline red border at 35% over an 8% fill,
 * no icon circle, no shadow. An error says what failed and what to do — the
 * retry is part of the message, not decoration.
 */
import { Box, Text, Stack, Group, UnstyledButton } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

const RED = 'var(--mantine-color-red-5)';

export default function ErrorAlert({ error, onRetry, title, ...rest }) {
  if (!error) return null;

  const message =
    typeof error === 'string'
      ? error
      : error.message || 'Something went wrong. Please try again.';

  const fields = error?.fields || null;
  const code = typeof error === 'object' ? error.code : null;

  return (
    <Box
      role="alert"
      p={16}
      style={{
        border: '1px solid rgba(250,82,82,0.35)',
        background: 'rgba(250,82,82,0.08)',
        borderRadius: 4,
      }}
      {...rest}
    >
      <Group gap={12} wrap="nowrap" align="flex-start">
        <IconAlertTriangle size={16} style={{ color: RED, flexShrink: 0, marginTop: 2 }} />

        <Stack gap={8} style={{ minWidth: 0, flex: 1 }}>
          <Group gap={8} wrap="wrap" align="baseline">
            <Text fz={14} fw={600} c="ink.0">
              {title || 'Something went wrong'}
            </Text>
            {code && (
              <Text
                ff="monospace"
                fz={12}
                c="ink.3"
              >
                {code}
              </Text>
            )}
          </Group>

          <Text fz={14} c="ink.0" style={{ lineHeight: 1.5 }}>{message}</Text>

          {fields && Object.keys(fields).length > 0 && (
            <Stack gap={4} mt={0}>
              {Object.entries(fields).map(([key, val]) => (
                <Group key={key} gap={8} wrap="nowrap" align="baseline">
                  <Text
                    fz={14}
                    c="ink.3"
                  >
                    {key}
                  </Text>
                  <Text fz={13} c="ink.2">{val}</Text>
                </Group>
              ))}
            </Stack>
          )}

          {onRetry && (
            <UnstyledButton
              onClick={onRetry}
              mt={0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                color: RED,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <IconRefresh size={14} />
              Try again
            </UnstyledButton>
          )}
        </Stack>
      </Group>
    </Box>
  );
}
