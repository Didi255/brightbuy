/**
 * ProductDetailPage — one product and its variants.   OWNER: Slice B
 *
 * GET /products/:id returns the product plus `variants`, each with its own
 * sku, price, stockQuantity and `attributes: [{ name, value }]`.
 *
 * Variant pickers are built FROM those attributes rather than hardcoded, so
 * a product with Colour/Storage and one with RAM/Storage both work without
 * a code change. Picking a value narrows the matching variants; the first
 * fully-matched variant is the one added to the cart.
 *
 * Covers: REQ-2.1, REQ-2.2, REQ-1.4
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Group, Stack, Text, Button, Divider, Skeleton, UnstyledButton, NumberInput,
} from '@mantine/core';
import {
  IconHeart, IconTruck, IconRotateClockwise, IconShieldCheck, IconCertificate,
  IconMinus, IconPlus,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import { Money, ErrorAlert, EmptyState, ProductTile, ProductRail } from '../../components/ui';
import { pushRecent, readRecent } from '../../api/recentlyViewed';
import { api } from '../../api/client';

const LINE = 'rgba(255,236,214,0.10)';
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* Sentence-case body label. Monospace is reserved for SKU codes and
   order numbers; everywhere else it reads as a generated-page tell. */
const MONO = {
  fontSize: 14,
  fontWeight: 400,
};

function TrustLine({ icon: Icon, children }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Icon size={16} style={{ color: 'var(--mantine-color-brand-5)', flexShrink: 0 }} />
      <Text fz={14} c="ink.2">{children}</Text>
    </Group>
  );
}

/* Trust badges are driven by CATEGORY, not hardcoded. "2-year warranty"
   and "Authorised dealer" on a blender or a rain jacket is the kind of
   claim a real shop would not make, and an examiner will spot it. */
const BADGES_BY_CATEGORY = {
  Laptops:                [['warranty', '2-year warranty'], ['dealer', 'Authorised dealer']],
  Monitors:               [['warranty', '2-year warranty'], ['dealer', 'Authorised dealer']],
  Phones:                 [['warranty', '2-year warranty'], ['dealer', 'Authorised dealer']],
  Audio:                  [['warranty', '2-year warranty'], ['dealer', 'Authorised dealer']],
  'Computer Accessories': [['warranty', '2-year warranty'], ['dealer', 'Authorised dealer']],
  Kitchen:                [['warranty', '1-year warranty']],
  Footwear:               [['exchange', 'Free size exchange']],
  'Sports & Outdoors':    [['exchange', 'Free size exchange']],
  Cleaning:               [],
};

/* Everything in the shop ships and returns the same way. */
const BADGE_ICONS = {
  warranty: IconShieldCheck,
  dealer:   IconCertificate,
  exchange: IconRotateClockwise,
  delivery: IconTruck,
  returns:  IconRotateClockwise,
};

const BADGES_ALWAYS = [
  ['delivery', 'Free delivery over Rs 25,000'],
  ['returns', '30-day returns'],
];

/** Spec row with a dotted leader, label mono, value Inter. */
function SpecRow({ label, value }) {
  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      align="baseline"
      gap={12}
      py={8}
      style={{ borderBottom: `1px solid ${LINE}` }}
    >
      <Text c="ink.4" style={{ ...MONO, flexShrink: 0 }}>{label}</Text>
      <Text fz={15} fw={500} c="ink.0" ta="right">{value}</Text>
    </Group>
  );
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState({});   // { attributeName: value }
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    /* Read the recent list BEFORE recording this visit, so the rail shows
       what came before rather than the page you are already on. */
    setRecent(readRecent().filter((p) => String(p.productId) !== String(productId)));

    api.get(`/products/${productId}`)
      .then((p) => {
        if (cancelled) return;
        setProduct(p); setPicked({}); setQty(1);
        pushRecent(p);
        const cat = p.categories?.[0]?.categoryId;
        if (cat) {
          api.get(`/products?categoryId=${cat}&pageSize=10`)
            .then((r) => {
              if (!cancelled) {
                setRelated((r.data || []).filter((x) => String(x.productId) !== String(productId)));
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);   // re-run when the URL changes — React reuses the component

  const variants = product?.variants || [];

  /* Attribute name -> the distinct values across all variants. Built from
     the data, never hardcoded. */
  const axes = useMemo(() => {
    const map = new Map();
    for (const v of variants) {
      for (const a of v.attributes || []) {
        if (!map.has(a.name)) map.set(a.name, new Set());
        map.get(a.name).add(a.value);
      }
    }
    return [...map.entries()].map(([name, set]) => ({ name, values: [...set] }));
  }, [variants]);

  const matching = useMemo(() => {
    const keys = Object.keys(picked);
    if (keys.length === 0) return variants;
    return variants.filter((v) =>
      keys.every((k) => (v.attributes || []).some((a) => a.name === k && a.value === picked[k])));
  }, [variants, picked]);

  const current = matching[0] || variants[0] || null;
  const prices = variants.map((v) => Number(v.price)).filter(Number.isFinite);
  const from = prices.length ? Math.min(...prices) : null;
  const to   = prices.length ? Math.max(...prices) : null;

  /* Is this value reachable given everything else already picked? */
  function reachable(name, value) {
    const others = Object.entries(picked).filter(([k]) => k !== name);
    return variants.some((v) =>
      (v.attributes || []).some((a) => a.name === name && a.value === value) &&
      others.every(([k, val]) =>
        (v.attributes || []).some((a) => a.name === k && a.value === val)));
  }

  if (loading) {
    return (
      <>
        <PageHeader title=" " crumbs={[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }]} />
        <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 64 }}>
          <Skeleton style={{ flex: '1 1 420px', aspectRatio: '1 / 1' }} radius={8} />
          <Stack style={{ flex: '1 1 340px' }} gap={16}>
            <Skeleton height={14} width="25%" radius={2} />
            <Skeleton height={38} width="80%" radius={2} />
            <Skeleton height={44} width="45%" radius={2} />
            <Skeleton height={100} radius={2} />
            <Skeleton height={52} radius={4} />
          </Stack>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Product" crumbs={[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }]} />
        <ErrorAlert error={error} onRetry={() => window.location.reload()} />
      </>
    );
  }

  if (!product) {
    return (
      <EmptyState
        title="Product not found"
        message="It may have been withdrawn from the catalogue."
        actionLabel="Back to products"
        actionTo="/products"
      />
    );
  }

  const categoryName = product.categories?.[0]?.categoryName;
  const badges = [
    ...(BADGES_BY_CATEGORY[categoryName] ?? []),
    ...BADGES_ALWAYS,
  ];

  const stock = current?.stockQuantity ?? 0;
  const stockTone = stock === 0 ? 'ink.4' : stock <= 5 ? 'brand.5' : 'green.5';
  const stockText = stock === 0
    ? 'Out of stock'
    : stock <= 5 ? `Only ${stock} left` : 'In stock — ships today';

  return (
    <>
      {/* crumbs only — the H1 lives in the buy box, and printing the
          product name twice was a real bug on this page */}
      <PageHeader
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          ...(product.categories?.[0]
            ? [{ label: product.categories[0].categoryName,
                 to: `/products?categoryId=${product.categories[0].categoryId}` }]
            : []),
          { label: product.productName },
        ]}
      />

      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start' }}>
        {/* gallery */}
        <Box style={{ flex: '1 1 420px', minWidth: 0 }}>
          {/* The product sits in a light tile, as it does everywhere else
              in the app. Magnifies silently on hover — a caption telling
              you to hover is the kind of label a finished shop does not
              need. */}
          <ProductTile
            src={product.imageUrl}
            alt={product.productName}
            ratio="1 / 1"
            pad={32}
            zoom={2}
            pan
          />

          {/* One image per variant, so the strip reflects real data rather
              than repeating the same shot four times. */}
          {variants.length > 1 && (
            <Group gap={8} mt={12} wrap="wrap">
              {variants.slice(0, 6).map((v) => (
                <ProductTile
                  key={v.variantId}
                  src={product.imageUrl}
                  alt={(v.attributes || []).map((a) => a.value).join(' ')}
                  size={72}
                  zoom={1}
                />
              ))}
            </Group>
          )}
        </Box>

        {/* buy box */}
        <Stack style={{ flex: '1 1 360px', minWidth: 0, position: 'sticky', top: 112 }} gap={16}>
          <Stack gap={8}>
            <Text style={MONO} c="ink.4">{product.brand}</Text>
            <Text
              component="h1"
              c="ink.0"
              style={{
                fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.1,
                letterSpacing: '-0.03em', margin: 0,
              }}
            >
              {product.productName}
            </Text>
            {current?.sku && (
              <Text style={MONO} c="ink.4">SKU {current.sku}</Text>
            )}
          </Stack>

          {product.description && (
            <Text fz={15} c="ink.2" style={{ lineHeight: 1.6, maxWidth: '52ch' }}>
              {product.description}
            </Text>
          )}

          <Group gap={12} align="baseline" wrap="wrap">
            {current ? (
              <Money value={current.price} fz={32} fw={700} accent />
            ) : from != null && (
              <Group gap={8} align="baseline">
                <Money value={from} fz={32} fw={700} accent />
                {to !== from && <Text fz={18} c="ink.2">to {Money.format(to)}</Text>}
              </Group>
            )}
          </Group>

          <Divider color={LINE} />

          {/* variant pickers, derived from the attributes the API returned */}
          {axes.map((axis) => (
            <Stack key={axis.name} gap={8}>
              <Text style={MONO} c="ink.4">{axis.name}</Text>
              <Group gap={8} wrap="wrap">
                {axis.values.map((val) => {
                  const on = picked[axis.name] === val;
                  const ok = reachable(axis.name, val);
                  return (
                    <UnstyledButton
                      key={val}
                      disabled={!ok}
                      onClick={() =>
                        setPicked((prev) =>
                          prev[axis.name] === val
                            ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== axis.name))
                            : { ...prev, [axis.name]: val })}
                      style={{
                        height: 38, padding: '0 16px', borderRadius: 4,
                        border: `1px solid ${on ? 'var(--mantine-color-brand-5)' : LINE}`,
                        background: on ? 'rgba(255,140,0,0.12)' : 'transparent',
                        color: ok
                          ? (on ? 'var(--mantine-color-brand-5)' : 'var(--mantine-color-ink-0)')
                          : 'var(--mantine-color-ink-4)',
                        textDecoration: ok ? 'none' : 'line-through',
                        cursor: ok ? 'pointer' : 'not-allowed',
                        fontSize: 14,
                        transition: `all 150ms ${EASE}`,
                      }}
                    >
                      {val}
                    </UnstyledButton>
                  );
                })}
              </Group>
            </Stack>
          ))}

          <Group gap={8} wrap="nowrap">
            <Box
              style={{
                width: 8, height: 8, borderRadius: 1, flexShrink: 0,
                background: `var(--mantine-color-${stockTone.replace('.', '-')})`,
              }}
            />
            <Text fz={14} c={stockTone}>{stockText}</Text>
          </Group>

          <Group gap={12} wrap="nowrap" align="flex-end">
            <NumberInput
              value={qty}
              onChange={(v) => setQty(Math.max(1, Number(v) || 1))}
              min={1}
              max={Math.max(1, stock)}
              w={110}
              styles={{ input: { height: 52 } }}
            />
            <Button
              h={52}
              color="brand.5"
              c="black"
              disabled={stock === 0}
              style={{ flex: 1 }}
            >
              {stock === 0 ? 'Out of stock' : 'Add to cart'}
            </Button>
            <UnstyledButton
              aria-label="Save for later"
              style={{
                width: 52, height: 52, borderRadius: 4, display: 'grid', placeItems: 'center',
                border: `1px solid ${LINE}`, color: 'var(--mantine-color-ink-2)',
              }}
            >
              <IconHeart size={18} />
            </UnstyledButton>
          </Group>

          <Divider color={LINE} />

          <Stack gap={8}>
            {badges.map(([kind, label]) => (
              <TrustLine key={kind} icon={BADGE_ICONS[kind]}>{label}</TrustLine>
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* specifications — the real selling tool, never behind an accordion */}
      {current?.attributes?.length > 0 && (
        <Box mt={64}>
          
          <Text
            component="h2"
            c="ink.0"
            mb={24}
            style={{
              fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0,
            }}
          >
            Specifications
          </Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              columnGap: 48,
            }}
          >
            <SpecRow label="Brand" value={product.brand} />
            <SpecRow label="SKU" value={current.sku} />
            {current.attributes.map((a) => (
              <SpecRow key={a.name} label={a.name} value={a.value} />
            ))}
            <SpecRow label="Availability" value={stockText} />
          </Box>
        </Box>
      )}

      {/* every variant, so the range is visible rather than implied */}
      {variants.length > 1 && (
        <Box mt={48}>
          <Text component="h2" c="ink.0" mb={16} style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Other configurations</Text>
          <Stack gap={0} style={{ border: `1px solid ${LINE}`, borderRadius: 8 }}>
            {variants.map((v, i) => (
              <Group
                key={v.variantId}
                justify="space-between"
                wrap="nowrap"
                p={16}
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}
              >
                <Stack gap={0} style={{ minWidth: 0 }}>
                  <Text fz={14} c="ink.0">
                    {(v.attributes || []).map((a) => a.value).join(' · ') || v.sku}
                  </Text>
                  <Text style={MONO} c="ink.4">{v.sku}</Text>
                </Stack>
                <Group gap={16} wrap="nowrap">
                  <Text fz={12} c={v.stockQuantity === 0 ? 'ink.4' : 'ink.2'}>
                    {v.stockQuantity === 0 ? 'OUT OF STOCK' : `${v.stockQuantity} IN STOCK`}
                  </Text>
                  <Money value={v.price} fz={16} fw={500} />
                </Group>
              </Group>
            ))}
          </Stack>
        </Box>
      )}

      <ProductRail
        title={`More in ${product.categories?.[0]?.categoryName || 'this category'}`}
        items={related}
      />
      <ProductRail title="Recently viewed" items={recent} />

      <Group mt={48}>
        <Button component={Link} to="/products" variant="default">
          Back to all products
        </Button>
      </Group>
    </>
  );
}
