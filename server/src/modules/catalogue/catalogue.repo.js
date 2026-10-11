// catalogue slice — OWNER: M2
// SQL ONLY. No business logic, no req/res.
// Every value goes through a ? placeholder — never string concatenation.

const { pool, withTransaction } = require('../../config/db');

// Make a user's keyword safe to use inside LIKE (so "50%" means a literal "50%").
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

/**
 * Builds the WHERE / HAVING clauses shared by the rows query and the count query.
 * A condition is added ONLY when that filter was supplied.
 * Parameter order: cte params → where params → having params.
 */
function buildFilter({ keyword, brand, categoryId, minPrice, maxPrice }) {
  const where = ['p.is_active = TRUE'];
  const having = [];
  const cteParams = [];
  const whereParams = [];
  const havingParams = [];
  let cte = '';

  if (keyword) {
    const pattern = `%${escapeLike(keyword)}%`;
    // Keyword searches product name only; brand has its own dedicated filter.
    where.push('p.product_name LIKE ?');
    whereParams.push(pattern);
  }

  if (brand) {
    where.push('p.brand = ?');
    whereParams.push(brand);
  }

  if (categoryId) {
    // Include the chosen category AND all of its sub-categories (recursive).
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

  // Price lives on variant — "price in range" means at least one variant is in range.
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

// ─── GET /products ──────────────────────────────────────────────────────────

/**
 * Returns { rows, total }. rows already have categories attached.
 * The service formats money as strings and builds the final response envelope.
 */
exports.searchProducts = async (filters) => {
  const { cte, core, params } = buildFilter(filters);

  const rowsSql = `${cte}
    SELECT p.product_id   AS productId,
           p.product_name AS productName,
           p.brand,
           p.image_url    AS imageUrl,
           MIN(v.price)   AS priceFrom,
           MAX(v.price)   AS priceTo
    ${core}
    ORDER BY p.product_name, p.product_id
    LIMIT ? OFFSET ?`;

  const countSql = `${cte}
    SELECT COUNT(*) AS total FROM (SELECT p.product_id ${core}) AS matched`;

  const [[rows], [countRows]] = await Promise.all([
    pool.query(rowsSql, [...params, filters.limit, filters.offset]),
    pool.query(countSql, params),
  ]);

  const total = countRows[0].total;
  if (rows.length === 0) return { rows: [], total };

  // Fetch categories for every returned product in one round-trip.
  const productIds = rows.map((r) => r.productId);
  const [catRows] = await pool.query(
    `SELECT pc.product_id  AS productId,
            c.category_id  AS categoryId,
            c.category_name AS categoryName
       FROM product_category pc
       JOIN category c ON c.category_id = pc.category_id
      WHERE pc.product_id IN (?)`,
    [productIds]
  );

  // Group categories by productId.
  const catMap = {};
  for (const c of catRows) {
    if (!catMap[c.productId]) catMap[c.productId] = [];
    catMap[c.productId].push({ categoryId: c.categoryId, categoryName: c.categoryName });
  }

  const rowsWithCats = rows.map((r) => ({
    ...r,
    categories: catMap[r.productId] || [],
  }));

  return { rows: rowsWithCats, total };
};

// ─── GET /products/:id ───────────────────────────────────────────────────────

/**
 * Returns null when the product does not exist or is inactive.
 * Returns { product, categories, variantRows } — the service assembles the final shape.
 * variantRows is flat: one row per (variant × attribute). The service groups them.
 */
exports.getProductById = async (productId) => {
  const [products] = await pool.query(
    `SELECT product_id   AS productId,
            product_name AS productName,
            description,
            brand,
            image_url    AS imageUrl,
            is_active    AS isActive
       FROM product
      WHERE product_id = ? AND is_active = TRUE`,
    [productId]
  );
  if (products.length === 0) return null;

  const [cats] = await pool.query(
    `SELECT c.category_id   AS categoryId,
            c.category_name AS categoryName
       FROM product_category pc
       JOIN category c ON c.category_id = pc.category_id
      WHERE pc.product_id = ?`,
    [productId]
  );

  // Flat join: one row per variant-attribute combination.
  // LEFT JOIN so variants with no attributes still appear (attrName/attrValue = NULL).
  const [varRows] = await pool.query(
    `SELECT v.variant_id     AS variantId,
            v.product_id     AS productId,
            v.SKU            AS sku,
            v.price,
            v.stock_quantity AS stockQuantity,
            v.is_active      AS isActive,
            va.name          AS attrName,
            av.value         AS attrValue
       FROM variant v
       LEFT JOIN attribute_value    av ON av.variant_id  = v.variant_id
       LEFT JOIN variant_attribute  va ON va.attribute_id = av.attribute_id
      WHERE v.product_id = ?
      ORDER BY v.variant_id, va.name`,
    [productId]
  );

  return { product: products[0], categories: cats, variantRows: varRows };
};

// ─── GET /categories ─────────────────────────────────────────────────────────

/**
 * Returns all active categories as a flat array.
 * The service builds the nested tree in JavaScript.
 */
exports.getAllCategories = async () => {
  const [rows] = await pool.query(
    `SELECT category_id        AS categoryId,
            category_name      AS categoryName,
            parent_category_id AS parentCategoryId,
            is_active          AS isActive
       FROM category
      WHERE is_active = TRUE
      ORDER BY parent_category_id, category_id`
  );
  return rows;
};

// ─── Admin: products ─────────────────────────────────────────────────────────

exports.findProductById = async (productId) => {
  const [rows] = await pool.query(
    `SELECT product_id   AS productId,
            product_name AS productName,
            brand,
            description,
            image_url    AS imageUrl,
            is_active    AS isActive
       FROM product WHERE product_id = ?`,
    [productId]
  );
  return rows[0] || null;
};

/**
 * Inserts the product and its categories in one transaction.
 * Returns the new product_id.
 */
exports.createProduct = async ({ productName, brand, description, imageUrl, categoryIds }) => {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO product (product_name, brand, description, image_url, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [productName, brand || null, description || null, imageUrl || null]
    );
    const productId = res.insertId;
    for (const cid of (categoryIds || [])) {
      await conn.query(
        'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
        [productId, cid]
      );
    }
    return productId;
  });
};

/**
 * Updates only the fields that were provided.
 * Does NOT touch is_active — use deactivateProduct for that (REQ-10.1).
 */
exports.updateProduct = async (productId, fields) => {
  const colMap = {
    productName: 'product_name',
    brand:       'brand',
    description: 'description',
    imageUrl:    'image_url',
  };
  const setClauses = [];
  const vals = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      vals.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return; // nothing to update
  vals.push(productId);
  await pool.query(
    `UPDATE product SET ${setClauses.join(', ')} WHERE product_id = ?`,
    vals
  );
};

/**
 * Sets is_active = FALSE. Never deletes — order history must stay intact (REQ-10.1).
 * Returns affectedRows (0 = product not found).
 */
exports.deactivateProduct = async (productId) => {
  const [res] = await pool.query(
    'UPDATE product SET is_active = FALSE WHERE product_id = ?',
    [productId]
  );
  return res.affectedRows;
};

// ─── Admin: categories ───────────────────────────────────────────────────────

exports.findCategoryById = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT category_id        AS categoryId,
            category_name      AS categoryName,
            parent_category_id AS parentCategoryId,
            is_active          AS isActive
       FROM category WHERE category_id = ?`,
    [categoryId]
  );
  return rows[0] || null;
};

/**
 * How many active products belong to this category?
 * Used to block deactivation when products still reference it.
 */
exports.countActiveProductsInCategory = async (categoryId) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
       FROM product_category pc
       JOIN product p ON p.product_id = pc.product_id
      WHERE pc.category_id = ? AND p.is_active = TRUE`,
    [categoryId]
  );
  return rows[0].cnt;
};

exports.createCategory = async ({ categoryName, parentCategoryId }) => {
  const [res] = await pool.query(
    'INSERT INTO category (category_name, parent_category_id, is_active) VALUES (?, ?, TRUE)',
    [categoryName, parentCategoryId || null]
  );
  return res.insertId;
};

exports.updateCategory = async (categoryId, fields) => {
  const setClauses = [];
  const vals = [];
  if (fields.categoryName !== undefined) {
    setClauses.push('category_name = ?');
    vals.push(fields.categoryName);
  }
  if (fields.parentCategoryId !== undefined) {
    setClauses.push('parent_category_id = ?');
    vals.push(fields.parentCategoryId);
  }
  if (setClauses.length === 0) return;
  vals.push(categoryId);
  await pool.query(
    `UPDATE category SET ${setClauses.join(', ')} WHERE category_id = ?`,
    vals
  );
};

exports.deactivateCategory = async (categoryId) => {
  const [res] = await pool.query(
    'UPDATE category SET is_active = FALSE WHERE category_id = ?',
    [categoryId]
  );
  return res.affectedRows;
};

// ─── Admin: variants ─────────────────────────────────────────────────────────

exports.findVariantById = async (variantId) => {
  const [rows] = await pool.query(
    `SELECT variant_id     AS variantId,
            product_id     AS productId,
            SKU            AS sku,
            price,
            stock_quantity AS stockQuantity,
            is_active      AS isActive
       FROM variant WHERE variant_id = ?`,
    [variantId]
  );
  return rows[0] || null;
};

/**
 * Creates a variant and its attribute values in one transaction.
 * Attribute names are upserted into variant_attribute (UNIQUE name).
 * Returns the new variant_id.
 */
exports.createVariant = async ({ productId, sku, price, stockQuantity, attributes }) => {
  return withTransaction(async (conn) => {
    const [res] = await conn.query(
      `INSERT INTO variant (product_id, SKU, price, stock_quantity, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [productId, sku, price, stockQuantity ?? 0]
    );
    const variantId = res.insertId;
    for (const { name, value } of (attributes || [])) {
      // Upsert the attribute name so duplicate names share the same attribute_id.
      const [attrRes] = await conn.query(
        `INSERT INTO variant_attribute (name) VALUES (?)
         ON DUPLICATE KEY UPDATE attribute_id = LAST_INSERT_ID(attribute_id)`,
        [name]
      );
      await conn.query(
        'INSERT INTO attribute_value (attribute_id, variant_id, value) VALUES (?, ?, ?)',
        [attrRes.insertId, variantId, value]
      );
    }
    return variantId;
  });
};

/**
 * Updates only the fields provided.
 * Includes is_active so staff can deactivate a specific variant.
 */
exports.updateVariant = async (variantId, fields) => {
  const colMap = {
    sku:           'SKU',
    price:         'price',
    stockQuantity: 'stock_quantity',
    isActive:      'is_active',
  };
  const setClauses = [];
  const vals = [];
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = ?`);
      vals.push(fields[key]);
    }
  }
  if (setClauses.length === 0) return;
  vals.push(variantId);
  await pool.query(
    `UPDATE variant SET ${setClauses.join(', ')} WHERE variant_id = ?`,
    vals
  );
};