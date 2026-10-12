/**
 * ProductsPage — Product catalogue listing with filters and pagination
 * OWNER: Slice B (Risandu)
 *
 * Implements:
 *   - REQ-1.1: Browse products
 *   - REQ-1.3: Filter by category, brand, price range
 *   - REQ-1.4: Price range display across variants
 *   - Pagination and "no results" empty state
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Grid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  TextInput,
  Select,
  NumberInput,
  Button,
  Pagination,
  SimpleGrid,
  Skeleton,
  Paper,
  Title,
  Divider,
  ActionIcon,
  Box,
  RangeSlider,
  Collapse,
} from '@mantine/core';
import {
  IconSearch,
  IconFilter,
  IconX,
  IconChevronRight,
  IconRotateClockwise,
  IconShoppingBag,
} from '@tabler/icons-react';
import { api } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Money, EmptyState, ErrorAlert } from '../../components/ui';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State from URL
  const queryParam = searchParams.get('q') || '';
  const categoryIdParam = searchParams.get('categoryId') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local form state
  const [searchInput, setSearchInput] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryIdParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [minPrice, setMinPrice] = useState(minPriceParam ? Number(minPriceParam) : '');
  const [maxPrice, setMaxPrice] = useState(maxPriceParam ? Number(maxPriceParam) : '');

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(queryParam);
    setSelectedCategory(categoryIdParam);
    setSelectedBrand(brandParam);
    setMinPrice(minPriceParam ? Number(minPriceParam) : '');
    setMaxPrice(maxPriceParam ? Number(maxPriceParam) : '');
  }, [queryParam, categoryIdParam, brandParam, minPriceParam, maxPriceParam]);

  // Load category tree once
  useEffect(() => {
    api.get('/categories')
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queryParam) params.set('q', queryParam);
      if (categoryIdParam) params.set('categoryId', categoryIdParam);
      if (brandParam) params.set('brand', brandParam);
      if (minPriceParam) params.set('minPrice', minPriceParam);
      if (maxPriceParam) params.set('maxPrice', maxPriceParam);
      params.set('page', pageParam.toString());
      params.set('pageSize', '12');

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setTotal(res.total || 0);
      setPageSize(res.pageSize || 12);
    } catch (err) {
      setError(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [queryParam, categoryIdParam, brandParam, minPriceParam, maxPriceParam, pageParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Apply filters to URL
  const applyFilters = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('q', searchInput.trim());
    if (selectedCategory) next.set('categoryId', selectedCategory);
    if (selectedBrand) next.set('brand', selectedBrand);
    if (minPrice !== '' && minPrice !== undefined) next.set('minPrice', minPrice.toString());
    if (maxPrice !== '' && maxPrice !== undefined) next.set('maxPrice', maxPrice.toString());
    next.set('page', '1'); // Reset to page 1 on filter
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flatten categories for Select dropdown
  const flattenCategories = (nodes, prefix = '') => {
    let result = [];
    for (const node of nodes) {
      result.push({
        value: String(node.categoryId),
        label: prefix ? `${prefix} > ${node.categoryName}` : node.categoryName,
      });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenCategories(node.children, prefix ? `${prefix} > ${node.categoryName}` : node.categoryName));
      }
    }
    return result;
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...flattenCategories(categories),
  ];

  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasActiveFilters = Boolean(queryParam || categoryIdParam || brandParam || minPriceParam || maxPriceParam);

  return (
    <Box className="bb-page-enter">
      <PageHeader
        title="Products"
        subtitle={loading ? 'Loading catalogue...' : `Showing ${products.length} of ${total} products`}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Products' }]}
      />

      <Grid gutter={24}>
        {/* ── Filter Sidebar ────────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p={20} radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-body)' }}>
            <Group justify="space-between" mb={16}>
              <Group gap={8}>
                <IconFilter size={18} />
                <Text fw={700} size="sm">Filters</Text>
              </Group>
              {hasActiveFilters && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={handleResetFilters}
                  leftSection={<IconRotateClockwise size={14} />}
                >
                  Reset
                </Button>
              )}
            </Group>

            <Divider mb={16} />

            <form onSubmit={handleSearchSubmit}>
              <Stack gap={16}>
                {/* Search */}
                <TextInput
                  label="Search"
                  placeholder="e.g. Laptop, Nike, Keyboard"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftSection={<IconSearch size={16} />}
                />

                {/* Category */}
                <Select
                  label="Category"
                  placeholder="Select category"
                  data={categoryOptions}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val || '')}
                  clearable
                />

                {/* Brand */}
                <TextInput
                  label="Brand"
                  placeholder="e.g. Apple, Dell, Sony"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                />

                {/* Price Range */}
                <Box>
                  <Text size="xs" fw={500} mb={6}>Price Range ($)</Text>
                  <Group grow gap={8}>
                    <NumberInput
                      placeholder="Min"
                      min={0}
                      value={minPrice}
                      onChange={(val) => setMinPrice(val)}
                      hideControls
                    />
                    <NumberInput
                      placeholder="Max"
                      min={0}
                      value={maxPrice}
                      onChange={(val) => setMaxPrice(val)}
                      hideControls
                    />
                  </Group>
                </Box>

                <Button type="submit" fullWidth mt={8}>
                  Apply Filters
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        {/* ── Product Grid ───────────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          {error && <ErrorAlert error={error} onRetry={fetchProducts} />}

          {loading ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={16}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} padding="lg" radius="md" withBorder>
                  <Skeleton height={180} radius="md" mb={16} />
                  <Skeleton height={16} width="40%" mb={8} />
                  <Skeleton height={20} mb={8} />
                  <Skeleton height={24} width="60%" mt={16} />
                </Card>
              ))}
            </SimpleGrid>
          ) : products.length === 0 ? (
            <EmptyState
              icon={IconShoppingBag}
              title="No products found"
              message={
                hasActiveFilters
                  ? "We couldn't find any products matching your current filters. Try relaxing or clearing your search criteria."
                  : "No products available in the catalogue right now."
              }
              actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
              onAction={hasActiveFilters ? handleResetFilters : undefined}
            />
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={16}>
                {products.map((product) => {
                  const isRange = product.priceFrom && product.priceTo && product.priceFrom !== product.priceTo;
                  return (
                    <Card
                      key={product.productId}
                      component={Link}
                      to={`/products/${product.productId}`}
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'transform 150ms ease, box-shadow 150ms ease',
                      }}
                      className="bb-product-card"
                    >
                      <Card.Section p={16} style={{ backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                        <Image
                          src={product.imageUrl || `https://placehold.co/400x300?text=${encodeURIComponent(product.productName)}`}
                          height={180}
                          alt={product.productName}
                          fit="contain"
                          fallbackSrc="https://placehold.co/400x300?text=No+Image"
                        />
                      </Card.Section>

                      <Stack gap={8} mt={14} style={{ flexGrow: 1 }}>
                        <Group justify="space-between" align="center">
                          {product.brand ? (
                            <Badge variant="light" color="gray" size="sm">
                              {product.brand}
                            </Badge>
                          ) : <div />}
                          {product.categories?.[0] && (
                            <Text size="xs" c="dimmed">
                              {product.categories[0].categoryName}
                            </Text>
                          )}
                        </Group>

                        <Text fw={600} size="md" lineClamp={2} style={{ lineHeight: 1.3 }}>
                          {product.productName}
                        </Text>

                        <Group justify="space-between" align="flex-end" mt="auto" pt={12}>
                          <div>
                            <Text size="xs" c="dimmed">From</Text>
                            <Group gap={4} align="baseline">
                              <Money value={product.priceFrom} size="lg" fw={700} c="brightBlue" />
                              {isRange && (
                                <Text size="xs" c="dimmed">
                                  – <Money value={product.priceTo} size="sm" fw={600} />
                                </Text>
                              )}
                            </Group>
                          </div>

                          <Button
                            variant="light"
                            size="xs"
                            rightSection={<IconChevronRight size={14} />}
                          >
                            Details
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Group justify="center" mt={36}>
                  <Pagination
                    value={pageParam}
                    onChange={handlePageChange}
                    total={totalPages}
                    size="md"
                    radius="md"
                    withEdges
                  />
                </Group>
              )}
            </>
          )}
        </Grid.Col>
      </Grid>
    </Box>
  );
}
