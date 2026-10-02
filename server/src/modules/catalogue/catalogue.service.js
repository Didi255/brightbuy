// catalogue slice — OWNER: M2
// TODO(M2): business rules only. No SQL, no req/res.

/**
 * Business rules for the catalogue. No SQL, no req/res.
 * Validates + normalises the raw query string, applies defaults,
 * calls the repo, then shapes the result for the API.
 */
const repo = require('./catalogue.repo');
const ApiError = require('../../utils/ApiError');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ---- small parsing helpers (each records problems in `errors`) -----------

function readText(value, field, errors, maxLen) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {           // e.g. ?brand=a&brand=b gives an array
    errors[field] = 'must be a single value';
    return undefined;
  }
  const text = value.trim();
  if (text === '') return undefined;         // "?keyword=" is treated as "not provided"
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
    errors[field] = 'must be a non-negative amount with at most 2 decimals';
    return undefined;
  }
  return Number(value);
}

// ---- public API -----------------------------------------------------------

exports.searchProducts = async (query) => {
  const errors = {};

  const keyword    = readText(query.keyword, 'keyword', errors, 100);
  const brand      = readText(query.brand, 'brand', errors, 50);
  const categoryId = readInt(query.category, 'category', errors, 1, 2147483647);
  const minPrice   = readPrice(query.min_price, 'min_price', errors);
  const maxPrice   = readPrice(query.max_price, 'max_price', errors);
  const page  = readInt(query.page, 'page', errors, 1, 1000000) ?? DEFAULT_PAGE;
  const limit = readInt(query.limit, 'limit', errors, 1, MAX_LIMIT) ?? DEFAULT_LIMIT;

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.min_price = 'must not be greater than max_price';
  }

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Invalid query parameters', errors);
  }

  const offset = (page - 1) * limit;

  const { rows, total } = await repo.searchProducts({
    keyword, brand, categoryId, minPrice, maxPrice, limit, offset,
  });

  return {
    items: rows.map((r) => ({
      productId: r.product_id,
      name: r.product_name,
      brand: r.brand,
      imageUrl: r.image_url,
      priceFrom: r.price_from,
      priceTo: r.price_to,
      totalStock: r.total_stock,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};