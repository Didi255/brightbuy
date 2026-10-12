/**
 * CatalogueManagementPage — staff catalogue console.   OWNER: Slice B (Risandu)
 *
 * Provides complete management for:
 *   - Products (REQ-10.1): Browse, search, filter, create, edit, deactivate
 *   - Categories (REQ-10.2): View tree/hierarchy, create, edit parent, deactivate
 *   - Variants (REQ-10.3): View variants per product, create with attributes, edit price & status
 *
 * Design: Circuit Noir standard (1200 grid, hairline dividers, DataTable, Money, tokens).
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Group,
  Stack,
  Text,
  Button,
  ActionIcon,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Switch,
  NumberInput,
  Modal,
  Drawer,
  Badge,
  Paper,
  Tabs,
  Tooltip,
  Divider,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconEdit,
  IconEyeOff,
  IconEye,
  IconLayersLinked,
  IconTrash,
  IconAlertTriangle,
  IconFolder,
  IconBox,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/layout';
import {
  DataTable,
  Money,
  ErrorAlert,
  LoadingSpinner,
  EmptyState,
  ProductTile,
} from '../../components/ui';
import { api } from '../../api/client';

const LINE = 'rgba(255,236,214,0.10)';

const MONO = {
  fontFamily: 'JetBrains Mono, monospace',
  fontVariantNumeric: 'tabular-nums',
};

/** Flatten nested categories into a flat array with path breadcrumbs */
function flattenCategoryTree(nodes, parentPath = '', parentName = '— (Top level)') {
  const result = [];
  for (const node of nodes) {
    const path = parentPath ? `${parentPath} → ${node.categoryName}` : node.categoryName;
    result.push({
      categoryId: node.categoryId,
      categoryName: node.categoryName,
      parentCategoryId: node.parentCategoryId,
      parentName,
      path,
      isActive: node.isActive !== false,
      childrenCount: node.children ? node.children.length : 0,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, path, node.categoryName));
    }
  }
  return result;
}

export default function CatalogueManagementPage() {
  const [activeTab, setActiveTab] = useState('products');

  // ─────────────────────────────────────────────────────────────────────────
  // Data state
  // ─────────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');

  // ─────────────────────────────────────────────────────────────────────────
  // Modals & Drawers state
  // ─────────────────────────────────────────────────────────────────────────
  // Product modal
  const [productModalOpened, setProductModalOpened] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = create
  const [productForm, setProductForm] = useState({
    productName: '',
    brand: '',
    description: '',
    imageUrl: '',
    categoryIds: [],
    isActive: true,
  });
  const [productFormErrors, setProductFormErrors] = useState({});
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Category modal
  const [categoryModalOpened, setCategoryModalOpened] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    parentCategoryId: null,
    isActive: true,
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState({});
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Deactivate confirm modal (shared)
  const [deactivateModalOpened, setDeactivateModalOpened] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null); // { type: 'product'|'category', item: object }
  const [submittingDeactivate, setSubmittingDeactivate] = useState(false);

  // Variants drawer
  const [variantDrawerProduct, setVariantDrawerProduct] = useState(null);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantProductDetails, setVariantProductDetails] = useState(null);

  // Variant create / edit modal
  const [variantModalOpened, setVariantModalOpened] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null); // null = create
  const [variantForm, setVariantForm] = useState({
    sku: '',
    price: '',
    stockQuantity: 0,
    isActive: true,
    attributes: [{ name: '', value: '' }],
  });
  const [variantFormErrors, setVariantFormErrors] = useState({});
  const [submittingVariant, setSubmittingVariant] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        api.get('/products?pageSize=100&includeInactive=true'),
        api.get('/categories?includeInactive=true'),
      ]);
      setProducts(prodsRes?.data || []);
      setCategoryTree(Array.isArray(catsRes) ? catsRes : []);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const flatCategories = useMemo(() => {
    return flattenCategoryTree(categoryTree);
  }, [categoryTree]);

  const categorySelectOptions = useMemo(() => {
    return flatCategories.map((c) => ({
      value: String(c.categoryId),
      label: c.path,
    }));
  }, [flatCategories]);

  // ─────────────────────────────────────────────────────────────────────────
  // Products filter
  // ─────────────────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productSearch) {
        const query = productSearch.toLowerCase();
        const matchesName = p.productName?.toLowerCase().includes(query);
        const matchesBrand = p.brand?.toLowerCase().includes(query);
        const matchesId = String(p.productId) === query;
        if (!matchesName && !matchesBrand && !matchesId) return false;
      }
      if (productCategoryFilter !== 'all') {
        const catId = Number(productCategoryFilter);
        const inCategory = p.categories?.some((c) => c.categoryId === catId);
        if (!inCategory) return false;
      }
      if (productStatusFilter === 'active' && p.isActive === false) return false;
      if (productStatusFilter === 'inactive' && p.isActive !== false) return false;
      return true;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);

  // ─────────────────────────────────────────────────────────────────────────
  // Product actions
  // ─────────────────────────────────────────────────────────────────────────
  function openAddProduct() {
    setEditingProduct(null);
    setProductForm({
      productName: '',
      brand: '',
      description: '',
      imageUrl: '',
      categoryIds: [],
      isActive: true,
    });
    setProductFormErrors({});
    setActionError(null);
    setProductModalOpened(true);
  }

  async function openEditProduct(product) {
    try {
      setActionError(null);
      // Fetch fresh product with details
      const full = await api.get(`/products/${product.productId}?includeInactive=true`);
      setEditingProduct(full);
      setProductForm({
        productName: full.productName || '',
        brand: full.brand || '',
        description: full.description || '',
        imageUrl: full.imageUrl || '',
        categoryIds: full.categories ? full.categories.map((c) => String(c.categoryId)) : [],
        isActive: full.isActive !== false,
      });
      setProductFormErrors({});
      setProductModalOpened(true);
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    setSubmittingProduct(true);
    setProductFormErrors({});
    try {
      const payload = {
        productName: productForm.productName.trim(),
        brand: productForm.brand.trim() || null,
        description: productForm.description.trim() || null,
        imageUrl: productForm.imageUrl.trim() || null,
        categoryIds: productForm.categoryIds.map((id) => Number(id)),
      };

      if (editingProduct) {
        payload.isActive = productForm.isActive;
        await api.put(`/admin/products/${editingProduct.productId}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }

      setProductModalOpened(false);
      await loadData();
    } catch (err) {
      if (err.fields) {
        setProductFormErrors(err.fields);
      } else {
        setActionError(err);
      }
    } finally {
      setSubmittingProduct(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Category actions
  // ─────────────────────────────────────────────────────────────────────────
  function openAddCategory() {
    setEditingCategory(null);
    setCategoryForm({
      categoryName: '',
      parentCategoryId: null,
      isActive: true,
    });
    setCategoryFormErrors({});
    setActionError(null);
    setCategoryModalOpened(true);
  }

  function openEditCategory(category) {
    setEditingCategory(category);
    setCategoryForm({
      categoryName: category.categoryName,
      parentCategoryId: category.parentCategoryId ? String(category.parentCategoryId) : null,
      isActive: category.isActive !== false,
    });
    setCategoryFormErrors({});
    setActionError(null);
    setCategoryModalOpened(true);
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    setSubmittingCategory(true);
    setCategoryFormErrors({});
    try {
      const payload = {
        categoryName: categoryForm.categoryName.trim(),
        parentCategoryId: categoryForm.parentCategoryId ? Number(categoryForm.parentCategoryId) : null,
      };

      if (editingCategory) {
        payload.isActive = categoryForm.isActive;
        await api.put(`/admin/categories/${editingCategory.categoryId}`, payload);
      } else {
        await api.post('/admin/categories', payload);
      }

      setCategoryModalOpened(false);
      await loadData();
    } catch (err) {
      if (err.fields) {
        setCategoryFormErrors(err.fields);
      } else {
        setActionError(err);
      }
    } finally {
      setSubmittingCategory(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Deactivation actions
  // ─────────────────────────────────────────────────────────────────────────
  function confirmDeactivate(type, item) {
    setDeactivateTarget({ type, item });
    setActionError(null);
    setDeactivateModalOpened(true);
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    setSubmittingDeactivate(true);
    setActionError(null);
    try {
      if (deactivateTarget.type === 'product') {
        await api.del(`/admin/products/${deactivateTarget.item.productId}`);
      } else if (deactivateTarget.type === 'category') {
        await api.del(`/admin/categories/${deactivateTarget.item.categoryId}`);
      }
      setDeactivateModalOpened(false);
      await loadData();
    } catch (err) {
      setActionError(err);
      setDeactivateModalOpened(false);
    } finally {
      setSubmittingDeactivate(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Variant Drawer & Actions
  // ─────────────────────────────────────────────────────────────────────────
  const openVariantsDrawer = useCallback(async (product) => {
    setVariantDrawerProduct(product);
    setVariantsLoading(true);
    try {
      const full = await api.get(`/products/${product.productId}?includeInactive=true`);
      setVariantProductDetails(full);
    } catch (err) {
      setActionError(err);
    } finally {
      setVariantsLoading(false);
    }
  }, []);

  function openAddVariant() {
    setEditingVariant(null);
    setVariantForm({
      sku: '',
      price: '',
      stockQuantity: 0,
      isActive: true,
      attributes: [{ name: '', value: '' }],
    });
    setVariantFormErrors({});
    setActionError(null);
    setVariantModalOpened(true);
  }

  function openEditVariant(variant) {
    setEditingVariant(variant);
    setVariantForm({
      sku: variant.sku,
      price: String(variant.price),
      stockQuantity: variant.stockQuantity,
      isActive: variant.isActive !== false,
      attributes:
        variant.attributes && variant.attributes.length > 0
          ? variant.attributes.map((a) => ({ name: a.name, value: a.value }))
          : [{ name: '', value: '' }],
    });
    setVariantFormErrors({});
    setActionError(null);
    setVariantModalOpened(true);
  }

  function handleAddAttributeRow() {
    setVariantForm((prev) => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '' }],
    }));
  }

  function handleRemoveAttributeRow(index) {
    setVariantForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  }

  function handleAttributeChange(index, field, val) {
    setVariantForm((prev) => {
      const updated = [...prev.attributes];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, attributes: updated };
    });
  }

  async function handleVariantSubmit(e) {
    e.preventDefault();
    setSubmittingVariant(true);
    setVariantFormErrors({});
    try {
      const validAttributes = variantForm.attributes
        .filter((a) => a.name.trim() && a.value.trim())
        .map((a) => ({ name: a.name.trim(), value: a.value.trim() }));

      if (editingVariant) {
        // PUT /api/admin/variants/:id — note: stockQuantity is NOT updated here
        const payload = {
          sku: variantForm.sku.trim(),
          price: String(variantForm.price),
          isActive: variantForm.isActive,
          attributes: validAttributes,
        };
        await api.put(`/admin/variants/${editingVariant.variantId}`, payload);
      } else {
        // POST /api/admin/variants
        const payload = {
          productId: variantDrawerProduct.productId,
          sku: variantForm.sku.trim(),
          price: String(variantForm.price),
          stockQuantity: Number(variantForm.stockQuantity) || 0,
          attributes: validAttributes,
        };
        await api.post('/admin/variants', payload);
      }

      setVariantModalOpened(false);
      // Refresh variant details and products list
      await openVariantsDrawer(variantDrawerProduct);
      await loadData();
    } catch (err) {
      if (err.fields) {
        setVariantFormErrors(err.fields);
      } else {
        setActionError(err);
      }
    } finally {
      setSubmittingVariant(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DataTable Column Definitions
  // ─────────────────────────────────────────────────────────────────────────
  const productColumns = [
    {
      key: 'productId',
      label: 'ID',
      sortable: true,
      render: (r) => (
        <Text style={MONO} fz={13} c="ink.3">
          #{r.productId}
        </Text>
      ),
    },
    {
      key: 'productName',
      label: 'Product',
      sortable: true,
      render: (r) => (
        <Group gap={12} wrap="nowrap">
          <ProductTile
            src={r.imageUrl}
            alt={r.productName}
            size={42}
            radius={6}
          />
          <Stack gap={2}>
            <Text fz={14} fw={500} c="ink.0" lineClamp={1}>
              {r.productName}
            </Text>
            {r.brand && (
              <Text fz={12} c="ink.2">
                {r.brand}
              </Text>
            )}
          </Stack>
        </Group>
      ),
    },
    {
      key: 'categories',
      label: 'Categories',
      render: (r) => (
        <Group gap={4} wrap="wrap">
          {r.categories && r.categories.length > 0 ? (
            r.categories.map((c) => (
              <Badge
                key={c.categoryId}
                radius="sm"
                variant="outline"
                color="gray"
                size="xs"
              >
                {c.categoryName}
              </Badge>
            ))
          ) : (
            <Text fz={12} c="ink.4">
              None
            </Text>
          )}
        </Group>
      ),
    },
    {
      key: 'priceRange',
      label: 'Price Range',
      sortable: true,
      align: 'right',
      render: (r) => {
        if (!r.priceFrom) {
          return (
            <Text style={MONO} fz={13} c="ink.4">
              No variants
            </Text>
          );
        }
        if (r.priceFrom === r.priceTo) {
          return <Money value={r.priceFrom} fz={13} />;
        }
        return (
          <Group gap={4} justify="flex-end" wrap="nowrap">
            <Money value={r.priceFrom} fz={13} />
            <Text fz={12} c="ink.3">
              –
            </Text>
            <Money value={r.priceTo} fz={13} />
          </Group>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (r) => (
        <Badge
          radius="xl"
          variant="light"
          color={r.isActive !== false ? 'teal' : 'gray'}
          size="sm"
        >
          {r.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Tooltip label="Manage SKU Variants" withArrow>
            <Button
              variant="default"
              size="xs"
              leftSection={<IconLayersLinked size={14} />}
              onClick={() => openVariantsDrawer(r)}
            >
              Variants
            </Button>
          </Tooltip>
          <Tooltip label="Edit Product Details" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => openEditProduct(r)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          {r.isActive !== false && (
            <Tooltip label="Deactivate Product" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => confirmDeactivate('product', r)}
              >
                <IconEyeOff size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ),
    },
  ];

  const categoryColumns = [
    {
      key: 'categoryId',
      label: 'ID',
      sortable: true,
      render: (r) => (
        <Text style={MONO} fz={13} c="ink.3">
          #{r.categoryId}
        </Text>
      ),
    },
    {
      key: 'categoryName',
      label: 'Category',
      sortable: true,
      render: (r) => (
        <Group gap={8} wrap="nowrap">
          <IconFolder size={16} style={{ color: 'var(--mantine-color-amber-5)' }} />
          <Text fz={14} fw={500} c="ink.0">
            {r.path}
          </Text>
        </Group>
      ),
    },
    {
      key: 'parentName',
      label: 'Parent Category',
      sortable: true,
      render: (r) => (
        <Text fz={13} c="ink.2">
          {r.parentName}
        </Text>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (r) => (
        <Badge
          radius="xl"
          variant="light"
          color={r.isActive !== false ? 'teal' : 'gray'}
          size="sm"
        >
          {r.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Tooltip label="Edit Category" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => openEditCategory(r)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          {r.isActive !== false && (
            <Tooltip label="Deactivate Category" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => confirmDeactivate('category', r)}
              >
                <IconEyeOff size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ),
    },
  ];

  const variantColumns = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (r) => (
        <Text style={MONO} fz={13} fw={500} c="ink.0">
          {r.sku}
        </Text>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      align: 'right',
      render: (r) => <Money value={r.price} fz={13} />,
    },
    {
      key: 'stockQuantity',
      label: 'Warehouse Stock',
      sortable: true,
      align: 'right',
      render: (r) => (
        <Text style={MONO} fz={13} c={r.stockQuantity > 0 ? 'ink.1' : 'red.4'}>
          {r.stockQuantity}
        </Text>
      ),
    },
    {
      key: 'attributes',
      label: 'Attributes',
      render: (r) => (
        <Group gap={4} wrap="wrap">
          {r.attributes && r.attributes.length > 0 ? (
            r.attributes.map((a, i) => (
              <Badge
                key={i}
                radius="sm"
                variant="outline"
                color="gray"
                size="xs"
              >
                {a.name}: {a.value}
              </Badge>
            ))
          ) : (
            <Text fz={12} c="ink.4">
              None
            </Text>
          )}
        </Group>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (r) => (
        <Badge
          radius="xl"
          variant="light"
          color={r.isActive !== false ? 'teal' : 'gray'}
          size="sm"
        >
          {r.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Tooltip label="Edit Variant" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => openEditVariant(r)}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Catalogue Management"
        crumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Catalogue' }]}
        subtitle="Manage inventory products, category hierarchy, and SKU variants."
      />

      <Stack gap={24} style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {actionError && (
          <ErrorAlert
            error={actionError}
            title="Catalogue action failed"
            onRetry={() => setActionError(null)}
          />
        )}

        {loadError && (
          <ErrorAlert
            error={loadError}
            title="Failed to load catalogue"
            onRetry={loadData}
          />
        )}

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          styles={{
            root: { width: '100%' },
            list: { borderBottom: `1px solid ${LINE}` },
            tab: {
              fontSize: 14,
              fontWeight: 500,
              padding: '12px 20px',
              '&[data-active]': {
                borderColor: 'var(--mantine-color-amber-5)',
                color: 'var(--mantine-color-amber-5)',
              },
            },
          }}
        >
          <Tabs.List mb={16}>
            <Tabs.Tab
              value="products"
              leftSection={<IconBox size={16} />}
            >
              Products ({products.length})
            </Tabs.Tab>
            <Tabs.Tab
              value="categories"
              leftSection={<IconFolder size={16} />}
            >
              Categories ({flatCategories.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* Products Tab                                                   */}
          {/* ────────────────────────────────────────────────────────────── */}
          <Tabs.Panel value="products">
            <Stack gap={16}>
              {/* Controls bar */}
              <Box
                p={16}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  background: 'var(--mantine-color-ink-7)',
                }}
              >
                <Group justify="space-between" wrap="wrap" gap={12}>
                  <Group gap={12} style={{ flex: '1 1 500px' }} wrap="wrap">
                    <TextInput
                      placeholder="Search by name, brand or ID..."
                      leftSection={<IconSearch size={16} />}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{ flex: '1 1 220px' }}
                    />
                    <Select
                      placeholder="Category"
                      data={[
                        { value: 'all', label: 'All Categories' },
                        ...categorySelectOptions,
                      ]}
                      value={productCategoryFilter}
                      onChange={(v) => setProductCategoryFilter(v || 'all')}
                      allowDeselect={false}
                      style={{ width: 180 }}
                    />
                    <Select
                      placeholder="Status"
                      data={[
                        { value: 'all', label: 'All Status' },
                        { value: 'active', label: 'Active only' },
                        { value: 'inactive', label: 'Inactive only' },
                      ]}
                      value={productStatusFilter}
                      onChange={(v) => setProductStatusFilter(v || 'all')}
                      allowDeselect={false}
                      style={{ width: 140 }}
                    />
                  </Group>

                  <Group gap={8}>
                    <Button
                      variant="default"
                      size="sm"
                      leftSection={<IconRefresh size={16} />}
                      onClick={loadData}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                    <Button
                      color="amber.5"
                      c="black"
                      size="sm"
                      leftSection={<IconPlus size={16} />}
                      onClick={openAddProduct}
                    >
                      Add Product
                    </Button>
                  </Group>
                </Group>
              </Box>

              {/* Products Table */}
              <Box
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--mantine-color-ink-8)',
                }}
              >
                <DataTable
                  columns={productColumns}
                  data={filteredProducts}
                  loading={loading}
                  emptyMessage={
                    products.length === 0
                      ? 'No products found in the catalogue.'
                      : 'No products match the selected filters.'
                  }
                />
              </Box>
            </Stack>
          </Tabs.Panel>

          {/* ────────────────────────────────────────────────────────────── */}
          {/* Categories Tab                                                 */}
          {/* ────────────────────────────────────────────────────────────── */}
          <Tabs.Panel value="categories">
            <Stack gap={16}>
              {/* Controls bar */}
              <Box
                p={16}
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  background: 'var(--mantine-color-ink-7)',
                }}
              >
                <Group justify="space-between" wrap="wrap" gap={12}>
                  <Text fz={14} c="ink.2">
                    Hierarchical category tree for store navigation and reporting (REQ-10.2).
                  </Text>
                  <Group gap={8}>
                    <Button
                      variant="default"
                      size="sm"
                      leftSection={<IconRefresh size={16} />}
                      onClick={loadData}
                      loading={loading}
                    >
                      Refresh
                    </Button>
                    <Button
                      color="amber.5"
                      c="black"
                      size="sm"
                      leftSection={<IconPlus size={16} />}
                      onClick={openAddCategory}
                    >
                      Add Category
                    </Button>
                  </Group>
                </Group>
              </Box>

              {/* Categories Table */}
              <Box
                style={{
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--mantine-color-ink-8)',
                }}
              >
                <DataTable
                  columns={categoryColumns}
                  data={flatCategories}
                  loading={loading}
                  emptyMessage="No categories created yet."
                />
              </Box>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Product Create / Edit Modal                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        opened={productModalOpened}
        onClose={() => !submittingProduct && setProductModalOpened(false)}
        title={
          <Text fw={600} fz={16} c="ink.0">
            {editingProduct ? `Edit Product #${editingProduct.productId}` : 'Add New Product'}
          </Text>
        }
        centered
        size="lg"
      >
        <form onSubmit={handleProductSubmit}>
          <Stack gap={16}>
            <TextInput
              label="Product Name"
              placeholder="e.g. Xbox Wireless Controller"
              required
              value={productForm.productName}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, productName: e.target.value }))
              }
              error={productFormErrors.productName}
            />

            <TextInput
              label="Brand"
              placeholder="e.g. Microsoft, Sony, Dell"
              value={productForm.brand}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, brand: e.target.value }))
              }
              error={productFormErrors.brand}
            />

            <TextInput
              label="Image URL or Path"
              placeholder="/product-images/my-product.jpg"
              description="Static image path under /product-images/ or valid HTTP URL"
              value={productForm.imageUrl}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              error={productFormErrors.imageUrl}
            />

            <MultiSelect
              label="Assigned Categories"
              placeholder="Select one or more categories"
              data={categorySelectOptions}
              value={productForm.categoryIds}
              onChange={(val) =>
                setProductForm((prev) => ({ ...prev, categoryIds: val }))
              }
              error={productFormErrors.categoryIds}
              searchable
              clearable
            />

            <Textarea
              label="Description"
              placeholder="Detailed description of features and specifications..."
              rows={3}
              value={productForm.description}
              onChange={(e) =>
                setProductForm((prev) => ({ ...prev, description: e.target.value }))
              }
              error={productFormErrors.description}
            />

            {editingProduct && (
              <Switch
                label="Product Active in Catalogue"
                description="Inactive products are hidden from public browse and search"
                checked={productForm.isActive}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))
                }
              />
            )}

            <Group justify="flex-end" gap={12} mt={12}>
              <Button
                variant="default"
                onClick={() => setProductModalOpened(false)}
                disabled={submittingProduct}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="amber.5"
                c="black"
                loading={submittingProduct}
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Category Create / Edit Modal                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        opened={categoryModalOpened}
        onClose={() => !submittingCategory && setCategoryModalOpened(false)}
        title={
          <Text fw={600} fz={16} c="ink.0">
            {editingCategory ? `Edit Category #${editingCategory.categoryId}` : 'Add New Category'}
          </Text>
        }
        centered
      >
        <form onSubmit={handleCategorySubmit}>
          <Stack gap={16}>
            <TextInput
              label="Category Name"
              placeholder="e.g. Smart Wearables"
              required
              value={categoryForm.categoryName}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, categoryName: e.target.value }))
              }
              error={categoryFormErrors.categoryName}
            />

            <Select
              label="Parent Category"
              placeholder="None (Top Level)"
              data={[
                { value: '', label: '— None (Top Level)' },
                ...flatCategories
                  .filter((c) => !editingCategory || c.categoryId !== editingCategory.categoryId)
                  .map((c) => ({
                    value: String(c.categoryId),
                    label: c.path,
                  })),
              ]}
              value={categoryForm.parentCategoryId || ''}
              onChange={(v) =>
                setCategoryForm((prev) => ({ ...prev, parentCategoryId: v || null }))
              }
              error={categoryFormErrors.parentCategoryId}
              clearable
            />

            {editingCategory && (
              <Switch
                label="Category Active"
                description="Deactivating hides all products linked under this category"
                checked={categoryForm.isActive}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))
                }
              />
            )}

            <Group justify="flex-end" gap={12} mt={12}>
              <Button
                variant="default"
                onClick={() => setCategoryModalOpened(false)}
                disabled={submittingCategory}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="amber.5"
                c="black"
                loading={submittingCategory}
              >
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Deactivate Confirm Modal                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        opened={deactivateModalOpened}
        onClose={() => !submittingDeactivate && setDeactivateModalOpened(false)}
        title={
          <Group gap={8}>
            <IconAlertTriangle size={20} style={{ color: 'var(--mantine-color-amber-5)' }} />
            <Text fw={600} fz={16} c="ink.0">
              Confirm Deactivation
            </Text>
          </Group>
        }
        centered
      >
        <Stack gap={16}>
          <Text fz={14} c="ink.1">
            Are you sure you want to deactivate{' '}
            <Text component="span" fw={600} c="ink.0">
              {deactivateTarget?.type === 'product'
                ? deactivateTarget?.item?.productName
                : deactivateTarget?.item?.categoryName}
            </Text>
            ?
          </Text>
          <Text fz={13} c="ink.3">
            {deactivateTarget?.type === 'product'
              ? 'This will immediately hide the product from the public store and searches. Existing orders will continue referencing this product.'
              : 'This will deactivate the category. It will fail if active products are still assigned exclusively to this category.'}
          </Text>

          <Group justify="flex-end" gap={12} mt={12}>
            <Button
              variant="default"
              onClick={() => setDeactivateModalOpened(false)}
              disabled={submittingDeactivate}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDeactivate}
              loading={submittingDeactivate}
            >
              Deactivate
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Product Variants Drawer                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Drawer
        opened={Boolean(variantDrawerProduct)}
        onClose={() => setVariantDrawerProduct(null)}
        position="right"
        size="xl"
        title={
          <Group gap={12}>
            <IconLayersLinked size={20} style={{ color: 'var(--mantine-color-amber-5)' }} />
            <Text fw={600} fz={16} c="ink.0">
              Variants — {variantDrawerProduct?.productName}
            </Text>
          </Group>
        }
        styles={{
          content: { background: 'var(--mantine-color-ink-9)' },
          header: { background: 'var(--mantine-color-ink-9)', borderBottom: `1px solid ${LINE}` },
        }}
      >
        <Stack gap={20} p={16}>
          <Box
            p={14}
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 6,
              background: 'var(--mantine-color-ink-8)',
            }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Stack gap={2}>
                <Text fz={12} c="ink.3">
                  Product ID #{variantDrawerProduct?.productId} · {variantDrawerProduct?.brand || 'No brand'}
                </Text>
                <Text fz={13} c="ink.2">
                  SKUs, selling prices, and attributes. Physical warehouse stock adjustments must be logged through Stock Adjustments (REQ-10.4).
                </Text>
              </Stack>
              <Button
                color="amber.5"
                c="black"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={openAddVariant}
              >
                Add Variant
              </Button>
            </Group>
          </Box>

          <Box
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--mantine-color-ink-8)',
            }}
          >
            <DataTable
              columns={variantColumns}
              data={variantProductDetails?.variants || []}
              loading={variantsLoading}
              emptyMessage="No variants exist for this product. Add at least one variant for it to be orderable."
            />
          </Box>
        </Stack>
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Variant Create / Edit Modal                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <Modal
        opened={variantModalOpened}
        onClose={() => !submittingVariant && setVariantModalOpened(false)}
        title={
          <Text fw={600} fz={16} c="ink.0">
            {editingVariant ? `Edit Variant (${editingVariant.sku})` : 'Add New Variant'}
          </Text>
        }
        centered
        size="md"
      >
        <form onSubmit={handleVariantSubmit}>
          <Stack gap={16}>
            <TextInput
              label="SKU Code"
              placeholder="e.g. DELL-15-I5-16-512"
              required
              value={variantForm.sku}
              onChange={(e) =>
                setVariantForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))
              }
              error={variantFormErrors.sku}
            />

            <TextInput
              label="Selling Price (USD)"
              placeholder="e.g. 599.00"
              required
              value={variantForm.price}
              onChange={(e) =>
                setVariantForm((prev) => ({ ...prev, price: e.target.value }))
              }
              error={variantFormErrors.price}
            />

            {!editingVariant ? (
              <NumberInput
                label="Initial Stock Quantity"
                placeholder="0"
                min={0}
                value={variantForm.stockQuantity}
                onChange={(val) =>
                  setVariantForm((prev) => ({ ...prev, stockQuantity: val ?? 0 }))
                }
                error={variantFormErrors.stockQuantity}
              />
            ) : (
              <Box>
                <Text fz={13} fw={500} c="ink.1" mb={4}>
                  Current Stock: {variantForm.stockQuantity} units
                </Text>
                <Text fz={12} c="ink.3">
                  Stock quantity cannot be edited directly here. Use Stock Adjustments for audited changes (REQ-10.4).
                </Text>
              </Box>
            )}

            {editingVariant && (
              <Switch
                label="Variant Active"
                description="Inactive variants cannot be purchased"
                checked={variantForm.isActive}
                onChange={(e) =>
                  setVariantForm((prev) => ({ ...prev, isActive: e.currentTarget.checked }))
                }
              />
            )}

            <Divider my={4} color="rgba(255,236,214,0.10)" />

            <Stack gap={8}>
              <Group justify="space-between">
                <Text fz={13} fw={500} c="ink.1">
                  Variant Attributes (Color, RAM, Storage, etc.)
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  color="amber.5"
                  leftSection={<IconPlus size={12} />}
                  onClick={handleAddAttributeRow}
                >
                  Add Attribute
                </Button>
              </Group>

              {variantForm.attributes.map((attr, index) => (
                <Group key={index} gap={8} wrap="nowrap" align="center">
                  <TextInput
                    placeholder="Name (e.g. Color)"
                    size="xs"
                    value={attr.name}
                    onChange={(e) =>
                      handleAttributeChange(index, 'name', e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    placeholder="Value (e.g. Midnight Blue)"
                    size="xs"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(index, 'value', e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  {variantForm.attributes.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleRemoveAttributeRow(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>

            <Group justify="flex-end" gap={12} mt={12}>
              <Button
                variant="default"
                onClick={() => setVariantModalOpened(false)}
                disabled={submittingVariant}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="amber.5"
                c="black"
                loading={submittingVariant}
              >
                {editingVariant ? 'Save Changes' : 'Create Variant'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
