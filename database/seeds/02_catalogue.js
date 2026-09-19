/**
 * Seed: 40+ products, 10+ categories, variants.         OWNER: M2
 * REQ-10.6. This is the largest seed — start it in week 2, not week 6.
 *
 * Tip: define the data as a plain JS array of objects and loop the inserts,
 * rather than writing 40 hand-typed INSERT statements. Easier to extend and
 * far easier to review.
 *
 * Make sure some variants have stock_quantity = 0 so the back-order path
 * (REQ-6.6) and the +3 day rule (REQ-7.2) can be demonstrated.
 */



module.exports = async function seed(pool) {
  // 1. Bulk Insert 10 Categories
  await pool.query(`
    INSERT INTO category (category_id, category_name, is_active) VALUES
    (1, 'Electronics', TRUE),
    (2, 'Apparel', TRUE),
    (3, 'Home & Kitchen', TRUE),
    (4, 'Books', TRUE),
    (5, 'Sports', TRUE),
    (6, 'Beauty', TRUE),
    (7, 'Toys', TRUE),
    (8, 'Automotive', TRUE),
    (9, 'Garden', TRUE),
    (10, 'Office Supplies', TRUE);
  `);

  // 2. Bulk Insert 40 Products
  await pool.query(`
    INSERT INTO product (product_id, product_name, product_description, image_url, brand, is_active) VALUES
    (1, 'Sample Product 1', 'High quality item description for product 1', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (2, 'Sample Product 2', 'High quality item description for product 2', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (3, 'Sample Product 3', 'High quality item description for product 3', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (4, 'Sample Product 4', 'High quality item description for product 4', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (5, 'Sample Product 5', 'High quality item description for product 5', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (6, 'Sample Product 6', 'High quality item description for product 6', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (7, 'Sample Product 7', 'High quality item description for product 7', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (8, 'Sample Product 8', 'High quality item description for product 8', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (9, 'Sample Product 9', 'High quality item description for product 9', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (10, 'Sample Product 10', 'High quality item description for product 10', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (11, 'Sample Product 11', 'High quality item description for product 11', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (12, 'Sample Product 12', 'High quality item description for product 12', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (13, 'Sample Product 13', 'High quality item description for product 13', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (14, 'Sample Product 14', 'High quality item description for product 14', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (15, 'Sample Product 15', 'High quality item description for product 15', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (16, 'Sample Product 16', 'High quality item description for product 16', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (17, 'Sample Product 17', 'High quality item description for product 17', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (18, 'Sample Product 18', 'High quality item description for product 18', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (19, 'Sample Product 19', 'High quality item description for product 19', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (20, 'Sample Product 20', 'High quality item description for product 20', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (21, 'Sample Product 21', 'High quality item description for product 21', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (22, 'Sample Product 22', 'High quality item description for product 22', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (23, 'Sample Product 23', 'High quality item description for product 23', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (24, 'Sample Product 24', 'High quality item description for product 24', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (25, 'Sample Product 25', 'High quality item description for product 25', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (26, 'Sample Product 26', 'High quality item description for product 26', 'https://www.ebay.com/ ', 'StyleLab', TRUE),
    (27, 'Sample Product 27', 'High quality item description for product 27', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (28, 'Sample Product 28', 'High quality item description for product 28', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (29, 'Sample Product 29', 'High quality item description for product 29', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (30, 'Sample Product 30', 'High quality item description for product 30', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (31, 'Sample Product 31', 'High quality item description for product 31', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (32, 'Sample Product 32', 'High quality item description for product 32', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (33, 'Sample Product 33', 'High quality item description for product 33', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (34, 'Sample Product 34', 'High quality item description for product 34', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (35, 'Sample Product 35', 'High quality item description for product 35', 'https://www.ebay.com/', 'TechCorp', TRUE),
    (36, 'Sample Product 36', 'High quality item description for product 36', 'https://www.ebay.com/', 'StyleLab', TRUE),
    (37, 'Sample Product 37', 'High quality item description for product 37', 'https://www.ebay.com/', 'HomeBasic', TRUE),
    (38, 'Sample Product 38', 'High quality item description for product 38', 'https://www.ebay.com/', 'ReadMore', TRUE),
    (39, 'Sample Product 39', 'High quality item description for product 39', 'https://www.ebay.com/', 'ActiveGear', TRUE),
    (40, 'Sample Product 40', 'High quality item description for product 40', 'https://www.ebay.com/', 'TechCorp', TRUE);
  `);

  // 3. Bulk Insert Product-Category Links
  await pool.query(`
    INSERT INTO product_category (product_id, category_id) VALUES
    (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10), (10, 1),
    (11, 2), (12, 3), (13, 4), (14, 5), (15, 6), (16, 7), (17, 8), (18, 9), (19, 10), (20, 1),
    (21, 2), (22, 3), (23, 4), (24, 5), (25, 6), (26, 7), (27, 8), (28, 9), (29, 10), (30, 1),
    (31, 2), (32, 3), (33, 4), (34, 5), (35, 6), (36, 7), (37, 8), (38, 9), (39, 10), (40, 1);
  `);

  // 4. Bulk Insert Variants (Includes 0 stock items for back-order REQ-6.6)
  await pool.query(`
    INSERT INTO variant (product_id, SKU, price, stock_quantity, is_active) VALUES
    (1, 'SKU-PROD-1-A', 20.50, 25, TRUE),
    (1, 'SKU-PROD-1-B', 24.60, 50, TRUE),
    (2, 'SKU-PROD-2-A', 26.00, 25, TRUE),
    (2, 'SKU-PROD-2-B', 31.20, 50, TRUE),
    (3, 'SKU-PROD-3-A', 31.50, 25, TRUE),
    (3, 'SKU-PROD-3-B', 37.80, 50, TRUE),
    (4, 'SKU-PROD-4-A', 37.00, 0, TRUE),
    (4, 'SKU-PROD-4-B', 44.40, 50, TRUE),
    (5, 'SKU-PROD-5-A', 42.50, 25, TRUE),
    (5, 'SKU-PROD-5-B', 51.00, 0, TRUE),
    (6, 'SKU-PROD-6-A', 48.00, 25, TRUE),
    (6, 'SKU-PROD-6-B', 57.60, 50, TRUE),
    (7, 'SKU-PROD-7-A', 53.50, 25, TRUE),
    (7, 'SKU-PROD-7-B', 64.20, 50, TRUE),
    (8, 'SKU-PROD-8-A', 59.00, 0, TRUE),
    (8, 'SKU-PROD-8-B', 70.80, 50, TRUE),
    (9, 'SKU-PROD-9-A', 64.50, 25, TRUE),
    (9, 'SKU-PROD-9-B', 77.40, 50, TRUE),
    (10, 'SKU-PROD-10-A', 70.00, 25, TRUE),
    (10, 'SKU-PROD-10-B', 84.00, 0, TRUE),
    (11, 'SKU-PROD-11-A', 75.50, 25, TRUE),
    (11, 'SKU-PROD-11-B', 90.60, 50, TRUE),
    (12, 'SKU-PROD-12-A', 81.00, 0, TRUE),
    (12, 'SKU-PROD-12-B', 97.20, 50, TRUE),
    (13, 'SKU-PROD-13-A', 86.50, 25, TRUE),
    (13, 'SKU-PROD-13-B', 103.80, 50, TRUE),
    (14, 'SKU-PROD-14-A', 92.00, 25, TRUE),
    (14, 'SKU-PROD-14-B', 110.40, 50, TRUE),
    (15, 'SKU-PROD-15-A', 97.50, 25, TRUE),
    (15, 'SKU-PROD-15-B', 117.00, 0, TRUE),
    (16, 'SKU-PROD-16-A', 103.00, 0, TRUE),
    (16, 'SKU-PROD-16-B', 123.60, 50, TRUE),
    (17, 'SKU-PROD-17-A', 108.50, 25, TRUE),
    (17, 'SKU-PROD-17-B', 130.20, 50, TRUE),
    (18, 'SKU-PROD-18-A', 114.00, 25, TRUE),
    (18, 'SKU-PROD-18-B', 136.80, 50, TRUE),
    (19, 'SKU-PROD-19-A', 119.50, 25, TRUE),
    (19, 'SKU-PROD-19-B', 143.40, 50, TRUE),
    (20, 'SKU-PROD-20-A', 125.00, 0, TRUE),
    (20, 'SKU-PROD-20-B', 150.00, 0, TRUE),
    (21, 'SKU-PROD-21-A', 130.50, 25, TRUE),
    (21, 'SKU-PROD-21-B', 156.60, 50, TRUE),
    (22, 'SKU-PROD-22-A', 136.00, 25, TRUE),
    (22, 'SKU-PROD-22-B', 163.20, 50, TRUE),
    (23, 'SKU-PROD-23-A', 141.50, 25, TRUE),
    (23, 'SKU-PROD-23-B', 169.80, 50, TRUE),
    (24, 'SKU-PROD-24-A', 147.00, 0, TRUE),
    (24, 'SKU-PROD-24-B', 176.40, 50, TRUE),
    (25, 'SKU-PROD-25-A', 152.50, 25, TRUE),
    (25, 'SKU-PROD-25-B', 183.00, 0, TRUE),
    (26, 'SKU-PROD-26-A', 158.00, 25, TRUE),
    (26, 'SKU-PROD-26-B', 189.60, 50, TRUE),
    (27, 'SKU-PROD-27-A', 163.50, 25, TRUE),
    (27, 'SKU-PROD-27-B', 196.20, 50, TRUE),
    (28, 'SKU-PROD-28-A', 169.00, 0, TRUE),
    (28, 'SKU-PROD-28-B', 202.80, 50, TRUE),
    (29, 'SKU-PROD-29-A', 174.50, 25, TRUE),
    (29, 'SKU-PROD-29-B', 209.40, 50, TRUE),
    (30, 'SKU-PROD-30-A', 180.00, 25, TRUE),
    (30, 'SKU-PROD-30-B', 216.00, 0, TRUE),
    (31, 'SKU-PROD-31-A', 185.50, 25, TRUE),
    (31, 'SKU-PROD-31-B', 222.60, 50, TRUE),
    (32, 'SKU-PROD-32-A', 191.00, 0, TRUE),
    (32, 'SKU-PROD-32-B', 229.20, 50, TRUE),
    (33, 'SKU-PROD-33-A', 196.50, 25, TRUE),
    (33, 'SKU-PROD-33-B', 235.80, 50, TRUE),
    (34, 'SKU-PROD-34-A', 202.00, 25, TRUE),
    (34, 'SKU-PROD-34-B', 242.40, 50, TRUE),
    (35, 'SKU-PROD-35-A', 207.50, 25, TRUE),
    (35, 'SKU-PROD-35-B', 249.00, 0, TRUE),
    (36, 'SKU-PROD-36-A', 213.00, 0, TRUE),
    (36, 'SKU-PROD-36-B', 255.60, 50, TRUE),
    (37, 'SKU-PROD-37-A', 218.50, 25, TRUE),
    (37, 'SKU-PROD-37-B', 262.20, 50, TRUE),
    (38, 'SKU-PROD-38-A', 224.00, 25, TRUE),
    (38, 'SKU-PROD-38-B', 268.80, 50, TRUE),
    (39, 'SKU-PROD-39-A', 229.50, 25, TRUE),
    (39, 'SKU-PROD-39-B', 275.40, 50, TRUE),
    (40, 'SKU-PROD-40-A', 235.00, 0, TRUE),
    (40, 'SKU-PROD-40-B', 282.00, 0, TRUE);
  `);
};
