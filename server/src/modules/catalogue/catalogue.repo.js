// catalogue slice — OWNER: M2
// TODO(M2): SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');

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
function buildFilter({ keyword, brand, categoryId, minPrice, maxPrice }) {
  const where = ['p.is_active = TRUE'];
  const having = [];
  const cteParams = [];
  const whereParams = [];
  const havingParams = [];
  let cte = '';
 
  if (keyword) {
    const pattern = `%${escapeLike(keyword)}%`;
    where.push('(p.product_name LIKE ? OR p.brand LIKE ?)');
    whereParams.push(pattern, pattern);
  }
 
  if (brand) {
    where.push('p.brand = ?');
    whereParams.push(brand);
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
 
exports.searchProducts = async (filters) => {
  const { cte, core, params } = buildFilter(filters);
 
  const rowsSql = `${cte}
    SELECT p.product_id, p.product_name, p.brand, p.image_url,
           MIN(v.price) AS price_from,
           MAX(v.price) AS price_to,
           SUM(v.stock_quantity) AS total_stock
    ${core}
    ORDER BY p.product_name, p.product_id
    LIMIT ? OFFSET ?`;
 
  const countSql = `${cte}
    SELECT COUNT(*) AS total FROM (SELECT p.product_id ${core}) AS matched`;
 
  const [[rows], [countRows]] = await Promise.all([
    pool.query(rowsSql, [...params, filters.limit, filters.offset]),
    pool.query(countSql, params),
  ]);
 
  return { rows, total: countRows[0].total };
};