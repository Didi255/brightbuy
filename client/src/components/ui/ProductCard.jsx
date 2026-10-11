/**
 * ProductCard — the most reused component in the app
 * OWNER: Slice C (Vidura)
 *
 * Used by: the catalogue grid, home rails, search results, related-product
 * rails, and (in 'compact') cart rows and order lines.
 *
 * Props:
 *   product      the Product shape from API.md
 *   variant      'grid' (default) | 'compact'
 *   onAddToCart  optional
 *
 * Colour discipline:
 *   ORANGE is action — the price and the add-to-cart, nothing else.
 *   Elevation on hover is a surface step plus a brighter border, never a
 *   coloured bloom. A glow around every card in a grid is the single most
 *   recognisable generated-page tell.
 *
 * RATINGS: the schema has no `review` table, so `rating`/`reviewCount`
 * render only when the API supplies them. Do not fabricate them — this
 * project is marked on whether the UI reflects its database.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Text, Group, Stack, UnstyledButton } from '@mantine/core';
import {
  IconStarFilled, IconHeart, IconHeartFilled, IconShoppingCart,
} from '@tabler/icons-react';
import { isFavourite, toggleFavourite } from '../../api/favourites';
import Money from './Money';
import ProductTile from './ProductTile';

const LINE = 'rgba(255,236,214,0.10)';
const LINE_HOVER = 'rgba(255,140,0,0.28)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';
const RADIUS = 'var(--mantine-radius-md)';

/** Sale / stock chip. Orange only when it marks a deal. */
function Flag({ children, tone = 'sale' }) {
  const sale = tone === 'sale';
  return (
    <Box
      component="span"
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: 4,
        background: sale ? 'var(--mantine-color-brand-5)' : 'rgba(0,0,0,0.72)',
        color: sale ? '#000' : '#fff',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.4,
      }}
    >
      {children}
    </Box>
  );
}

export default function ProductCard({ product, variant = 'grid', onAddToCart }) {
  const [hover, setHover] = useState(false);

  const {
    productId, name, productName, brand, imageUrl,
    priceFrom, price, rrp, categoryName,
    rating, reviewCount, totalStock, discountPercent,
  } = product || {};

  const title = productName || name || 'Product';
  const shown = price ?? priceFrom;
  const href = `/products/${productId}`;
  const lowStock = typeof totalStock === 'number' && totalStock > 0 && totalStock <= 3;
  const outOfStock = totalStock === 0;

  /* Hearts live in localStorage: SCHEMA.md has no `favourite` table and
     inventing one here would break the contract the whole team builds
     against. Per-browser, never synced. */
  const [fav, setFav] = useState(() => isFavourite(productId));

  /* ── compact: cart rows, order lines ───────────────────────────── */
  if (variant === 'compact') {
    return (
      <Group
        gap={12}
        wrap="nowrap"
        align="center"
        style={{ padding: 12, border: `1px solid ${LINE}`, borderRadius: RADIUS }}
      >
        <ProductTile src={imageUrl} alt="" size={72} zoom={1} />
        <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
          <Text fz={16} fw={600} c="ink.0" lineClamp={2}>{title}</Text>
          {brand && <Text fz={14} c="ink.2">{brand}</Text>}
        </Stack>
        {shown != null && <Money value={shown} fz={16} fw={700} />}
      </Group>
    );
  }

  /* ── grid: the default ─────────────────────────────────────────── */
  return (
    <Box
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 12,
        borderRadius: RADIUS,
        background: 'var(--mantine-color-ink-7)',
        border: `1px solid ${hover ? LINE_HOVER : LINE}`,
        transform: hover ? 'translateY(-6px)' : 'none',
        boxShadow: hover ? 'var(--glow-lift)' : 'none',
        transition: `transform 200ms ${EASE}, border-color 200ms ${EASE},`
          + ` box-shadow 200ms ${EASE}`,
      }}
    >
      <Box style={{ position: 'relative' }}>
        <Link to={href} aria-label={title} style={{ display: 'block' }}>
          <ProductTile src={imageUrl} alt={title} ratio="1 / 1" pad={24} zoom={1.06} />
        </Link>

        <Stack gap={4} style={{ position: 'absolute', top: 10, left: 10 }}>
          {discountPercent ? <Flag>-{discountPercent}%</Flag> : null}
          {outOfStock && <Flag tone="muted">Out of stock</Flag>}
        </Stack>

        <UnstyledButton
          className={`bb-heart${fav ? ' bb-heart--on' : ''}`}
          aria-pressed={fav}
          aria-label={fav ? `Remove ${title} from favourites` : `Save ${title}`}
          onClick={(e) => {
            /* the whole tile is a link to the product; hearting is not
               navigating, so the click stops here */
            e.preventDefault();
            e.stopPropagation();
            toggleFavourite(productId);
            setFav((v) => !v);
          }}
        >
          {fav ? <IconHeartFilled size={16} /> : <IconHeart size={16} stroke={1.9} />}
        </UnstyledButton>
      </Box>

      <Stack gap={4} pt={12} px={4} style={{ flex: 1 }}>
        <Text
          component={Link}
          to={href}
          fz={16}
          fw={600}
          c="ink.0"
          lineClamp={2}
          style={{
            textDecoration: 'none',
            lineHeight: 1.4,
            /* reserve two lines whether or not the title needs them */
            minHeight: '2.8em',
          }}
        >
          {title}
        </Text>

        {/* brand is muted supporting text, not a tiny coloured caps slot */}
        {(brand || categoryName) && (
          <Text fz={14} c="ink.2">
            {[brand, categoryName].filter(Boolean).join(' · ')}
          </Text>
        )}

        {rating != null && (
          <Group gap={4} wrap="nowrap">
            {[0, 1, 2, 3, 4].map((i) => (
              <IconStarFilled
                key={i}
                size={13}
                style={{
                  color: i < Math.round(rating)
                    ? 'var(--mantine-color-brand-5)'
                    : 'var(--mantine-color-ink-4)',
                }}
              />
            ))}
            {reviewCount != null && <Text fz={14} c="ink.3" ml={0}>({reviewCount})</Text>}
          </Group>
        )}

        {/* stock text only when it is actually urgent */}
        {lowStock && <Text fz={14} c="brand.5">Only {totalStock} left</Text>}

        {/* Pinned to the card's bottom edge, so a row of cards lines up
            no matter how long each title ran. */}
        <Group gap={10} align="center" wrap="nowrap" pt={12} style={{ marginTop: 'auto' }}>
          {rrp && (
            <Text fz={14} c="ink.3" td="line-through" style={{ flexShrink: 0 }}>
              {Money.format(rrp)}
            </Text>
          )}

          {/* The price IS the button. A price line with a full-width
              button under it says the same thing twice and costs the card
              40px of height to do it. */}
          <UnstyledButton
            className="bb-price-pill"
            data-disabled={outOfStock || undefined}
            disabled={outOfStock}
            onClick={() => onAddToCart?.(product)}
            aria-label={outOfStock ? `${title} is out of stock` : `Add ${title} to cart`}
          >
            <IconShoppingCart size={15} stroke={1.9} />
            {outOfStock ? 'Out of stock' : (shown != null ? Money.format(shown) : 'View')}
          </UnstyledButton>
        </Group>
      </Stack>
    </Box>
  );
}

/** Matches the grid variant's dimensions so the grid never jumps. */
export function ProductCardSkeleton() {
  const bar = (w, h = 14, mt = 0) => (
    <Box style={{ height: h, width: w, background: 'var(--mantine-color-ink-6)', borderRadius: 4, marginTop: mt }} />
  );
  return (
    <Box style={{ padding: 12, border: `1px solid ${LINE}`, borderRadius: RADIUS, background: 'var(--mantine-color-ink-7)' }}>
      <Box style={{ aspectRatio: '1 / 1', background: 'var(--mantine-color-ink-6)', borderRadius: RADIUS }} />
      <Stack gap={8} pt={12} px={4}>
        {bar('85%', 16)}
        {bar('50%')}
        {bar('40%', 18, 6)}
        {bar('100%', 36, 10)}
      </Stack>
    </Box>
  );
}
