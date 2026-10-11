// catalogue slice — OWNER: M2
/**
 * Business rules for the catalogue. No SQL, no req/res.
 *
 * Validates every request, applies defaults, calls the repo, and shapes the
 * result into the JSON that docs/API.md promises (Variant, product, category
 * tree, paginated list). Validation errors are collected into one `fields`
 * object so a form can show every problem at once.
 */
const repo = require('./catalogue.repo');
const ApiError = require('../../utils/ApiError');

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_INT = 2147483647; // INT column limit
const SORT_VALUES = ['relevance', 'price_asc', 'price_desc', 'name_asc'];

// ===========================================================================
// Small parsing helpers. Each one records a problem in `errors` (keyed by
// field name) instead of throwing, so we can report all problems together.
// ===========================================================================

function throwIfInvalid(errors, message = 'Invalid request') {
  if (Object.keys(errors).length > 0) throw ApiError.badRequest(message, errors);
}

function requireObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }
}

/** Query-string text. Missing or blank means "not provided". */
function readText(value, field, errors, maxLen) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {           // e.g. ?brand=a&brand=b gives an array
    errors[field] = 'must be a single value';
    return undefined;
  }
  const text = value.trim();
  if (text === '') return undefined;
  if (text.length > maxLen) {
    errors[field] = `must be at most ${maxLen} characters`;
    return undefined;
  }
  return text;
}

/**
 * Request-body text.
 *   undefined -> "not supplied" (error only if required)
 *   null / ""  -> allowed only if nullable (means "clear this column")
 */
function readString(value, field, errors, { maxLen, required = false, nullable = false }) {
  if (value === undefined) {
    if (required) errors[field] = 'is required';
    return undefined;
  }
  if (value === null) {
    if (nullable) return null;
    errors[field] = required ? 'is required' : 'cannot be null';
    return undefined;
  }
  if (typeof value !== 'string') {
    errors[field] = 'must be text';
    return undefined;
  }
  const text = value.trim();
  if (text === '') {
    if (nullable) return null;
    errors[field] = 'cannot be empty';
    return undefined;
  }
  if (text.length > maxLen) {
    errors[field] = `must be at most ${maxLen} characters`;
    return undefined;
  }
  return text;
}

function readUrl(value, field, errors) {
  const url = readString(value, field, errors, { maxLen: 2083, nullable: true });
  if (typeof url === 'string' && !/^https?:\/\/\S+$/i.test(url)) {
    errors[field] = 'must be an http(s) URL';
    return undefined;
  }
  return url;
}

/** A whole number, from a query string ("5") or a JSON body (5). */
function readInt(value, field, errors, min, max) {
  if (value === undefined || value === '') return undefined;
  const isDigits = typeof value === 'string' && /^\d+$/.test(value.trim());
  const isWhole = typeof value === 'number' && Number.isInteger(value);
  if (!isDigits && !isWhole) {
    errors[field] = 'must be a whole number';
    return undefined;
  }
  const n = Number(value);
  if (n < min || n > max) {
    errors[field] = `must be between ${min} and ${max}`;
    return undefined;
  }
  return n;
}

/** Money: at most 8 digits before and 2 after the point (fits DECIMAL(10,2)). */
function readMoney(value, field, errors, { positive = false } = {}) {
  if (value === undefined || value === '') return undefined;
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) {
    errors[field] = 'must be an amount like 1299 or 1299.50 (at most 2 decimals)';
    return undefined;
  }
  const n = Number(text);
  if (positive && n <= 0) {
    errors[field] = 'must be greater than 0';
    return undefined;
  }
  return n;
}

function readBoolean(value, field, errors) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    errors[field] = 'must be true or false';
    return undefined;
  }
  return value;
}

/** An id that may be null (e.g. a top-level category has no parent). */
function readNullableId(value, field, errors) {
  if (value === null) return null;
  return readInt(value, field, errors, 1, MAX_INT);
}

/** [3, 7] -> [3, 7] (duplicates dropped). */
function readIdList(value, field, errors) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 50) {
    errors[field] = 'must be a list of up to 50 ids';
    return undefined;
  }
  const ids = [];
  for (const item of value) {
    if (!Number.isInteger(item) || item < 1 || item > MAX_INT) {
      errors[field] = 'must contain only positive whole numbers';
      return undefined;
    }
    if (!ids.includes(item)) ids.push(item);
  }
  return ids;
}

/** [{ name: 'Colour', value: 'Silver' }, ...] — one value per attribute name. */
function readAttributes(value, errors) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 20) {
    errors.attributes = 'must be a list of up to 20 { name, value } pairs';
    return undefined;
  }
  const result = [];
  const seen = new Set();
  for (const [i, item] of value.entries()) {
    const problems = {};
    const isObject = item && typeof item === 'object' && !Array.isArray(item);
    const name = isObject ? readString(item.name, 'name', problems, { maxLen: 50, required: true }) : undefined;
    const val = isObject ? readString(item.value, 'value', problems, { maxLen: 100, required: true }) : undefined;
    if (!isObject || Object.keys(problems).length > 0) {
      errors[`attributes[${i}]`] = 'needs a non-empty name and value';
      return undefined;
    }
    if (seen.has(name.toLowerCase())) {
      errors.attributes = `"${name}" appears more than once`;
      return undefined;
    }
    seen.add(name.toLowerCase());
    result.push({ name, value: val });
  }
  return result;
}

/** ?brand=Dell,HP -> ['Dell', 'HP']. One or more brands; blank means "no brand filter". */
function readBrands(value, errors) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    errors.brand = 'must be a single value (separate several brands with commas)';
    return undefined;
  }
  const brands = [...new Set(value.split(',').map((b) => b.trim()).filter(Boolean))];
  if (brands.length === 0) return undefined;
  if (brands.length > 20 || brands.some((b) => b.length > 50)) {
    errors.brand = 'at most 20 brands, each at most 50 characters';
    return undefined;
  }
  return brands;
}

/** ?sort=price_asc — one of SORT_VALUES. The repo maps it to a fixed ORDER BY. */
function readSort(value, errors) {
  if (value === undefined || value === '') return 'relevance';
  if (typeof value !== 'string' || !SORT_VALUES.includes(value)) {
    errors.sort = `must be one of: ${SORT_VALUES.join(', ')}`;
    return undefined;
  }
  return value;
}

/** The :id in a URL. */
function parseId(raw) {
  const errors = {};
  const id = readInt(raw, 'id', errors, 1, MAX_INT);
  if (id === undefined) throw ApiError.badRequest('Invalid id', { id: errors.id || 'is required' });
  return id;
}

const hasAnyField = (fields) => Object.values(fields).some((v) => v !== undefined);

// ===========================================================================
// Shaping rows into the API.md JSON
// ===========================================================================

function groupCategories(rows) {
  const byProduct = new Map();
  for (const r of rows) {
    if (!byProduct.has(r.productId)) byProduct.set(r.productId, []);
    byProduct.get(r.productId).push({ categoryId: r.categoryId, categoryName: r.categoryName });
  }
  return byProduct;
}

/**
 * Variant rows -> the shared Variant shape.
 * inStock is computed here (stockQuantity > 0) so no client re-derives it.
 */
async function toVariants(rows) {
  const attributeRows = await repo.findAttributesForVariants(rows.map((r) => r.variantId));
  const byVariant = new Map();
  for (const a of attributeRows) {
    if (!byVariant.has(a.variantId)) byVariant.set(a.variantId, []);
    byVariant.get(a.variantId).push({ name: a.name, value: a.value });
  }
  return rows.map((r) => ({
    variantId: r.variantId,
    productId: r.productId,
    productName: r.productName,
    sku: r.sku,
    price: r.price,
    stockQuantity: r.stockQuantity,
    inStock: r.stockQuantity > 0,
    isActive: r.isActive,
    attributes: byVariant.get(r.variantId) || [],
  }));
}

async function variantResponse(variantId) {
  const row = await repo.findVariantById(variantId);
  return (await toVariants([row]))[0];
}

/** Product + categories + variants. Staff see inactive variants/products too. */
async function productResponse(productId, { activeOnly }) {
  const product = await repo.findProductById(productId, { activeOnly });
  if (!product) throw ApiError.notFound('Product not found');

  const [categoryRows, variantRows] = await Promise.all([
    repo.findCategoriesForProducts([productId]),
    repo.findVariantsByProductId(productId, { activeOnly }),
  ]);

  return {
    productId: product.productId,
    productName: product.productName,
    description: product.description,
    brand: product.brand,
    imageUrl: product.imageUrl,
    priceFrom: product.priceFrom,
    priceTo: product.priceTo,
    isActive: product.isActive,
    categories: groupCategories(categoryRows).get(productId) || [],
    variants: await toVariants(variantRows),
  };
}

async function requireProduct(productId) {
  const product = await repo.findProductById(productId, { activeOnly: false });
  if (!product) throw ApiError.notFound('Product not found');
}

async function categoryResponse(categoryId) {
  const c = await repo.findCategoryById(categoryId);
  return {
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    parentCategoryId: c.parentCategoryId,
    isActive: c.isActive,
  };
}

/** Every id must be a real, active category. */
async function assertCategoriesExist(categoryIds) {
  if (categoryIds.length === 0) return;
  const found = await repo.findActiveCategoryIds(categoryIds);
  const missing = categoryIds.filter((id) => !found.includes(id));
  if (missing.length > 0) {
    throw ApiError.badRequest('Invalid category', {
      categoryIds: `unknown or inactive category id(s): ${missing.join(', ')}`,
    });
  }
}

async function assertValidParent(parentCategoryId) {
  const parent = await repo.findCategoryById(parentCategoryId);
  if (!parent || !parent.isActive) {
    throw ApiError.badRequest('Invalid parent category', {
      parentCategoryId: 'unknown or inactive category',
    });
  }
}

/** A duplicate SKU (UNIQUE constraint, REQ-10.3) becomes a field-level 409. */
function mapDuplicateSku(err) {
  if (err && err.code === 'ER_DUP_ENTRY') {
    return new ApiError(409, 'DUPLICATE', 'SKU already exists', { sku: 'already in use' });
  }
  return err;
}

// ===========================================================================
// Customer-facing (public)
// ===========================================================================

/** GET /products — REQ-1.1, 1.3, 1.4 */
exports.searchProducts = async (query) => {
  const errors = {};

  const q          = readText(query.q, 'q', errors, 100);
  const brands     = readBrands(query.brand, errors);
  const sort       = readSort(query.sort, errors);
  const categoryId = readInt(query.categoryId, 'categoryId', errors, 1, MAX_INT);
  const minPrice   = readMoney(query.minPrice, 'minPrice', errors);
  const maxPrice   = readMoney(query.maxPrice, 'maxPrice', errors);
  const page     = readInt(query.page, 'page', errors, 1, 1000000) ?? DEFAULT_PAGE;
  const pageSize = readInt(query.pageSize, 'pageSize', errors, 1, MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE;

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.minPrice = 'must not be greater than maxPrice';
  }
  throwIfInvalid(errors, 'Invalid query parameters');

  const { rows, total } = await repo.searchProducts({
    q, brands, categoryId, minPrice, maxPrice, sort,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const categoryRows = await repo.findCategoriesForProducts(rows.map((r) => r.productId));
  const categoriesByProduct = groupCategories(categoryRows);

  return {
    data: rows.map((r) => ({ ...r, categories: categoriesByProduct.get(r.productId) || [] })),
    page,
    pageSize,
    total,
  };
};

/** GET /products/:id — REQ-2.1, 2.2 */
exports.getProduct = async (rawId) => {
  const productId = parseId(rawId);
  return productResponse(productId, { activeOnly: true });
};

/**
 * GET /categories — a tree, each node carries `children` (REQ-1.2, 10.2).
 * Returned as a bare array (not wrapped in { data }): API.md says "a tree", and
 * ProductListPage.jsx walks the response directly.
 */
exports.getCategoryTree = async () => {
  const rows = await repo.findActiveCategories();

  const nodes = new Map(rows.map((r) => [r.categoryId, { ...r, children: [] }]));
  const roots = [];
  for (const node of nodes.values()) {
    if (node.parentCategoryId === null) {
      roots.push(node);
    } else {
      const parent = nodes.get(node.parentCategoryId);
      // If the parent is deactivated it is not in the map, so its whole
      // sub-tree disappears from the public tree.
      if (parent) parent.children.push(node);
    }
  }
  return roots;
};

// ===========================================================================
// Staff: products (REQ-10.1). "Delete" only ever deactivates.
// ===========================================================================

exports.createProduct = async (body) => {
  requireObject(body);
  const errors = {};

  const productName = readString(body.productName, 'productName', errors, { maxLen: 100, required: true });
  const description = readString(body.description, 'description', errors, { maxLen: 65000, nullable: true });
  const brand       = readString(body.brand, 'brand', errors, { maxLen: 50, nullable: true });
  const imageUrl    = readUrl(body.imageUrl, 'imageUrl', errors);
  const categoryIds = readIdList(body.categoryIds, 'categoryIds', errors) ?? [];
  throwIfInvalid(errors);

  await assertCategoriesExist(categoryIds);
  const productId = await repo.insertProduct({ productName, description, brand, imageUrl, categoryIds });
  return productResponse(productId, { activeOnly: false });
};

/** Send only the fields that change. categoryIds replaces the whole set. */
exports.updateProduct = async (rawId, body) => {
  const productId = parseId(rawId);
  requireObject(body);
  await requireProduct(productId);
  const errors = {};

  const fields = {
    productName: readString(body.productName, 'productName', errors, { maxLen: 100 }),
    description: readString(body.description, 'description', errors, { maxLen: 65000, nullable: true }),
    brand:       readString(body.brand, 'brand', errors, { maxLen: 50, nullable: true }),
    imageUrl:    readUrl(body.imageUrl, 'imageUrl', errors),
    isActive:    readBoolean(body.isActive, 'isActive', errors),
  };
  const categoryIds = readIdList(body.categoryIds, 'categoryIds', errors);
  throwIfInvalid(errors);

  if (!hasAnyField(fields) && categoryIds === undefined) {
    throw ApiError.badRequest('Nothing to update', { body: 'send at least one field to change' });
  }
  if (categoryIds) await assertCategoriesExist(categoryIds);

  await repo.updateProduct(productId, fields, categoryIds);
  return productResponse(productId, { activeOnly: false });
};

/** DELETE /admin/products/:id — hides the product, keeps the row (orders point at it). */
exports.deactivateProduct = async (rawId) => {
  const productId = parseId(rawId);
  await requireProduct(productId);
  await repo.updateProduct(productId, { isActive: false });
  return { productId, isActive: false };
};

// ===========================================================================
// Staff: categories (REQ-10.1, 10.2)
// ===========================================================================

exports.createCategory = async (body) => {
  requireObject(body);
  const errors = {};

  const categoryName = readString(body.categoryName, 'categoryName', errors, { maxLen: 100, required: true });
  const parentCategoryId = readNullableId(body.parentCategoryId, 'parentCategoryId', errors);
  throwIfInvalid(errors);

  if (parentCategoryId) await assertValidParent(parentCategoryId);
  const categoryId = await repo.insertCategory({ categoryName, parentCategoryId });
  return categoryResponse(categoryId);
};

exports.updateCategory = async (rawId, body) => {
  const categoryId = parseId(rawId);
  requireObject(body);
  if (!(await repo.findCategoryById(categoryId))) throw ApiError.notFound('Category not found');
  const errors = {};

  const fields = {
    categoryName:     readString(body.categoryName, 'categoryName', errors, { maxLen: 100 }),
    parentCategoryId: readNullableId(body.parentCategoryId, 'parentCategoryId', errors),
    isActive:         readBoolean(body.isActive, 'isActive', errors),
  };
  throwIfInvalid(errors);

  if (!hasAnyField(fields)) {
    throw ApiError.badRequest('Nothing to update', { body: 'send at least one field to change' });
  }

  if (fields.parentCategoryId) {
    await assertValidParent(fields.parentCategoryId);
    // A category must never be moved underneath itself or one of its own children.
    const subtree = await repo.findCategoryAndDescendantIds(categoryId);
    if (subtree.includes(fields.parentCategoryId)) {
      throw ApiError.badRequest('Invalid parent category', {
        parentCategoryId: 'a category cannot be placed under itself or one of its own sub-categories',
      });
    }
  }

  await repo.updateCategory(categoryId, fields);
  return categoryResponse(categoryId);
};

exports.deactivateCategory = async (rawId) => {
  const categoryId = parseId(rawId);
  if (!(await repo.findCategoryById(categoryId))) throw ApiError.notFound('Category not found');
  await repo.updateCategory(categoryId, { isActive: false });
  return { categoryId, isActive: false };
};

// ===========================================================================
// Staff: variants (REQ-10.1, 10.3)
// ===========================================================================

exports.createVariant = async (body) => {
  requireObject(body);
  const errors = {};

  const productId = readInt(body.productId, 'productId', errors, 1, MAX_INT);
  if (body.productId === undefined) errors.productId = 'is required';
  const sku = readString(body.sku, 'sku', errors, { maxLen: 50, required: true });
  const price = readMoney(body.price, 'price', errors, { positive: true });
  if (body.price === undefined) errors.price = 'is required';
  const stockQuantity = readInt(body.stockQuantity, 'stockQuantity', errors, 0, MAX_INT) ?? 0;
  const attributes = readAttributes(body.attributes, errors) ?? [];
  throwIfInvalid(errors);

  if (!(await repo.findProductById(productId, { activeOnly: false }))) {
    throw ApiError.badRequest('Invalid product', { productId: 'no such product' });
  }

  try {
    const variantId = await repo.insertVariant({
      productId, sku, price: price.toFixed(2), stockQuantity, attributes,
    });
    return await variantResponse(variantId);
  } catch (err) {
    throw mapDuplicateSku(err);
  }
};

exports.updateVariant = async (rawId, body) => {
  const variantId = parseId(rawId);
  requireObject(body);
  if (!(await repo.findVariantById(variantId))) throw ApiError.notFound('Variant not found');
  const errors = {};

  if (body.stockQuantity !== undefined) {
    // Manual stock changes need an audit trail (REQ-10.4) — that is E's endpoint.
    errors.stockQuantity = 'cannot be changed here — use POST /admin/stock-adjustments';
  }
  const price = readMoney(body.price, 'price', errors, { positive: true });
  const fields = {
    sku:      readString(body.sku, 'sku', errors, { maxLen: 50 }),
    price:    price === undefined ? undefined : price.toFixed(2),
    isActive: readBoolean(body.isActive, 'isActive', errors),
  };
  const attributes = readAttributes(body.attributes, errors);
  throwIfInvalid(errors);

  if (!hasAnyField(fields) && attributes === undefined) {
    throw ApiError.badRequest('Nothing to update', { body: 'send at least one field to change' });
  }

  try {
    await repo.updateVariant(variantId, fields, attributes);
    return await variantResponse(variantId);
  } catch (err) {
    throw mapDuplicateSku(err);
  }
};