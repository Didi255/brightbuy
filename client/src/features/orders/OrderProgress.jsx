/**
 * OrderProgress — the four forward order states as a tracker.   OWNER: Slice A
 *
 * Completed nodes are filled amber circles with a black tick, the current
 * node is a 2px amber ring around an amber dot, future nodes are a faint
 * ring with a muted label. CIRCLES, joined by a 2px line through their
 * centres: without that line it is not a stepper, just four icons in a
 * row, and four empty squares read as checkboxes waiting to be ticked.
 *
 * `Cancelled` is NOT a point on this line — an order that was cancelled
 * never travelled it. It renders as a single red terminal state instead,
 * because a partly-filled track would imply the parcel is still coming.
 *
 * Labels come from theme.other.statusLabelsByMode so a pickup order reads
 * "Ready for Pickup" and "Picked Up" rather than the delivery wording.
 */
import { Box, Group, Text, useMantineTheme } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

const FLOW = ['Placed', 'Processing', 'ReadyOrOut', 'DeliveredOrPicked'];
/* the track behind a step not yet reached */
const TRACK = 'rgba(255,236,214,0.12)';
/* the ring around a step not yet reached */
const RING = 'rgba(255,236,214,0.18)';

export default function OrderProgress({ status, deliveryMode }) {
  const theme = useMantineTheme();
  const byMode = theme.other?.statusLabelsByMode || {};
  const labels = theme.other?.statusLabels || {};

  const labelFor = (s) =>
    (deliveryMode && byMode[deliveryMode]?.[s]) || labels[s] || s;

  if (status === 'Cancelled') {
    return (
      <Group
        gap={8}
        wrap="nowrap"
        p={12}
        style={{
          border: '1px solid rgba(250,82,82,0.35)',
          background: 'rgba(250,82,82,0.08)',
          borderRadius: 4,
        }}
      >
        <Box
          style={{
            width: 20, height: 20, borderRadius: 999, flexShrink: 0,
            background: 'var(--mantine-color-red-6)',
            display: 'grid', placeItems: 'center',
          }}
        >
          <IconX size={13} color="#000" stroke={3} />
        </Box>
        <Text
          fz={14}
          fw={600}
          c="red.5"
        >
          Order cancelled
        </Text>
      </Group>
    );
  }

  const reached = FLOW.indexOf(status);

  return (
    <Group gap={0} wrap="nowrap" align="flex-start" style={{ width: '100%' }}>
      {FLOW.map((step, i) => {
        const done = i < reached;
        const current = i === reached;
        const amber = 'var(--mantine-color-brand-5)';

        return (
          <Box key={step} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={0} wrap="nowrap" align="center">
              <Box
                style={{
                  width: 20, height: 20, borderRadius: 999, flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: done ? amber : 'transparent',
                  /* 2px on the current step, so the ring reads as a ring
                     rather than as a hairline outline */
                  border: current
                    ? `2px solid ${amber}`
                    : `1px solid ${done ? amber : RING}`,
                }}
              >
                {done && <IconCheck size={12} color="#000" stroke={3} />}
                {current && (
                  <Box
                    className="bb-status-dot--live"
                    style={{ width: 8, height: 8, borderRadius: 999, background: amber }}
                  />
                )}
              </Box>

              {/* The connector, omitted after the last node. A segment is
                  amber when the step AFTER it has been reached: the line
                  belongs to the step it leads into. */}
              {i < FLOW.length - 1 && (
                <Box
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 2,
                    background: done ? amber : TRACK,
                  }}
                />
              )}
            </Group>

            <Text
              fz={13}
              mt={8}
              pr={8}
              c={current ? 'brand.5' : (done ? 'ink.0' : 'ink.3')}
              fw={current ? 600 : 400}
              style={{ lineHeight: 1.3 }}
            >
              {labelFor(step)}
            </Text>
          </Box>
        );
      })}
    </Group>
  );
}
