/**
 * Seed: 40+ products, 10+ categories, variants.         OWNER: M2
 * REQ-10.6.
 *
 * The data is plain JS arrays at the top; the code at the bottom loops over
 * them and inserts. To add a product, add one line to PRODUCTS.
 *
 * Some variants have stock_quantity = 0 so the back-order path (REQ-6.6) and
 * the +3 day rule (REQ-7.2) can be demonstrated.
 */

// data as nodejs arrays 

// [category_name, parent_category_name | null]  — parents must come first
const CATEGORIES = [
  ['Electronics', null], //no parent for Electronics, so null
  ['Computers', 'Electronics'],
  ['Laptops', 'Computers'],
  ['Monitors', 'Computers'],
  ['Computer Accessories', 'Computers'],
  ['Phones', 'Electronics'],
  ['Audio', 'Electronics'],
  ['Home Appliances', null], //no parent for Home Appliances, so null
  ['Kitchen', 'Home Appliances'],
  ['Cleaning', 'Home Appliances'],
  ['Fashion', null], //no parent for Fashion, so null
  ['Footwear', 'Fashion'],
  ['Sports & Outdoors', null], //no parent for Sports & Outdoors, so null
];

// variant = [price, stock, { AttributeName: 'value' }]
const v = (price, stock, attrs = {}) => ({ price, stock, attrs });

// [product_name, brand, category_name, description, variants, is_active?]
const PRODUCTS = [
  // --- Laptops ---
  ['Dell Inspiron 15 Laptop', 'Dell', 'Laptops', '15.6" FHD laptop for everyday work and study.',
    [v(749.99, 12, { RAM: '8GB', Storage: '256GB' }), v(899.99, 7, { RAM: '16GB', Storage: '512GB' }), v(1049.99, 0, { RAM: '16GB', Storage: '1TB' })]],
  ['HP Pavilion 14 Laptop', 'HP', 'Laptops', 'Slim 14" laptop with long battery life.',
    [v(699.0, 15, { Colour: 'Silver', Storage: '256GB' }), v(799.0, 9, { Colour: 'Blue', Storage: '512GB' })]],
  ['Lenovo IdeaPad Slim 3 Laptop', 'Lenovo', 'Laptops', 'Budget-friendly 15.6" laptop.',
    [v(549.0, 20, { RAM: '8GB', Storage: '256GB' }), v(649.0, 0, { RAM: '16GB', Storage: '512GB' })]],
  ['ASUS VivoBook 15 Laptop', 'ASUS', 'Laptops', 'Light 15" laptop with a fast SSD.',
    [v(599.0, 11, { Colour: 'Grey' }), v(679.0, 5, { Colour: 'Blue' })]],
  ['Apple MacBook Air 13 Laptop', 'Apple', 'Laptops', 'Thin and light laptop with all-day battery.',
    [v(1099.0, 6, { Colour: 'Space Grey', Storage: '256GB' }), v(1299.0, 4, { Colour: 'Silver', Storage: '512GB' }), v(1499.0, 0, { Colour: 'Midnight', Storage: '1TB' })]],
  ['Acer Aspire 5 Laptop', 'Acer', 'Laptops', 'Reliable all-rounder with a 15.6" display.',
    [v(629.99, 14, { RAM: '8GB' }), v(729.99, 8, { RAM: '16GB' })]],

  // --- Monitors ---
  ['Dell 24 Full HD Monitor', 'Dell', 'Monitors', '24" IPS monitor with thin bezels.',
    [v(139.99, 25, { Size: '24 inch' })]],
  ['LG UltraGear 27 Gaming Monitor', 'LG', 'Monitors', '27" 144Hz gaming monitor.',
    [v(279.0, 10, { Size: '27 inch' }), v(329.0, 0, { Size: '27 inch', Colour: 'Black' })]],
  ['Samsung Odyssey 32 Curved Monitor', 'Samsung', 'Monitors', '32" curved QHD display.',
    [v(349.0, 6, { Size: '32 inch' })]],

  // --- Computer accessories ---
  ['Logitech MX Master 3S Mouse', 'Logitech', 'Computer Accessories', 'Quiet wireless mouse for productivity.',
    [v(99.99, 30, { Colour: 'Graphite' }), v(99.99, 18, { Colour: 'Pale Grey' })]],
  ['Keychron K2 Wireless Keyboard', 'Keychron', 'Computer Accessories', 'Compact mechanical keyboard.',
    [v(89.0, 16, { Colour: 'Grey' })]],
  ['Anker 7-in-1 USB-C Hub', 'Anker', 'Computer Accessories', 'HDMI, USB-A, SD and USB-C power pass-through.',
    [v(45.99, 40)]],
  ['SanDisk Extreme Portable SSD', 'SanDisk', 'Computer Accessories', 'Fast, rugged external SSD.',
    [v(89.99, 22, { Storage: '500GB' }), v(149.99, 13, { Storage: '1TB' }), v(249.99, 0, { Storage: '2TB' })]],

  // --- Phones ---
  ['Samsung Galaxy S24 Phone', 'Samsung', 'Phones', 'Flagship Android phone with a bright 6.2" display.',
    [v(799.0, 15, { Colour: 'Black', Storage: '128GB' }), v(899.0, 8, { Colour: 'Violet', Storage: '256GB' })]],
  ['Apple iPhone 15 Phone', 'Apple', 'Phones', 'iPhone with USB-C and a 48MP camera.',
    [v(799.0, 20, { Colour: 'Blue', Storage: '128GB' }), v(899.0, 10, { Colour: 'Pink', Storage: '256GB' }), v(1099.0, 0, { Colour: 'Black', Storage: '512GB' })]],
  ['Xiaomi Redmi Note 13 Phone', 'Xiaomi', 'Phones', 'Great-value phone with a 108MP camera.',
    [v(229.0, 35, { Colour: 'Midnight Black', Storage: '128GB' }), v(269.0, 20, { Colour: 'Ocean Blue', Storage: '256GB' })]],
  ['Google Pixel 8 Phone', 'Google', 'Phones', 'Clean Android with an excellent camera.',
    [v(699.0, 9, { Colour: 'Obsidian', Storage: '128GB' })]],
  ['Nokia G42 Phone', 'Nokia', 'Phones', 'Repairable phone with a 3-year update promise.',
    [v(199.0, 0, { Colour: 'Grey', Storage: '128GB' })]],

  // --- Audio ---
  ['Sony WH-1000XM5 Headphones', 'Sony', 'Audio', 'Noise-cancelling wireless headphones.',
    [v(349.99, 14, { Colour: 'Black' }), v(349.99, 6, { Colour: 'Silver' })]],
  ['JBL Flip 6 Bluetooth Speaker', 'JBL', 'Audio', 'Waterproof portable speaker.',
    [v(119.95, 28, { Colour: 'Blue' }), v(119.95, 0, { Colour: 'Red' })]],
  ['Apple AirPods Pro Earbuds', 'Apple', 'Audio', 'Active noise cancelling earbuds.',
    [v(249.0, 25)]],
  ['Anker Soundcore Q30 Headphones', 'Anker', 'Audio', 'Affordable noise-cancelling headphones.',
    [v(79.99, 32, { Colour: 'Black' })]],

  // --- Kitchen ---
  ['Philips Air Fryer XL', 'Philips', 'Kitchen', 'Cook with up to 90% less oil.',
    [v(149.99, 17, { Capacity: '4.1L' }), v(189.99, 9, { Capacity: '6.2L' })]],
  ['Russell Hobbs Electric Kettle', 'Russell Hobbs', 'Kitchen', 'Fast-boil 1.7L kettle.',
    [v(34.99, 45)]],
  ['NutriBullet Pro Blender', 'NutriBullet', 'Kitchen', 'High-speed personal blender.',
    [v(79.99, 20, { Colour: 'Grey' })]],
  ['Panasonic Microwave Oven', 'Panasonic', 'Kitchen', 'Inverter microwave with auto-cook menus.',
    [v(129.0, 8, { Capacity: '23L' }), v(169.0, 0, { Capacity: '27L' })]],
  ['Tefal Non-stick Frying Pan', 'Tefal', 'Kitchen', '28cm non-stick pan with heat indicator.',
    [v(29.99, 50, { Size: '28cm' })]],

  // --- Cleaning ---
  ['Dyson V8 Cordless Vacuum', 'Dyson', 'Cleaning', 'Cordless stick vacuum for the whole home.',
    [v(399.0, 7)]],
  ['Xiaomi Robot Vacuum S10', 'Xiaomi', 'Cleaning', 'Robot vacuum and mop with app control.',
    [v(279.0, 12, { Colour: 'White' })]],
  ['Philips Steam Iron 2400W', 'Philips', 'Cleaning', 'Ceramic soleplate steam iron.',
    [v(44.99, 26)]],

  // --- Footwear ---
  ['Nike Air Max 270 Shoes', 'Nike', 'Footwear', 'Cushioned everyday sneakers.',
    [v(150.0, 18, { Size: '42', Colour: 'White' }), v(150.0, 11, { Size: '44', Colour: 'Black' }), v(150.0, 0, { Size: '46', Colour: 'Black' })]],
  ['Adidas Ultraboost Running Shoes', 'Adidas', 'Footwear', 'Responsive running shoes.',
    [v(180.0, 13, { Size: '41', Colour: 'Grey' }), v(180.0, 9, { Size: '43', Colour: 'Grey' })]],
  ['Puma Velocity Nitro Shoes', 'Puma', 'Footwear', 'Lightweight road running shoes.',
    [v(120.0, 15, { Size: '42' }), v(120.0, 10, { Size: '44' })]],
  ['Skechers Go Walk Shoes', 'Skechers', 'Footwear', 'Slip-on walking shoes.',
    [v(75.0, 22, { Size: '40' }), v(75.0, 0, { Size: '42' })]],
  ['Converse Chuck Taylor Sneakers', 'Converse', 'Footwear', 'Classic canvas high-tops.',
    [v(65.0, 30, { Size: '41', Colour: 'Black' }), v(65.0, 25, { Size: '43', Colour: 'White' })]],

  // --- Fashion ---
  ["Levi's 501 Original Jeans", "Levi's", 'Fashion', 'Straight-fit classic jeans.',
    [v(89.5, 20, { Size: '32', Colour: 'Indigo' }), v(89.5, 14, { Size: '34', Colour: 'Indigo' })]],
  ['Uniqlo Supima Cotton T-Shirt', 'Uniqlo', 'Fashion', 'Soft everyday crew-neck tee.',
    [v(14.9, 60, { Size: 'M', Colour: 'White' }), v(14.9, 45, { Size: 'L', Colour: 'Navy' })]],
  ['Columbia Rain Jacket', 'Columbia', 'Fashion', 'Waterproof, breathable shell.',
    [v(110.0, 9, { Size: 'M', Colour: 'Green' }), v(110.0, 0, { Size: 'L', Colour: 'Green' })]],
  ['Casio F-91W Digital Watch', 'Casio', 'Fashion', 'Iconic lightweight digital watch.',
    [v(19.95, 70)]],

  // --- Sports & Outdoors ---
  ['Yonex Astrox Badminton Racket', 'Yonex', 'Sports & Outdoors', 'Head-heavy racket for powerful smashes.',
    [v(129.0, 10)]],
  ['Wilson Evolution Basketball', 'Wilson', 'Sports & Outdoors', 'Indoor game ball, size 7.',
    [v(64.99, 16)]],
  ['Decathlon Yoga Mat', 'Decathlon', 'Sports & Outdoors', '8mm non-slip mat.',
    [v(19.99, 40, { Colour: 'Purple' }), v(19.99, 0, { Colour: 'Teal' })]],
  ['Adidas Tiro Football', 'Adidas', 'Sports & Outdoors', 'Durable training football, size 5.',
    [v(24.99, 33)]],

  // One inactive product, so you can verify it never shows up in /products.
  ['Discontinued Test Laptop', 'Dell', 'Laptops', 'Inactive on purpose — must NOT appear in search.',
    [v(99.0, 5)], false],
];

// putting data to the database

const slug = (s) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8);
const placeholderImage = (name) =>
  `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;

module.exports = async function seed(pool) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM product');
  if (n > 0) {
    console.log('  02_catalogue: products already exist, skipping');
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    
    const categoryId = {}; //store the generated category_id for each category name
    for (const [name, parent] of CATEGORIES) {
      const [res] = await conn.query( // await need because we need to finish one insertion before next
        'INSERT INTO category (category_name, parent_category_id) VALUES (?, ?)',
        [name, parent ? categoryId[parent] : null] //if parent exists, get its id from categoryId, else null
        //  condition ? value if true      : value if false
      );

      categoryId[name] = res.insertId; //My sql's auto generated ID
    }




    // 2. attribute names (Colour, Size, ...), each created once
    const attributeNames = new Set();
    PRODUCTS.forEach(([, , , , variants]) =>
      variants.forEach((x) => Object.keys(x.attrs).forEach((a) => attributeNames.add(a))));
    const attributeId = {};
    for (const name of attributeNames) {
      const [res] = await conn.query('INSERT INTO variant_attribute (name) VALUES (?)', [name]);
      attributeId[name] = res.insertId;
    }





    // 3. products -> product_category -> variants -> attribute values
    let productCount = 0;
    let variantCount = 0;
    for (const [i, [name, brand, category, description, variants, isActive = true]] of PRODUCTS.entries()) {
      const [p] = await conn.query(
        `INSERT INTO product (product_name, description, image_url, brand, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, placeholderImage(name), brand, isActive]
      );
      await conn.query(
        'INSERT INTO product_category (product_id, category_id) VALUES (?, ?)',
        [p.insertId, categoryId[category]]
      );




      for (const [j, variant] of variants.entries()) {
        const sku = `${slug(brand)}-${String(i + 1).padStart(3, '0')}-${j + 1}`;
        const [vr] = await conn.query(
          `INSERT INTO variant (product_id, SKU, price, stock_quantity, is_active)
           VALUES (?, ?, ?, ?, TRUE)`,
          [p.insertId, sku, variant.price, variant.stock]
        );
        for (const [attr, value] of Object.entries(variant.attrs)) {
          await conn.query(
            'INSERT INTO attribute_value (attribute_id, variant_id, value) VALUES (?, ?, ?)',
            [attributeId[attr], vr.insertId, value]
          );
        }
        variantCount++;
      }

      
      productCount++;
    }

    await conn.commit();
    console.log(`  02_catalogue: ${CATEGORIES.length} categories, ${productCount} products, ${variantCount} variants`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release(); //return the connection to pool
  }
};



///////// This data is inserted in order that the parents data has been inserted before the children data. This is important because the parent category must exist before a child category can reference it.