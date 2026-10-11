/**
 * ProductListPage — the catalogue.   OWNER: Slice B
 *
 * Shell: category chips across the top, a 280px rail of separate filter
 * cards, and a 3/2/1 product grid. Below lg the rail becomes a Drawer.
 *
 * Every filter, the sort and the page serialise into the URL, so a
 * filtered view is shareable and the back button behaves.
 *
 * GET /products takes q, categoryId, brand, minPrice, maxPrice, page,
 * pageSize and returns { data, page, pageSize, total }.
 *
 * TWO FETCHES, ON PURPOSE. The grid fetch is filtered and paged. A second
 * unfiltered fetch loads the whole catalogue once, and the facets — price
 * bounds, the histogram, the brand list — are computed from that. Facets
 * built from the current page would shrink every time you filtered, which
 * is how a filter panel ends up lying to you. The catalogue is 43 rows, so
 * the second call is cheap; if it ever is not, this is what moves
 * server-side.
 *
 * WHAT IS DELIBERATELY ABSENT, and why — see docs/API.md:
 *   · no delivery filter     `delivery_mode` is a checkout choice, not a
 *                            product attribute. GET /products has no such
 *                            parameter and there is nothing to filter on.
 *   · no in-stock / on-sale  the list shape carries no stock figure, and
 *                            SCHEMA.md has no discount column at all.
 *   · no "Top item" badge    order counts live behind
 *                            /reports/top-products, which is staff-only.
 *   · no star rating         there is no `review` table.
 * A control that cannot filter is worse than no control.
 *
 * Covers: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Group, Stack, Text, Button, UnstyledButton, Select, RangeSlider,
  Checkbox, Drawer, TextInput,
} from '@mantine/core';
import { IconSearchOff, IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import {
  ProductCard, ProductCardSkeleton, EmptyState, ErrorAlert, ProductRail,
  CategoryChips, PriceHistogram, Money,
} from '../../components/ui';
import { readRecent } from '../../api/recentlyViewed';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';

const PAGE_SIZE = 12;

const SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

/** Flatten the category tree to its leaves — those are what products sit in. */
function leaves(nodes, out = []) {
  for (const n of nodes || []) {
    if (!n.children || n.children.length === 0) out.push(n);
    else leaves(n.children, out);
  }
  return out;
}

/** Round out to a readable slider bound, so handles land on whole numbers. */
function roundTo(n, step, dir) {
  return (dir < 0 ? Math.floor(n / step) : Math.ceil(n / step)) * step;
}

/* ── one filter card ──────────────────────────────────────────────── */
function FilterCard({ title, onReset, children }) {
  return (
    <Box className="bb-filter-card">
      <Group justify="space-between" align="baseline" wrap="nowrap" mb={14}>
        <Text fz={14} fw={600} c="ink.0">{title}</Text>
        {onReset && (
          <UnstyledButton
            onClick={onReset}
            style={{ fontSize: 13, color: 'var(--mantine-color-brand-5)' }}
          >
            Reset
          </UnstyledButton>
        )}
      </Group>
      {children}
    </Box>
  );
}

/* ── a removable active-filter chip ───────────────────────────────── */
function ActiveChip({ children, onRemove }) {
  return (
    <Group
      gap={6}
      wrap="nowrap"
      style={{
        padding: '4px 8px 4px 12px',
        borderRadius: 999,
        background: 'var(--mantine-color-ink-6)',
        border: '1px solid rgba(255,236,214,0.10)',
      }}
    >
      <Text fz={13} c="ink.1">{children}</Text>
      <UnstyledButton
        onClick={onRemove}
        aria-label="Remove filter"
        style={{ display: 'grid', placeItems: 'center', color: 'var(--mantine-color-ink-3)' }}
      >
        <IconX size={13} />
      </UnstyledButton>
    </Group>
  );
}

/* ── the rail ─────────────────────────────────────────────────────── */
function FilterRail({
  prices, bounds, price, onPrice, onPriceCommit, onPriceReset,
  brands, activeBrands, onBrand, onBrandReset,
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const shown = showAllBrands ? brands : brands.slice(0, 7);

  const average = prices.length
    ? prices.reduce((a, b) => a + b, 0) / prices.length
    : null;

  return (
    <Stack gap={16}>
      <FilterCard title="Price range" onReset={onPriceReset}>
        {average != null && (
          <Text fz={13} c="ink.3" mb={14}>
            Average price is {Money.format(average)}
          </Text>
        )}

        <Group justify="space-between" mb={6}>
          <Text component="span" className="bb-price-chip">{Money.format(price[0])}</Text>
          <Text component="span" className="bb-price-chip">{Money.format(price[1])}</Text>
        </Group>

        {/* The histogram sits behind the slider, so the handles are read
            against the distribution they are cutting into. */}
        <Box style={{ position: 'relative' }}>
          <PriceHistogram values={prices} bounds={bounds} range={price} />
          <RangeSlider
            mt={-10}
            min={bounds[0]}
            max={bounds[1]}
            step={500}
            value={price}
            onChange={onPrice}
            onChangeEnd={onPriceCommit}
            label={null}
            color="brand.5"
            size="xs"
          />
        </Box>
      </FilterCard>

      <FilterCard title="Brand" onReset={activeBrands.length ? onBrandReset : undefined}>
        <Stack gap={10}>
          {brands.length === 0 && <Text fz={13} c="ink.3">No brands loaded.</Text>}
          {shown.map((b) => (
            <Group key={b} gap={10} wrap="nowrap">
              {/* No logo assets exist, so the initial goes on a disc. An
                  empty 24px square beside every row reads as a broken
                  image, which is worse than no mark at all. */}
              <Box className="bb-brand-mark" aria-hidden="true">
                {b.charAt(0).toUpperCase()}
              </Box>
              <Text fz={14} c="ink.1" style={{ flex: 1, minWidth: 0 }} truncate>{b}</Text>
              <Checkbox
                size="xs"
                color="brand.5"
                checked={activeBrands.includes(b)}
                onChange={() => onBrand(b)}
                aria-label={b}
              />
            </Group>
          ))}
          {brands.length > 7 && (
            <UnstyledButton
              onClick={() => setShowAllBrands((v) => !v)}
              style={{ fontSize: 13, color: 'var(--mantine-color-brand-5)' }}
            >
              {showAllBrands ? 'Fewer brands' : `More brands (${brands.length - 7})`}
            </UnstyledButton>
          )}
        </Stack>
      </FilterCard>
    </Stack>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */
export default function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [categories, setCategories] = useState([]);
  const [catalogue, setCatalogue] = useState([]);   // unfiltered, for facets
  /* A failed facet fetch used to be swallowed, which showed as an empty
     brand list and a dead price slider with no hint why. */
  const [facetError, setFacetError] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [railOpen, setRailOpen] = useState(false);
  const [recent] = useState(() => readRecent());

  const categoryId = params.get('categoryId');
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'relevance';
  const page = Number(params.get('page') || 1);
  const brandParam = params.get('brand');
  const activeBrands = brandParam ? brandParam.split(',') : [];
  const minParam = params.get('minPrice');
  const maxParam = params.get('maxPrice');

  /* ── facets, from the whole catalogue ───────────────────────────── */
  useEffect(() => {
    api.get('/categories').then((tree) => setCategories(leaves(tree))).catch(() => {});
    /* 100, not more: MAX_PAGE_SIZE in catalogue.service.js is 100 and
       anything above it is a 400. The catalogue is 43 rows, so one page
       covers it. If it ever outgrows 100 this needs real paging, or the
       facets move server-side. */
    api.get('/products?pageSize=100')
      .then((res) => setCatalogue(res.data || []))
      .catch((err) => setFacetError(err));
  }, []);

  const prices = useMemo(
    () => catalogue.map((p) => Number(p.priceFrom)).filter(Number.isFinite),
    [catalogue],
  );

  /* Bounds come from the data. They used to be a hardcoded [0, 4000] —
     a US-dollar figure. After the move to rupees that capped the slider
     below almost the entire catalogue. */
  const bounds = useMemo(() => {
    if (!prices.length) return [0, 500000];
    return [roundTo(Math.min(...prices), 500, -1), roundTo(Math.max(...prices), 500, 1)];
  }, [prices]);

  const brands = useMemo(
    () => [...new Set(catalogue.map((r) => r.brand).filter(Boolean))].sort(),
    [catalogue],
  );

  const [price, setPrice] = useState(bounds);

  /* Follow the bounds once the catalogue lands — unless the URL already
     pinned a range, in which case a shared link wins over the default. */
  useEffect(() => {
    setPrice([
      minParam ? Number(minParam) : bounds[0],
      maxParam ? Number(maxParam) : bounds[1],
    ]);
  }, [bounds[0], bounds[1], minParam, maxParam]);

  function patch(next) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') p.delete(k);
      else p.set(k, String(v));
    });
    /* Any filter change resets paging — page 3 of the old result set is
       meaningless against a new one. */
    if (!('page' in next)) p.delete('page');
    setParams(p);
  }

  /* ── the grid fetch ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
        if (q) qs.set('q', q);
        if (categoryId) qs.set('categoryId', categoryId);
        if (minParam) qs.set('minPrice', minParam);
        if (maxParam) qs.set('maxPrice', maxParam);
        /* The API takes a single brand. More than one is narrowed below
           over the rows we have — stated, not hidden. */
        if (activeBrands.length === 1) qs.set('brand', activeBrands[0]);

        const res = await api.get(`/products?${qs.toString()}`);
        if (cancelled) return;
        setRows(res.data || []);
        setTotal(res.total || 0);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.toString()]);

  /* The API has no sort parameter yet, so ordering happens client-side
     over the current page. Move it server-side when Slice B adds `sort`. */
  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === 'price_asc') copy.sort((a, b) => Number(a.priceFrom) - Number(b.priceFrom));
    if (sort === 'price_desc') copy.sort((a, b) => Number(b.priceFrom) - Number(a.priceFrom));
    if (sort === 'name_asc') copy.sort((a, b) => a.productName.localeCompare(b.productName));
    return copy;
  }, [rows, sort]);

  const visible = useMemo(() => {
    if (activeBrands.length <= 1) return sorted;
    return sorted.filter((r) => activeBrands.includes(r.brand));
  }, [sorted, activeBrands]);

  /* GET /products carries no variantId, and the cart is keyed by variant.
     So: exactly one variant in stock means the pill can add it outright;
     anything else is a choice the customer has to make, and that lives on
     the product page. Guessing a variant for them would be worse. */
  async function addFromCard(product) {
    let full;
    try {
      full = await api.get(`/products/${product.productId}`);
    } catch {
      /* cannot even read the product — its own page will say why */
      navigate(`/products/${product.productId}`);
      return;
    }

    const live = (full.variants || []).filter(
      (v) => v.isActive !== false && Number(v.stockQuantity) > 0,
    );

    /* Not one variant means there is a genuine choice to make (or
       nothing to add), and that belongs on the product page. */
    if (live.length !== 1) {
      navigate(`/products/${product.productId}`);
      return;
    }

    try {
      await addItem(live[0].variantId, 1);
      /* the navbar cart badge bumps on its own from CartContext */
    } catch (err) {
      /* Previously this was swallowed and we navigated anyway, so a
         failed add was indistinguishable from a deliberate redirect.
         Now it surfaces where the user is looking. */
      setError(err);
    }
  }

  const priceDirty = Boolean(minParam || maxParam);
  const dirty = Boolean(categoryId || q || activeBrands.length || priceDirty);
  const activeCategoryName =
    categories.find((c) => String(c.categoryId) === String(categoryId))?.categoryName;

  function clearAll() {
    setPrice(bounds);
    setParams(new URLSearchParams());
  }

  const rail = (
    <FilterRail
      prices={prices}
      bounds={bounds}
      price={price}
      onPrice={setPrice}
      onPriceCommit={([lo, hi]) => patch({ minPrice: lo, maxPrice: hi })}
      onPriceReset={() => { setPrice(bounds); patch({ minPrice: null, maxPrice: null }); }}
      brands={brands}
      activeBrands={activeBrands}
      onBrand={(b) => {
        const next = activeBrands.includes(b)
          ? activeBrands.filter((x) => x !== b)
          : [...activeBrands, b];
        patch({ brand: next.join(',') || null });
      }}
      onBrandReset={() => patch({ brand: null })}
    />
  );

  return (
    <>
      <PageHeader
        title={activeCategoryName || 'All products'}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          ...(activeCategoryName ? [{ label: activeCategoryName }] : []),
        ]}
        subtitle="Checked before it leaves us. Five days to any main city, seven island-wide."
      />

      {/* Categories are chips across the top, not a list down the side.
          That swap is what frees the rail for filters that actually
          filter. */}
      <Box mb={28}>
        <CategoryChips
          categories={categories}
          active={categoryId}
          onSelect={(id) => patch({ categoryId: id })}
        />
      </Box>

      <Box style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Box visibleFrom="lg" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 96 }}>
          {rail}
        </Box>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" wrap="wrap" gap={16} mb={16}>
            <Group gap={12}>
              <Button
                hiddenFrom="lg"
                variant="default"
                size="xs"
                leftSection={<IconFilter size={14} />}
                onClick={() => setRailOpen(true)}
              >
                Filters
              </Button>
              <Text
                fz={12}
                c="ink.2"
                style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
              >
                {loading ? 'Loading' : `${total} ${total === 1 ? 'product' : 'products'}`}
              </Text>
            </Group>

            <Group gap={8} wrap="nowrap">
              <TextInput
                size="xs"
                placeholder="Search products"
                defaultValue={q}
                leftSection={<IconSearch size={14} />}
                onKeyDown={(e) => { if (e.key === 'Enter') patch({ q: e.currentTarget.value }); }}
                w={200}
              />
              <Select
                size="xs"
                data={SORTS}
                value={sort}
                onChange={(v) => patch({ sort: v })}
                allowDeselect={false}
                w={170}
              />
            </Group>
          </Group>

          {dirty && (
            <Group gap={8} mb={16} wrap="wrap">
              {activeCategoryName && (
                <ActiveChip onRemove={() => patch({ categoryId: null })}>
                  {activeCategoryName}
                </ActiveChip>
              )}
              {q && <ActiveChip onRemove={() => patch({ q: null })}>&ldquo;{q}&rdquo;</ActiveChip>}
              {activeBrands.map((b) => (
                <ActiveChip
                  key={b}
                  onRemove={() => patch({
                    brand: activeBrands.filter((x) => x !== b).join(',') || null,
                  })}
                >
                  {b}
                </ActiveChip>
              ))}
              {priceDirty && (
                <ActiveChip
                  onRemove={() => { setPrice(bounds); patch({ minPrice: null, maxPrice: null }); }}
                >
                  {Money.format(price[0])} – {Money.format(price[1])}
                </ActiveChip>
              )}
            </Group>
          )}

          {facetError && (
            <Box mb={16}>
              <ErrorAlert
                error={facetError}
                onRetry={() => {
                  setFacetError(null);
                  api.get('/products?pageSize=100')
                    .then((res) => setCatalogue(res.data || []))
                    .catch((e) => setFacetError(e));
                }}
              />
            </Box>
          )}

          {error ? (
            <ErrorAlert error={error} onRetry={() => setParams(new URLSearchParams(params))} />
          ) : loading ? (
            <Box className="bb-catalogue-grid">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </Box>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={IconSearchOff}
              title="No products match those filters"
              message="Try widening the price range or clearing a filter."
              actionLabel="Clear all filters"
              onAction={clearAll}
            />
          ) : (
            <>
              <Box className="bb-catalogue-grid">
                {visible.map((p) => (
                  <ProductCard
                    key={p.productId}
                    product={{
                      ...p,
                      price: p.priceFrom,
                      categoryName: p.categories?.[0]?.categoryName,
                    }}
                    onAddToCart={addFromCard}
                  />
                ))}
              </Box>

              {rows.length < total && (
                <Stack align="center" gap={12} mt={32}>
                  <Text
                    fz={12}
                    c="ink.3"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
                  >
                    {Math.min(page * PAGE_SIZE, total)} of {total}
                  </Text>
                  <Button variant="default" onClick={() => patch({ page: page + 1 })}>
                    Load more
                  </Button>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Below the grid: rails rather than a long empty scroll to the
          footer. Both render nothing when they have nothing. */}
      {!loading && !error && (
        <>
          <ProductRail
            title={activeCategoryName ? `More in ${activeCategoryName}` : 'Popular right now'}
            items={rows.filter((p) => !visible.slice(0, 6).includes(p)).slice(0, 10)}
          />
          <ProductRail title="Recently viewed" items={recent} />
        </>
      )}

      <Drawer
        opened={railOpen}
        onClose={() => setRailOpen(false)}
        title="Filters"
        size={320}
        hiddenFrom="lg"
      >
        {rail}
      </Drawer>
    </>
  );
}
