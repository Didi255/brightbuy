// catalogue slice — OWNER: M2
// Business rules only. No SQL, no req/res.

const repo = require('./catalogue.repo');
const ApiError = require('../../utils/ApiError');

const DEFAULT_PAGE     = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE    = 100;

// ─── Parsing helpers ─────────────────────────────────────────────────────────
// Each helper pushes a message into `errors` and returns undefined on bad input.

function readText(value, field, errors, maxLen) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    errors[field] = 'must be a single value';
    return undefined;
  }
  const text = value.trim();
  if (text === '') return undefined;       // empty string = not provided
  if (text.length > maxLen) {
    errors[field] = `must be at most ${maxLen} characters`;
    return undefined;
  }
  return text;
}

function readInt(value, field, errors, min, max) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
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

function readPrice(value, field, errors) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim())) {
    errors[field] = 'must be a non-negative amount with at most 2 decimal places';
    return undefined;
  }
  return Number(value);
}

/** Format a number or numeric string as a money string "1299.00" (AGENTS.md rule 6). */
function money(v) {
  return Number(v).toFixed(2);
}

// ─── GET /products ──────────────────────────────────────────────────────────

exports.searchProducts = async (query) => {
  const errors = {};

  // API.md uses: q, categoryId, brand, minPrice, maxPrice, page, pageSize
  const keyword    = readText(query.q, 'q', errors, 100);
  const brand      = readText(query.brand, 'brand', errors, 50);
  const categoryId = readInt(query.categoryId, 'categoryId', errors, 1, 2147483647);
  const minPrice   = readPrice(query.minPrice, 'minPrice', errors);
  const maxPrice   = readPrice(query.maxPrice, 'maxPrice', errors);
  const page       = readInt(query.page, 'page', errors, 1, 1000000) ?? DEFAULT_PAGE;
  const pageSize   = readInt(query.pageSize, 'pageSize', errors, 1, MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE;

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.minPrice = 'must not be greater than maxPrice';
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Invalid query parameters', errors);
  }

  const offset = (page - 1) * pageSize;

  const { rows, total } = await repo.searchProducts({
    keyword, brand, categoryId, minPrice, maxPrice,
    limit: pageSize, offset,
  });

  // Format money fields as strings (AGENTS.md rule 6).
  const data = rows.map((r) => ({
    productId:   r.productId,
    productName: r.productName,
    brand:       r.brand,
    imageUrl:    r.imageUrl,
    priceFrom:   money(r.priceFrom),
    priceTo:     money(r.priceTo),
    categories:  r.categories,
  }));

  // API.md envelope: { data, page, pageSize, total }
  return { data, page, pageSize, total };
};

// ─── GET /products/:id ───────────────────────────────────────────────────────

/**
 * Groups the flat variantRows (one row per variant × attribute) into
 * the Variant shape from API.md §1.
 */
function groupVariants(productName, variantRows) {
  const map = new Map(); // variantId → variant object
  for (const row of variantRows) {
    if (!map.has(row.variantId)) {
      map.set(row.variantId, {
        variantId:     row.variantId,
        productId:     row.productId,
        productName,                         // denormalised — API.md §1
        sku:           row.sku,
        price:         money(row.price),
        stockQuantity: row.stockQuantity,
        inStock:       row.stockQuantity > 0, // computed server-side — API.md §1
        isActive:      Boolean(row.isActive),
        attributes:    [],
      });
    }
    if (row.attrName !== null) {
      map.get(row.variantId).attributes.push({
        name:  row.attrName,
        value: row.attrValue,
      });
    }
  }
  return [...map.values()];
}

exports.getProduct = async (productId) => {
  const result = await repo.getProductById(productId);
  if (!result) throw ApiError.notFound('Product not found');

  const { product, categories, variantRows } = result;

  return {
    productId:   product.productId,
    productName: product.productName,
    description: product.description,
    brand:       product.brand,
    imageUrl:    product.imageUrl,
    isActive:    Boolean(product.isActive),
    categories,
    variants:    groupVariants(product.productName, variantRows),
  };
};

// ─── GET /categories ─────────────────────────────────────────────────────────

/**
 * Builds a nested tree from a flat array.
 * We fetch flat (one SQL query) and assemble in JS — no recursive CTE needed.
 */
function buildTree(rows) {
  const map = {};
  for (const r of rows) {
    map[r.categoryId] = {
      categoryId:       r.categoryId,
      categoryName:     r.categoryName,
      parentCategoryId: r.parentCategoryId,
      isActive:         Boolean(r.isActive),
      children:         [],
    };
  }
  const roots = [];
  for (const r of rows) {
    if (r.parentCategoryId == null) {
      roots.push(map[r.categoryId]);
    } else if (map[r.parentCategoryId]) {
      map[r.parentCategoryId].children.push(map[r.categoryId]);
    }
  }
  return roots;
}

exports.getCategories = async () => {
  const rows = await repo.getAllCategories();
  return buildTree(rows);
};

// ─── Admin: products ─────────────────────────────────────────────────────────

exports.adminCreateProduct = async (body) => {
  const { productName, brand, description, imageUrl, categoryIds } = body;
  if (!productName) throw ApiError.badRequest('productName is required');
  const productId = await repo.createProduct({ productName, brand, description, imageUrl, categoryIds });
  return { productId };
};

exports.adminUpdateProduct = async (productId, body) => {
  const existing = await repo.findProductById(productId);
  if (!existing) throw ApiError.notFound('Product not found');
  await repo.updateProduct(productId, body);
  return repo.findProductById(productId);
};

exports.adminDeactivateProduct = async (productId) => {
  const affected = await repo.deactivateProduct(productId);
  if (affected === 0) throw ApiError.notFound('Product not found');
};

// ─── Admin: categories ───────────────────────────────────────────────────────

exports.adminCreateCategory = async (body) => {
  const { categoryName, parentCategoryId } = body;
  if (!categoryName) throw ApiError.badRequest('categoryName is required');
  const categoryId = await repo.createCategory({ categoryName, parentCategoryId });
  return { categoryId };
};

exports.adminUpdateCategory = async (categoryId, body) => {
  const existing = await repo.findCategoryById(categoryId);
  if (!existing) throw ApiError.notFound('Category not found');
  await repo.updateCategory(categoryId, body);
  return repo.findCategoryById(categoryId);
};

exports.adminDeactivateCategory = async (categoryId) => {
  const existing = await repo.findCategoryById(categoryId);
  if (!existing) throw ApiError.notFound('Category not found');

  // Block deactivation if active products still reference this category.
  const activeCount = await repo.countActiveProductsInCategory(categoryId);
  if (activeCount > 0) {
    throw ApiError.conflict(
      'CONFLICT',
      `Cannot deactivate: ${activeCount} active product(s) still belong to this category`
    );
  }
  await repo.deactivateCategory(categoryId);
};

// ─── Admin: variants ─────────────────────────────────────────────────────────

exports.adminCreateVariant = async (body) => {
  const { productId, sku, price, stockQuantity, attributes } = body;
  if (!productId) throw ApiError.badRequest('productId is required');
  if (!sku)       throw ApiError.badRequest('sku is required');
  if (!price)     throw ApiError.badRequest('price is required');

  try {
    const variantId = await repo.createVariant({ productId, sku, price, stockQuantity, attributes });
    return { variantId };
  } catch (err) {
    // ER_DUP_ENTRY from MySQL when SKU already exists — never leak the raw DB error.
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('DUPLICATE', `SKU '${sku}' already exists`);
    }
    throw err;
  }
};

exports.adminUpdateVariant = async (variantId, body) => {
  const existing = await repo.findVariantById(variantId);
  if (!existing) throw ApiError.notFound('Variant not found');

  try {
    await repo.updateVariant(variantId, body);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('DUPLICATE', `SKU '${body.sku}' already exists`);
    }
    throw err;
  }

  return repo.findVariantById(variantId);
};