// catalogue slice — OWNER: M2
/**
 * SQL ONLY. No business logic, no req/res.
 *
 * - Every value goes through a ? placeholder — never string concatenation.
 *   (Where SQL text is built up, only fixed column names from a whitelist in
 *   this file are spliced in — never anything that came from the request.)
 * - JSON is camelCase, the database is snake_case: this file translates
 *   (AGENTS.md rule 9).
 * - Money leaves here as a string ("1299.00") via CAST(... AS CHAR), so the
 *   cents survive whatever the driver's decimalNumbers setting is (rule 6).
 */
const { pool, withTransaction } = require('../../config/db');

// ===========================================================================
// Products — reading
// ===========================================================================

// Make a user's keyword safe to use inside LIKE (so "50%" means a literal "50%").
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

/**
 * Builds the pieces shared by the "rows" query and the "count" query,
 * adding a condition ONLY when that filter was supplied.
 * Parameter order must match the order the pieces appear in the final SQL:
 * cte -> where -> having.
 */
function buildFilter({ q, brands, categoryId, minPrice, maxPrice }) {
  const where = ['p.is_active = TRUE'];
  const having = [];
  const cteParams = [];
  const whereParams = [];
  const havingParams = [];
  let cte = '';

  if (q) {
    // Search matches the product name only; brand has its own filter.
    where.push('p.product_name LIKE ?');
    whereParams.push(`%${escapeLike(q)}%`);
  }

  if (brands && brands.length > 0) {
    where.push('p.brand IN (?)');
    whereParams.push(brands); // mysql2 turns the array into 'Dell', 'HP'
  }

  if (categoryId) {
    // The chosen category plus all of its sub-categories (category.parent_category_id).
    cte = `WITH RECURSIVE category_tree AS (
             SELECT category_id FROM category WHERE category_id = ? AND is_active = TRUE
             UNION ALL
             SELECT c.category_id FROM category c
               JOIN category_tree t ON c.parent_category_id = t.category_id
              WHERE c.is_active = TRUE
           ) `;
    cteParams.push(categoryId);
    where.push(`p.product_id IN (
                  SELECT pc.product_id FROM product_category pc
                    JOIN category_tree ct ON ct.category_id = pc.category_id)`);
  }

  // Price lives on variant, so "price in range" means "at least one variant is in range".
  if (minPrice !== undefined && maxPrice !== undefined) {
    having.push('SUM(v.price >= ? AND v.price <= ?) > 0');
    havingParams.push(minPrice, maxPrice);
  } else if (minPrice !== undefined) {
    having.push('SUM(v.price >= ?) > 0');
    havingParams.push(minPrice);
  } else if (maxPrice !== undefined) {
    having.push('SUM(v.price <= ?) > 0');
    havingParams.push(maxPrice);
  }

  const core = `
      FROM product p
      JOIN variant v ON v.product_id = p.product_id AND v.is_active = TRUE
     WHERE ${where.join(' AND ')}
     GROUP BY p.product_id
     ${having.length ? 'HAVING ' + having.join(' AND ') : ''}`;

  return { cte, core, params: [...cteParams, ...whereParams, ...havingParams] };
}

// ?sort=... -> ORDER BY. A fixed whitelist: only these strings ever reach the SQL.
// "relevance" has no score behind it yet, so it falls back to name order.
const SORT_ORDER = {
  relevance: 'p.product_name, p.product_id',
  name_asc: 'p.product_name, p.product_id',
  price_asc: 'MIN(v.price), p.product_id',
  price_desc: 'MIN(v.price) DESC, p.product_id',
};

/** One page of products + the total number of matches (REQ-1.1, 1.3, 1.4). */
exports.searchProducts = async (filters) => {
  const { cte, core, params } = buildFilter(filters);
  const orderBy = SORT_ORDER[filters.sort] || SORT_ORDER.relevance;

  const rowsSql = `${cte}
    SELECT p.product_id AS productId,
           p.product_name AS productName,
           p.brand AS brand,
           p.image_url AS imageUrl,
           CAST(MIN(v.price) AS CHAR) AS priceFrom,
           CAST(MAX(v.price) AS CHAR) AS priceTo
    ${core}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`;

  const countSql = `${cte}
    SELECT COUNT(*) AS total FROM (SELECT p.product_id ${core}) AS matched`;

  const [[rows], [countRows]] = await Promise.all([
    pool.query(rowsSql, [...params, filters.limit, filters.offset]),
    pool.query(countSql, params),
  ]);

  return { rows, total: countRows[0].total };
};

/**
 * The active categories each of these products belongs to.
 * Returns flat rows { productId, categoryId, categoryName }.
 */
exports.findCategoriesForProducts = async (productIds) => {
  if (productIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT pc.product_id AS productId,
            c.category_id AS categoryId,
            c.category_name AS categoryName
       FROM product_category pc
       JOIN category c ON c.category_id = pc.category_id AND c.is_active = TRUE
      WHERE pc.product_id IN (?)
      ORDER BY c.category_name, c.category_id`,
    [productIds]
  );
  return rows;
};

/**
 * One product with its price range across ACTIVE variants (null if it has none).
 * activeOnly = true for customers; false for staff, who may see deactivated products.
 */
exports.findProductById = async (productId, { activeOnly }) => {
  const [rows] = await pool.query(
    `SELECT p.product_id AS productId,
            p.product_name AS productName,
            p.description AS description,
            p.brand AS brand,
            p.image_url AS imageUrl,
            p.is_active AS isActive,
            CAST(MIN(v.price) AS CHAR) AS priceFrom,
            CAST(MAX(v.price) AS CHAR) AS priceTo
       FROM product p
       LEFT JOIN variant v ON v.product_id = p.product_id AND v.is_active = TRUE
      WHERE p.product_id = ? ${activeOnly ? 'AND p.is_active = TRUE' : ''}
      GROUP BY p.product_id`,
    [productId]
  );
  if (!rows[0]) return null;
  return { ...rows[0], isActive: Boolean(rows[0].isActive) };
};

// ===========================================================================
// Variants — reading
// ===========================================================================

// productName is denormalised into the variant so cart lines need no second request.
const VARIANT_SELECT = `
  SELECT v.variant_id AS variantId,
         v.product_id AS productId,
         p.product_name AS productName,
         v.SKU AS sku,
         CAST(v.price AS CHAR) AS price,
         v.stock_quantity AS stockQuantity,
         v.is_active AS isActive
    FROM variant v
    JOIN product p ON p.product_id = v.product_id`;

const toVariantRow = (row) => ({ ...row, isActive: Boolean(row.isActive) });

exports.findVariantsByProductId = async (productId, { activeOnly }) => {
  const [rows] = await pool.query(
    `${VARIANT_SELECT}
      WHERE v.product_id = ? ${activeOnly ? 'AND v.is_active = TRUE' : ''}
      ORDER BY v.price, v.variant_id`,
    [productId]
  );
  return rows.map(toVariantRow);
};

exports.findVariantById = async (variantId) => {
  const [rows] = await pool.query(`${VARIANT_SELECT} WHERE v.variant_id = ?`, [variantId]);
  return rows[0] ? toVariantRow(rows[0]) : null;
};

/** Attributes (Colour, Storage...) for a set of variants, as flat rows. */
exports.findAttributesForVariants = async (variantIds) => {
  if (variantIds.length === 0) return [];
  const [rows] = await pool.query(
    `SELECT av.variant_id AS variantId, va.name AS name, av.value AS value
       FROM attribute_value av
       JOIN variant_attribute va ON va.attribute_id = av.attribute_id
      WHERE av.variant_id IN (?)
      ORDER BY av.variant_id, va.name`,
    [variantIds]
  );
  return rows;
};

// ===========================================================================
// Categories — reading
// ===========================================================================

exports.findActiveCategories = async () => {
  const [rows] = await pool.query(
    `SELECT category_id AS categoryId,
            category_name AS categoryName,
            parent_category_id AS parentCategoryId
       FROM category
      WHERE is_active = TRUE
      ORDER BY category_name, category_id`
  );
  return rows;
};

exports.findCategoryById = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT category_id AS categoryId,
            category_name AS categoryName,
            parent_category_id AS parentCategoryId,
            is_active AS isActive
       FROM category
      WHERE category_id = ?`,
    [categoryId]
  );
  return rows[0] ? { ...rows[0], isActive: Boolean(rows[0].isActive) } : null;
};

/** Which of these ids are real, active categories? Returns the ids that are. */
exports.findActiveCategoryIds = async (categoryIds) => {
  if (categoryIds.length === 0) return [];
  const [rows] = await pool.query(
    'SELECT category_id AS categoryId FROM category WHERE category_id IN (?) AND is_active = TRUE',
    [categoryIds]
  );
  return rows.map((r) => r.categoryId);
};

/**
 * This category and everything below it (active or not).
 * Used to stop a category being moved underneath itself.
 */
exports.findCategoryAndDescendantIds = async (categoryId) => {
  const [rows] = await pool.query(
    `WITH RECURSIVE subtree AS (
       SELECT category_id FROM category WHERE category_id = ?
       UNION ALL
       SELECT c.category_id FROM category c
         JOIN subtree s ON c.parent_category_id = s.category_id
     )
     SELECT category_id AS categoryId FROM subtree`,
    [categoryId]
  );
  return rows.map((r) => r.categoryId);
};

// ===========================================================================
// Writing (staff). Nothing here ever DELETEs a catalogue row — "delete" means
// is_active = FALSE, because orders keep pointing at these rows (REQ-10.1).
// ===========================================================================

// Fixed whitelists: request field -> column. Only these names are ever put into SQL text.
const PRODUCT_COLUMNS = {
  productName: 'product_name',
  description: 'description',
  brand: 'brand',
  imageUrl: 'image_url',
  isActive: 'is_active',
};
const CATEGORY_COLUMNS = {
  categoryName: 'category_name',
  parentCategoryId: 'parent_category_id',
  isActive: 'is_active',
};
const VARIANT_COLUMNS = {
  sku: 'SKU',
  price: 'price',
  isActive: 'is_active',
};

/** "col = ?, col = ?" for the fields that were actually supplied. */
function buildSet(fields, columnMap) {
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(fields[key]);
    }
  }
  return { sets, params };
}

async function replaceProductCategories(conn, productId, categoryIds) {
  await conn.query('DELETE FROM product_category WHERE product_id = ?', [productId]);
  if (categoryIds.length > 0) {
    await conn.query(
      'INSERT INTO product_category (product_id, category_id) VALUES ?',
      [categoryIds.map((categoryId) => [productId, categoryId])]
    );
  }
}

async function replaceVariantAttributes(conn, variantId, attributes) {
  await conn.query('DELETE FROM attribute_value WHERE variant_id = ?', [variantId]);
  for (const { name, value } of attributes) {
    // Create the attribute name (e.g. "Colour") the first time it is used.
    // INSERT IGNORE skips it quietly if it already exists (name is UNIQUE).
    await conn.query('INSERT IGNORE INTO variant_attribute (name) VALUES (?)', [name]);
    const [[attr]] = await conn.query(
      'SELECT attribute_id FROM variant_attribute WHERE name = ?',
      [name]
    );
    await conn.query(
      'INSERT INTO attribute_value (attribute_id, variant_id, value) VALUES (?, ?, ?)',
      [attr.attribute_id, variantId, value]
    );
  }
}

// ---- products -------------------------------------------------------------

exports.insertProduct = ({ productName, description, brand, imageUrl, categoryIds }) =>
  withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO product (product_name, description, brand, image_url)
       VALUES (?, ?, ?, ?)`,
      [productName, description ?? null, brand ?? null, imageUrl ?? null]
    );
    await replaceProductCategories(conn, res.insertId, categoryIds);
    return res.insertId;
  });

/** fields: only the keys to change. categoryIds: omit to leave categories alone. */
exports.updateProduct = (productId, fields, categoryIds) =>
  withTransaction(async (conn) => {
    const { sets, params } = buildSet(fields, PRODUCT_COLUMNS);
    if (sets.length > 0) {
      await conn.query(
        `UPDATE product SET ${sets.join(', ')} WHERE product_id = ?`,
        [...params, productId]
      );
    }
    if (categoryIds !== undefined) {
      await replaceProductCategories(conn, productId, categoryIds);
    }
  });

// ---- categories -----------------------------------------------------------

exports.insertCategory = async ({ categoryName, parentCategoryId }) => {
  const [res] = await pool.query(
    'INSERT INTO category (category_name, parent_category_id) VALUES (?, ?)',
    [categoryName, parentCategoryId ?? null]
  );
  return res.insertId;
};

exports.updateCategory = async (categoryId, fields) => {
  const { sets, params } = buildSet(fields, CATEGORY_COLUMNS);
  if (sets.length === 0) return;
  await pool.query(
    `UPDATE category SET ${sets.join(', ')} WHERE category_id = ?`,
    [...params, categoryId]
  );
};

// ---- variants -------------------------------------------------------------

exports.insertVariant = ({ productId, sku, price, stockQuantity, attributes }) =>
  withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO variant (product_id, SKU, price, stock_quantity)
       VALUES (?, ?, ?, ?)`,
      [productId, sku, price, stockQuantity]
    );
    await replaceVariantAttributes(conn, res.insertId, attributes);
    return res.insertId;
  });

/**
 * Stock is deliberately NOT editable here — manual stock changes must go
 * through POST /admin/stock-adjustments so the audit trail is written (REQ-10.4).
 */
exports.updateVariant = (variantId, fields, attributes) =>
  withTransaction(async (conn) => {
    const { sets, params } = buildSet(fields, VARIANT_COLUMNS);
    if (sets.length > 0) {
      await conn.query(
        `UPDATE variant SET ${sets.join(', ')} WHERE variant_id = ?`,
        [...params, variantId]
      );
    }
    if (attributes !== undefined) {
      await replaceVariantAttributes(conn, variantId, attributes);
    }
  });