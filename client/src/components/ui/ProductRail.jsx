/**
 * ProductRail — a horizontal strip of ProductCards with a heading
 * OWNER: Slice C (Vidura)
 *
 * Usage:
 *   <ProductRail title="Popular in Laptops" items={rows} />
 *   <ProductRail title="Recently viewed" items={rows} emptyHidden />
 *
 * Exists because four screens need the same thing — the catalogue below
 * its grid, the product page below the fold, the cart, the home page.
 * Four local copies would drift into four different card widths.
 *
 * Renders nothing at all when there is nothing to show. A rail with an
 * empty-state box inside it is worse than no rail: it draws attention to
 * an absence rather than filling a gap.
 */
import { useRef } from 'react';
import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import ProductCard from './ProductCard';
import Reveal from './Reveal';

const LINE = 'rgba(255,236,214,0.10)';
const LINE_HOVER = 'rgba(255,140,0,0.28)';

function Arrow({ onClick, label, children }) {
  return (
    <UnstyledButton
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36, height: 36, borderRadius: 'var(--mantine-radius-md)',
        display: 'grid', placeItems: 'center',
        border: `1px solid ${LINE}`,
        color: 'var(--mantine-color-ink-2)',
        transition: 'border-color 150ms cubic-bezier(0.2, 0, 0, 1)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = LINE_HOVER; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}
    >
      {children}
    </UnstyledButton>
  );
}

export default function ProductRail({ title, items = [], onAddToCart }) {
  const rail = useRef(null);
  if (!items.length) return null;

  const by = (dir) => rail.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <Box component="section" mt={64}>
      <Group justify="space-between" align="center" mb={16} wrap="nowrap">
        <Text component="h2" c="ink.0" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {title}
        </Text>
        {items.length > 3 && (
          <Group gap={8}>
            <Arrow onClick={() => by(-1)} label={`Scroll ${title} left`}>
              <IconArrowLeft size={16} />
            </Arrow>
            <Arrow onClick={() => by(1)} label={`Scroll ${title} right`}>
              <IconArrowRight size={16} />
            </Arrow>
          </Group>
        )}
      </Group>

      <Box className="bb-rail" ref={rail}>
        {items.map((p, i) => (
          <Reveal key={p.productId} kind="right" i={Math.min(i, 8)} stagger={40}>
            <ProductCard
              product={{ ...p, price: p.priceFrom, categoryName: p.categories?.[0]?.categoryName }}
              onAddToCart={onAddToCart}
            />
          </Reveal>
        ))}
      </Box>
    </Box>
  );
}
