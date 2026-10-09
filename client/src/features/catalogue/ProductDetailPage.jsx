/**
 * ProductDetailPage — Product view with variant selector and add-to-cart
 * OWNER: Slice B (Risandu)
 *
 * Implements:
 *   - REQ-2.1: Product detail view
 *   - REQ-2.2: Variant selector that live-updates price, SKU, stock quantity
 *   - REQ-2.6: Quantity input strictly rejecting 0, negative, non-numeric
 *   - Cart integration via useCart().addItem()
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Grid,
  Card,
  Image,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Button,
  NumberInput,
  Paper,
  Divider,
  Skeleton,
  Radio,
  Alert,
  Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconShoppingCart,
  IconAlertCircle,
  IconArrowLeft,
  IconPackage,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { PageHeader } from '../../components/layout';
import { Money, ErrorAlert } from '../../components/ui';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/products/${productId}`)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length > 0) {
          // Default to the first in-stock variant, or the first variant
          const firstInStock = data.variants.find((v) => v.inStock);
          setSelectedVariantId(firstInStock ? firstInStock.variantId : data.variants[0].variantId);
        }
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  const selectedVariant = product?.variants?.find((v) => v.variantId === selectedVariantId) || null;

  // Strict quantity change validator (rejects 0, negative, decimals, non-numbers)
  const handleQuantityChange = (val) => {
    if (val === '' || val === undefined || val === null) {
      setQuantity(1);
      return;
    }
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantity(1);
    } else {
      setQuantity(parsed);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      setAddingToCart(true);
      await addItem(selectedVariant.variantId, quantity);
      notifications.show({
        title: 'Added to cart!',
        message: `${quantity} × ${product.productName} (${selectedVariant.sku}) has been added.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (err) {
      notifications.show({
        title: 'Failed to add item',
        message: err.message || 'Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Box className="bb-page-enter">
        <Skeleton height={30} width={250} mb={24} />
        <Grid gutter={36}>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Skeleton height={380} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap={16}>
              <Skeleton height={20} width={100} />
              <Skeleton height={36} width="80%" />
              <Skeleton height={28} width={120} />
              <Skeleton height={80} />
              <Skeleton height={120} />
              <Skeleton height={44} width={200} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box className="bb-page-enter">
        <ErrorAlert
          error={error || new Error('Product not found')}
          onRetry={() => window.location.reload()}
        />
        <Button
          component={Link}
          to="/products"
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          mt={16}
        >
          Back to Catalogue
        </Button>
      </Box>
    );
  }

  return (
    <Box className="bb-page-enter">
      <PageHeader
        title={product.productName}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: product.productName },
        ]}
      />

      <Grid gutter={36}>
        {/* ── Product Image ────────────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p={24} radius="md" withBorder style={{ backgroundColor: '#fdfdfd' }}>
            <Image
              src={product.imageUrl || `https://placehold.co/600x500?text=${encodeURIComponent(product.productName)}`}
              alt={product.productName}
              radius="md"
              height={380}
              fit="contain"
              fallbackSrc="https://placehold.co/600x500?text=No+Image"
            />
          </Paper>

          {/* Value props */}
          <Group justify="space-around" mt={24} p={16} style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 8 }}>
            <Group gap={8}>
              <IconTruckDelivery size={20} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">Standard or Store Pickup</Text>
            </Group>
            <Group gap={8}>
              <IconPackage size={20} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">Safe & Tracked Delivery</Text>
            </Group>
          </Group>
        </Grid.Col>

        {/* ── Details & Variant Selector ───────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap={16}>
            <Group justify="space-between" align="center">
              <Group gap={8}>
                {product.brand && (
                  <Badge variant="filled" color="gray" size="md">
                    {product.brand}
                  </Badge>
                )}
                {product.categories?.map((cat) => (
                  <Badge key={cat.categoryId} variant="outline" color="blue" size="md">
                    {cat.categoryName}
                  </Badge>
                ))}
              </Group>

              {selectedVariant && (
                <Text size="xs" c="dimmed" ff="monospace">
                  SKU: {selectedVariant.sku}
                </Text>
              )}
            </Group>

            <Title order={2} size="h1" fw={800} style={{ letterSpacing: -0.5 }}>
              {product.productName}
            </Title>

            {/* Price display (live update based on variant) */}
            <Group align="baseline" gap={12}>
              {selectedVariant ? (
                <Money value={selectedVariant.price} size="2rem" fw={800} c="brightBlue" />
              ) : (
                <Text size="xl" fw={700}>Select variant</Text>
              )}

              {/* Stock status indicator */}
              {selectedVariant && (
                <Badge
                  color={selectedVariant.inStock ? 'green' : 'orange'}
                  variant="light"
                  size="lg"
                >
                  {selectedVariant.inStock
                    ? `In Stock (${selectedVariant.stockQuantity} available)`
                    : 'Back-order (0 in stock, delivery +3 days)'}
                </Badge>
              )}
            </Group>

            {product.description && (
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {product.description}
              </Text>
            )}

            <Divider my={8} />

            {/* ── Variant Selector ─────────────────────────────────── */}
            {product.variants?.length > 0 && (
              <Box>
                <Text size="sm" fw={700} mb={10}>
                  Choose Variant / Specification:
                </Text>

                <Radio.Group
                  value={String(selectedVariantId)}
                  onChange={(val) => setSelectedVariantId(Number(val))}
                >
                  <Stack gap={10}>
                    {product.variants.map((variant) => {
                      const attrSummary = variant.attributes?.length > 0
                        ? variant.attributes.map((a) => `${a.name}: ${a.value}`).join(' · ')
                        : variant.sku;

                      return (
                        <Paper
                          key={variant.variantId}
                          p={12}
                          withBorder
                          radius="md"
                          onClick={() => setSelectedVariantId(variant.variantId)}
                          style={{
                            cursor: 'pointer',
                            borderColor:
                              selectedVariantId === variant.variantId
                                ? 'var(--mantine-color-brightBlue-6)'
                                : undefined,
                            backgroundColor:
                              selectedVariantId === variant.variantId
                                ? 'var(--mantine-color-brightBlue-0)'
                                : undefined,
                          }}
                        >
                          <Group justify="space-between">
                            <Radio
                              value={String(variant.variantId)}
                              label={
                                <Box>
                                  <Text size="sm" fw={600}>
                                    {attrSummary}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    SKU: {variant.sku}
                                  </Text>
                                </Box>
                              }
                            />
                            <Group gap={12}>
                              <Money value={variant.price} fw={700} size="sm" />
                              <Badge
                                size="xs"
                                variant="subtle"
                                color={variant.inStock ? 'green' : 'orange'}
                              >
                                {variant.inStock ? `${variant.stockQuantity} in stock` : 'Back-order'}
                              </Badge>
                            </Group>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Radio.Group>
              </Box>
            )}

            <Divider my={8} />

            {/* ── Quantity & Add to Cart ───────────────────────────── */}
            <Group align="flex-end" gap={16}>
              <Box style={{ width: 130 }}>
                <NumberInput
                  label="Quantity"
                  description="Min 1"
                  min={1}
                  max={99}
                  step={1}
                  allowDecimal={false}
                  allowNegative={false}
                  value={quantity}
                  onChange={handleQuantityChange}
                />
              </Box>

              <Button
                size="md"
                style={{ flex: 1 }}
                leftSection={<IconShoppingCart size={18} />}
                disabled={!selectedVariant}
                loading={addingToCart}
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>
            </Group>

            {selectedVariant && !selectedVariant.inStock && (
              <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light" mt={8}>
                This item is currently out of stock. You can still order it, and delivery will take an additional 3 days (REQ-6.6, 7.2).
              </Alert>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
