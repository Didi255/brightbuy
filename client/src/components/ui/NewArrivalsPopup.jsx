/**
 * NewArrivalsPopup — the "new this month" nudge
 * OWNER: Slice C (Vidura)
 *
 * Replaces the `// NEW ARRIVALS — 2026 COLLECTION` eyebrow that used to
 * sit in the hero. A collection note is an aside, not a page title.
 *
 * Deliberately restrained, and the restraint is the point:
 *   - no overlay and no scroll lock — the page stays usable behind it
 *   - no countdown and no email capture
 *   - once per session, dismissible, Escape closes it
 *   - never on /cart or /checkout: interrupting someone mid-purchase to
 *     advertise at them is how you lose the sale you already had
 *
 * Fires 8s after load or at 35% scroll, whichever comes first.
 *
 * sessionStorage is wrapped in try/catch throughout: in a private window
 * or with site data blocked the accessor throws, and a marketing popup
 * must never be the thing that breaks the page.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import ProductTile from './ProductTile';

const KEY = 'bb_new_arrivals_seen';
const SUPPRESSED = ['/cart', '/checkout'];

function alreadySeen() {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
}

export default function NewArrivalsPopup({ products = [] }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    setOpen(false);
    markSeen();
  }, []);

  const blocked = SUPPRESSED.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (blocked || alreadySeen() || products.length < 3) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
      window.removeEventListener('scroll', onScroll);
    };

    /* 35% of the scrollable height, or 8 seconds — whichever first. */
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.35) show();
    };

    const timer = setTimeout(show, 8000);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [blocked, products.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  if (!open || blocked) return null;

  const three = products.slice(0, 3);

  return (
    <Box
      className="bb-popup-in"
      role="complementary"
      aria-label="New this month"
      style={{
        position: 'fixed',
        left: 24,
        bottom: 24,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 300,
        padding: 20,
        borderRadius: 24,
        background: 'var(--mantine-color-ink-7)',
        border: '1px solid rgba(255,236,214,0.10)',
        boxShadow: 'var(--glow-lift)',
      }}
    >
      <UnstyledButton
        onClick={dismiss}
        aria-label="Dismiss new arrivals"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 44, height: 44, borderRadius: 999,
          display: 'grid', placeItems: 'center',
          color: 'var(--mantine-color-ink-3)',
        }}
      >
        <IconX size={16} />
      </UnstyledButton>

      <Group gap={8} wrap="nowrap" mb={12}>
        {three.map((p) => (
          <ProductTile key={p.productId} src={p.imageUrl} alt="" size={64} zoom={1} />
        ))}
      </Group>

      <Stack gap={4}>
        <Text fz={18} fw={600} c="ink.0">New this month</Text>
        <Text fz={14} c="ink.2" style={{ lineHeight: 1.5 }}>
          32 new lines across Footwear, Kitchen and Audio.
        </Text>
        <Text
          component={Link}
          to="/products"
          onClick={dismiss}
          fz={14}
          c="brand.5"
          mt={4}
          style={{ textDecoration: 'none' }}
        >
          Browse all products →
        </Text>
      </Stack>
    </Box>
  );
}
