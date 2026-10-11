/**
 * Seed: 40+ products, 10+ categories, variants.         OWNER: M2
 * REQ-10.6.
 *
 * Two parts:
 *   1. CATEGORIES (below) — one shared list. Everyone's products point at these
 *      by name, so if you need a new category, add it HERE and tell the group.
 *   2. PRODUCTS — every file in database/seeds/products/ exports an array of
 *      products (see products/b.js for the format). This file loads them all,
 *      in file-name order, and inserts everything in one transaction.
 *
 * Re-running is safe: if the product table already has rows, the seed does
 * nothing. To reload from scratch, reset the database first (db-reset) and
 * run migrate + seed again.
 */
const fs = require('fs');
const path = require('path');

// ---- CATEGORIES -----------------------------------------------------------

// [category_name, parent_category_name | null]  — parents must come first
const CATEGORIES = [
  ['Electronics', null],
  ['Computers', 'Electronics'],
  ['Laptops', 'Computers'],
  ['Monitors', 'Computers'],
  ['Computer Accessories', 'Computers'],
  ['Phones', 'Electronics'],
  ['Audio', 'Electronics'],
  ['Home Appliances', null],
  ['Kitchen', 'Home Appliances'],
  ['Cleaning', 'Home Appliances'],
  ['Fashion', null],
  ['Footwear', 'Fashion'],
  ['Sports & Outdoors', null],
];

// ---- LOADING THE PRODUCT FILES --------------------------------------------

const PRODUCTS_DIR = path.join(__dirname, 'products');

const slug = (s) => String(s || 'GEN').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8) || 'GEN';
const placeholderImage = (name) => `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;

/** Reads every products/*.js file and checks each product, with a clear error message. */
function loadProducts() {
  const files = fs.readdirSync(PRODUCTS_DIR).filter((f) => f.endsWith('.js')).sort();
  const categoryNames = new Set(CATEGORIES.map(([name]) => name));
  const products = [];

  for (const file of files) {
    const list = require(path.join(PRODUCTS_DIR, file));
    if (!Array.isArray(list)) throw new Error(`products/${file} must export an array of products`);
    const fileTag = path.basename(file, '.js').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

    list.forEach((p, i) => {
      const where = `products/${file}, product #${i + 1} (${p && p.name})`;
      if (!p || typeof p.name !== 'string' || !p.name.trim()) throw new Error(`${where}: name is required`);

      const categories = [].concat(p.category || []);
      if (categories.length === 0) throw new Error(`${where}: category is required`);
      for (const c of categories) {
        if (!categoryNames.has(c)) {
          throw new Error(`${where}: unknown category "${c}". Use one of: ${[...categoryNames].join(', ')}`);
        }
      }

      if (!Array.isArray(p.variants) || p.variants.length === 0) {
        throw new Error(`${where}: needs at least one variant`);
      }
      for (const v of p.variants) {
        if (!(Number(v.price) > 0)) throw new Error(`${where}: variant price must be greater than 0`);
        if (!Number.isInteger(v.stock) || v.stock < 0) throw new Error(`${where}: variant stock must be 0 or more`);
      }

      products.push({ ...p, categories, fileTag, index: i + 1 });
    });
  }
  return products;
}

// ---- THE SEED -------------------------------------------------------------

module.exports = async function seed(pool) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM product');
  if (n > 0) {
    console.log('  02_catalogue: products already exist, skipping');
    return;
  }

  const products = loadProducts(); // validate everything before touching the database

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. categories (parents first, remembering each generated id)
    const categoryId = {};
    for (const [name, parent] of CATEGORIES) {
      const [res] = await conn.query(
        'INSERT INTO category (category_name, parent_category_id) VALUES (?, ?)',
        [name, parent ? categoryId[parent] : null]
      );
      categoryId[name] = res.insertId;
    }

    // 2. attribute names (Colour, Size, ...), each created once
    const attributeNames = new Set();
    for (const p of products) {
      for (const v of p.variants) Object.keys(v.attrs || {}).forEach((a) => attributeNames.add(a));
    }
    const attributeId = {};
    for (const name of attributeNames) {
      const [res] = await conn.query('INSERT INTO variant_attribute (name) VALUES (?)', [name]);
      attributeId[name] = res.insertId;
    }

    // 3. products -> product_category -> variants -> attribute values
    let variantCount = 0;
    for (const p of products) {
      const [pr] = await conn.query(
        `INSERT INTO product (product_name, description, image_url, brand, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [p.name, p.description || null, p.imageUrl || placeholderImage(p.name), p.brand || null, p.isActive !== false]
      );
      for (const c of p.categories) {
        await conn.query(
          'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
          [pr.insertId, categoryId[c]]
        );
      }

      for (const [j, variant] of p.variants.entries()) {
        // e.g. DELL-B3-2: brand, file tag + product number, variant number — unique across files
        const sku = variant.sku || `${slug(p.brand)}-${p.fileTag}${p.index}-${j + 1}`;
        const [vr] = await conn.query(
          `INSERT INTO variant (product_id, SKU, price, stock_quantity, is_active)
           VALUES (?, ?, ?, ?, TRUE)`,
          [pr.insertId, sku, variant.price, variant.stock]
        );
        for (const [attr, value] of Object.entries(variant.attrs || {})) {
          await conn.query(
            'INSERT INTO attribute_value (attribute_id, variant_id, value) VALUES (?, ?, ?)',
            [attributeId[attr], vr.insertId, value]
          );
        }
        variantCount++;
      }
    }

    await conn.commit();
    console.log(`  02_catalogue: ${CATEGORIES.length} categories, ${products.length} products, ${variantCount} variants`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};