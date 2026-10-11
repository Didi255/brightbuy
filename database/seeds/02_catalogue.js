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
  // Consumer electronics is the business (project brief); Home Appliances
  // are the electrical goods such a chain also carries, and Toys is named
  // in the brief's own example catalogue.
  ['Electronics', null],
  ['Computers', 'Electronics'],
  ['Laptops', 'Computers'],
  ['Monitors', 'Computers'],
  ['Computer Accessories', 'Computers'],
  ['Phones', 'Electronics'],
  ['Audio', 'Electronics'],
  ['Gaming', 'Electronics'],
  ['Wearables', 'Electronics'],
  ['Home Appliances', null],
  ['Kitchen', 'Home Appliances'],
  ['Cleaning', 'Home Appliances'],
  ['Toys', null],
];

// variant = [price, stock, { AttributeName: 'value' }]
const v = (price, stock, attrs = {}) => ({ price, stock, attrs });

// [product_name, brand, category_name, description, variants, is_active?]
const PRODUCTS = [
  // --- Laptops ---
  ['Dell Inspiron 15 Laptop', 'Dell', 'Laptops', 'A 15.6-inch everyday laptop with a full-size keyboard and number pad. Suits students and office work where the machine mostly stays on a desk. The 8GB model handles a browser and Office comfortably; take the 16GB if you keep thirty tabs open.',
    [v(749.99, 12, { RAM: '8GB', Storage: '256GB' }), v(899.99, 7, { RAM: '16GB', Storage: '512GB' }), v(1049.99, 0, { RAM: '16GB', Storage: '1TB' })]],
  ['HP Pavilion 14 Laptop', 'HP', 'Laptops', 'A 14-inch machine built around battery life rather than raw speed. Good for anyone who works away from a socket most of the day. Light enough at 1.4kg to carry between lectures without noticing it.',
    [v(699.0, 15, { Colour: 'Silver', Storage: '256GB' }), v(799.0, 9, { Colour: 'Blue', Storage: '512GB' })]],
  ['Lenovo IdeaPad Slim 3 Laptop', 'Lenovo', 'Laptops', 'The cheapest way into a full-size Windows laptop that is not painful to use. Aimed at first-year students and households that need one shared machine. 256GB fills up fast, so plan on cloud storage or take the 512GB.',
    [v(549.0, 20, { RAM: '8GB', Storage: '256GB' }), v(649.0, 0, { RAM: '16GB', Storage: '512GB' })]],
  ['ASUS VivoBook 15 Laptop', 'ASUS', 'Laptops', 'A 15-inch laptop with an SSD fast enough that it never feels like it is waiting for you. Suits anyone replacing an older hard-drive machine. Boots in under ten seconds from cold.',
    [v(599.0, 11, { Colour: 'Grey' }), v(679.0, 5, { Colour: 'Blue' })]],
  ['Apple MacBook Air 13 Laptop', 'Apple', 'Laptops', 'Fanless, silent, and it runs all day on a charge. The obvious choice if you already use an iPhone and want things to connect without thinking about it. The 256GB base is tight once photos pile up.',
    [v(1099.0, 6, { Colour: 'Space Grey', Storage: '256GB' }), v(1299.0, 4, { Colour: 'Silver', Storage: '512GB' }), v(1499.0, 0, { Colour: 'Midnight', Storage: '1TB' })]],
  ['Acer Aspire 5 Laptop', 'Acer', 'Laptops', 'A 15.6-inch all-rounder that does not try to be clever. Good for a household wanting one dependable machine for homework and bills. The RAM is upgradeable, which most laptops at this price no longer allow.',
    [v(629.99, 14, { RAM: '8GB' }), v(729.99, 8, { RAM: '16GB' })]],

  // --- Monitors ---
  ['Dell 24 Full HD Monitor', 'Dell', 'Monitors', 'A 24-inch IPS panel with thin bezels, so two sit side by side without a wide gap down the middle. Suits a desk where colour accuracy matters more than refresh rate. Tilts and swivels on the included stand.',
    [v(139.99, 25, { Size: '24 inch' })]],
  ['LG UltraGear 27 Gaming Monitor', 'LG', 'Monitors', '27 inches at 144Hz, which is the difference you actually notice in fast games. For anyone whose graphics card is already outrunning a 60Hz screen. One DisplayPort and two HDMI inputs.',
    [v(279.0, 10, { Size: '27 inch' }), v(329.0, 0, { Size: '27 inch', Colour: 'Black' })]],
  ['Samsung Odyssey 32 Curved Monitor', 'Samsung', 'Monitors', 'A 32-inch curved QHD panel that wraps far enough to fill your peripheral vision. Good for spreadsheets and flight sims alike. The 1000R curve is tight enough to matter at desk distance.',
    [v(349.0, 6, { Size: '32 inch' })]],

  // --- Computer accessories ---
  ['Logitech MX Master 3S Mouse', 'Logitech', 'Computer Accessories', 'A shaped mouse for people who use one eight hours a day. The quiet switches are the point: almost silent clicks. The side scroll wheel earns its keep in spreadsheets once you get used to it.',
    [v(99.99, 30, { Colour: 'Graphite' }), v(99.99, 18, { Colour: 'Pale Grey' })]],
  ['Keychron K2 Wireless Keyboard', 'Keychron', 'Computer Accessories', 'A compact mechanical keyboard that keeps the arrow keys, which most compacts drop. Suits a desk short on space. Switches between three devices over Bluetooth with a key combination.',
    [v(89.0, 16, { Colour: 'Grey' })]],
  ['Anker 7-in-1 USB-C Hub', 'Anker', 'Computer Accessories', 'Turns one USB-C port into HDMI, three USB-A, SD and microSD, plus power pass-through. For a laptop that has run out of ports. Delivers 85W back to the machine while everything else is plugged in.',
    [v(45.99, 40)]],
  ['SanDisk Extreme Portable SSD', 'SanDisk', 'Computer Accessories', 'A pocket SSD that survives being dropped and rained on. For moving large files between machines or keeping a backup off-site. Around 1000MB/s, so a 50GB transfer takes about a minute.',
    [v(89.99, 22, { Storage: '500GB' }), v(149.99, 13, { Storage: '1TB' }), v(249.99, 0, { Storage: '2TB' })]],

  // --- Phones ---
  ['Samsung Galaxy S24 Phone', 'Samsung', 'Phones', 'A 6.2-inch flagship small enough to use one-handed, which most flagships are not. Suits anyone who wants top-end cameras without a tablet in their pocket. Seven years of Android updates.',
    [v(799.0, 15, { Colour: 'Black', Storage: '128GB' }), v(899.0, 8, { Colour: 'Violet', Storage: '256GB' })]],
  ['Apple iPhone 15 Phone', 'Apple', 'Phones', 'The first iPhone to use USB-C, so it charges from the same cable as everything else. For anyone upgrading from an older iPhone and keeping their photo library. The 48MP main camera crops to 2x without losing detail.',
    [v(799.0, 20, { Colour: 'Blue', Storage: '128GB' }), v(899.0, 10, { Colour: 'Pink', Storage: '256GB' }), v(1099.0, 0, { Colour: 'Black', Storage: '512GB' })]],
  ['Xiaomi Redmi Note 13 Phone', 'Xiaomi', 'Phones', 'A 108MP camera and a large battery at about a third of flagship money. Good as a first smartphone or a reliable second one. Charges to half in roughly twenty minutes.',
    [v(229.0, 35, { Colour: 'Midnight Black', Storage: '128GB' }), v(269.0, 20, { Colour: 'Ocean Blue', Storage: '256GB' })]],
  ['Google Pixel 8 Phone', 'Google', 'Phones', 'Clean Android with no duplicate apps, and the best point-and-shoot camera at this price. Suits anyone who wants photos to come out right without editing them. Gets Android updates the day they are released.',
    [v(699.0, 9, { Colour: 'Obsidian', Storage: '128GB' })]],
  ['Nokia G42 Phone', 'Nokia', 'Phones', 'Built to be repaired: the back comes off, and the battery and screen are user-replaceable. For anyone tired of replacing a phone every two years. Three years of guaranteed security updates.',
    [v(199.0, 0, { Colour: 'Grey', Storage: '128GB' })]],

  // --- Audio ---
  ['Sony WH-1000XM5 Headphones', 'Sony', 'Audio', 'The noise cancelling is strong enough to make an aeroplane cabin quiet. For long flights and open-plan offices. Thirty hours a charge, and three minutes of charging gives three hours.',
    [v(349.99, 14, { Colour: 'Black' }), v(349.99, 6, { Colour: 'Silver' })]],
  ['JBL Flip 6 Bluetooth Speaker', 'JBL', 'Audio', 'A rugged portable speaker that is genuinely waterproof, not merely splash-resistant. For the beach, the kitchen or the bathroom. Twelve hours a charge at sensible volume.',
    [v(119.95, 28, { Colour: 'Blue' }), v(119.95, 0, { Colour: 'Red' })]],
  ['Apple AirPods Pro Earbuds', 'Apple', 'Audio', 'Active noise cancelling in something that fits in a coin pocket. Best if you are already on an iPhone, where pairing is instant. Transparency mode is clear enough to hold a conversation without taking them out.',
    [v(249.0, 25)]],
  ['Anker Soundcore Q30 Headphones', 'Anker', 'Audio', 'Noise cancelling at a fraction of the usual price, with most of the effect. Good for commuting and study. Forty hours a charge, roughly a week of daily use.',
    [v(79.99, 32, { Colour: 'Black' })]],

  // --- Kitchen ---
  ['Philips Air Fryer XL', 'Philips', 'Kitchen', 'Cooks chips and chicken with a tablespoon of oil instead of a pan of it. Suits a household of three or four. The 4.1L basket does about 800g at a time; take the 6.2L for a family of five.',
    [v(149.99, 17, { Capacity: '4.1L' }), v(189.99, 9, { Capacity: '6.2L' })]],
  ['Russell Hobbs Electric Kettle', 'Russell Hobbs', 'Kitchen', 'Boils 1.7 litres in about three minutes. A straightforward kettle with a removable limescale filter, which matters on Colombo water. The lid opens one-handed.',
    [v(34.99, 45)]],
  ['NutriBullet Pro Blender', 'NutriBullet', 'Kitchen', 'A high-speed blender that genuinely breaks down ice, nuts and frozen fruit rather than stirring them around. For smoothies and soups. The cup doubles as a travel bottle, so there is one less thing to wash.',
    [v(79.99, 20, { Colour: 'Grey' })]],
  ['Panasonic Microwave Oven', 'Panasonic', 'Kitchen', 'Inverter heating, so defrosting does not cook the edges while the middle stays frozen. The 23L cavity fits a dinner plate comfortably. Auto-cook settings for rice and reheating.',
    [v(129.0, 8, { Capacity: '23L' }), v(169.0, 0, { Capacity: '27L' })]],

  // --- Cleaning ---
  ['Dyson V8 Cordless Vacuum', 'Dyson', 'Cleaning', 'A cordless stick vacuum with enough suction to replace a plug-in one in a small house. Converts to a handheld for the car and the stairs. Forty minutes a charge on the standard head.',
    [v(399.0, 7)]],
  ['Xiaomi Robot Vacuum S10', 'Xiaomi', 'Cleaning', 'Vacuums and mops in one pass, and maps the house so it cleans in lines rather than at random. For keeping floors tidy between proper cleans. Set no-go zones in the app around the pet bowls.',
    [v(279.0, 12, { Colour: 'White' })]],
  ['Philips Steam Iron 2400W', 'Philips', 'Cleaning', 'A ceramic soleplate that glides rather than catching on cotton. 2400W reaches steam temperature in about thirty seconds. The vertical setting works on hanging shirts and curtains.',
    [v(44.99, 26)]],

  // --- Footwear ---

  // --- Fashion ---
  ['Casio F-91W Digital Watch', 'Casio', 'Wearables', 'The digital watch that has outlived most of its competitors. At 21g you forget it is on your wrist. The battery lasts about seven years.',
    [v(19.95, 70)]],

  // --- Sports & Outdoors ---

  // One inactive product, so you can verify it never shows up in /products.
  ['Discontinued Test Laptop', 'Dell', 'Laptops', 'No longer stocked. Retained in the catalogue so inactive products can be verified as hidden from search.',
    [v(99.0, 5)], false],

  // ── Gaming ────────────────────────────────────────────────────────
  ['Xbox Wireless Controller', 'Microsoft', 'Gaming', 'The controller most PC games assume you are holding, so it works without configuring anything. Pairs over Bluetooth to a console, a PC or a phone. Takes AA batteries, which is either a convenience or an annoyance depending on your view.',
    [v(59.99, 22, { Colour: 'Carbon Black' }), v(64.99, 14, { Colour: 'Robot White' })]],
  ['PlayStation DualSense Controller', 'Sony', 'Gaming', 'Adaptive triggers that stiffen in response to what is happening on screen, which sounds like a gimmick until a game uses it well. Works on PC over USB. Battery life is shorter than the Xbox pad.',
    [v(69.99, 16, { Colour: 'White' }), v(74.99, 0, { Colour: 'Midnight Black' })]],
  ['Logitech G502 HERO Gaming Mouse', 'Logitech', 'Gaming', 'Eleven buttons and an adjustable weight system, aimed at people who play games where a spare thumb button matters. Heavy by modern standards. The sensor is the reliable part and has not needed replacing in years.',
    [v(49.99, 18, {})]],
  ['Razer BlackShark V2 Gaming Headset', 'Razer', 'Gaming', 'A wired headset with a detachable microphone, chosen for positional audio rather than bass. Light enough for a long session. Wired means no battery and no pairing, which is the point.',
    [v(99.99, 9, { Colour: 'Black' })]],

  // ── Wearables ─────────────────────────────────────────────────────
  ['Apple Watch SE', 'Apple', 'Wearables', 'The sensible Apple Watch: it tracks workouts, takes calls and shows notifications without the price of the flagship. Needs an iPhone. Battery lasts a day, so it charges while you shower.',
    [v(249.0, 11, { Size: '40mm', Colour: 'Midnight' }), v(279.0, 7, { Size: '44mm', Colour: 'Starlight' })]],
  ['Samsung Galaxy Fit3 Tracker', 'Samsung', 'Wearables', 'A fitness band rather than a watch, which is why it runs about two weeks between charges. Tracks steps, sleep and heart rate. Good for anyone who wants the data without a second screen on their wrist.',
    [v(59.0, 25, { Colour: 'Grey' }), v(59.0, 13, { Colour: 'Pink Gold' })]],
  ['Xiaomi Smart Band 8', 'Xiaomi', 'Wearables', 'The cheapest band worth owning. Two-week battery, a bright AMOLED strip, and it survives swimming. The app is the weak part, but the hardware is hard to argue with at the price.',
    [v(39.99, 30, { Colour: 'Black' })]],

  // ── Toys ──────────────────────────────────────────────────────────
  ['LEGO Classic Creative Brick Box', 'LEGO', 'Toys', 'Nine hundred pieces in thirty-three colours with no instructions, which is the whole idea. Suits ages four and up and, in practice, whoever else is in the room. Compatible with every other LEGO set you already own.',
    [v(34.99, 20, { Size: '900 pieces' }), v(59.99, 8, { Size: '1500 pieces' })]],
  ['Rubik\'s Speed Cube 3x3', 'Rubik\'s', 'Toys', 'The modern version turns far more smoothly than the cube you remember, which matters once you are timing yourself. Comes pre-lubricated and tensioned. A solved cube is roughly twenty moves away from any position.',
    [v(14.99, 40, {})]],
  ['Nerf Elite 2.0 Commander Blaster', 'Nerf', 'Toys', 'Six darts, a thirty-foot range and nothing electronic to break. Ages eight and up. Buy the refill pack at the same time, because the darts end up under the sofa within a week.',
    [v(19.99, 24, {})]],
  ['Hot Wheels 20-Car Gift Pack', 'Hot Wheels', 'Toys', 'Twenty die-cast cars at 1:64, which is the size that fits the orange track. A reliable present for a five-year-old. The assortment varies, so duplicates happen.',
    [v(24.99, 18, {})]],
  ['Sharper Image RC Stunt Car', 'Sharper Image', 'Toys', 'A remote-control car that drives on two wheels and flips itself upright when it lands wrong. Rechargeable over USB, about twenty minutes a charge. Ages six and up, and loud on a hard floor.',
    [v(44.99, 12, { Colour: 'Blue' }), v(44.99, 0, { Colour: 'Red' })]],
];

// putting data to the database

const slug = (s) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 8);
/* Real product photography, where we have it. Sourced per product, so the
   file extension varies (.jpg/.jpeg/.webp/.avif/.png) and cannot be derived
   from the name — hence an explicit map rather than a slug rule.

   Products NOT listed here fall through to the generated line-art mockup,
   which uses the slug rule below. Replace an entry here as real photography
   arrives; nothing else needs to change. */
const REAL_PHOTOS = {
  "ASUS VivoBook 15 Laptop": "/product-images/asus-vivobook-15-laptop.avif",
  "Acer Aspire 5 Laptop": "/product-images/acer-aspire-5-laptop.jpg",
  "Apple MacBook Air 13 Laptop": "/product-images/apple-macbook-air-13-laptop.jpg",
  "Apple iPhone 15 Phone": "/product-images/apple-iphone-15-phone.webp",
  "Casio F-91W Digital Watch": "/product-images/casio-f-91w-digital-watch.jpeg",
  "Dell 24 Full HD Monitor": "/product-images/dell-24-full-hd-monitor.jpeg",
  "Dell Inspiron 15 Laptop": "/product-images/dell-inspiron-15-laptop.jpg",
  "Google Pixel 8 Phone": "/product-images/google-pixel-8-phone.jpg",
  "HP Pavilion 14 Laptop": "/product-images/hp-pavilion-14-laptop.png",
  "JBL Flip 6 Bluetooth Speaker": "/product-images/jbl-flip-6-bluetooth-speaker.webp",
  "Keychron K2 Wireless Keyboard": "/product-images/keychron-k2-wireless-keyboard.webp",
  "Lenovo IdeaPad Slim 3 Laptop": "/product-images/lenovo-ideapad-slim-3-laptop.webp",
  "NutriBullet Pro Blender": "/product-images/nutribullet-pro-blender.avif",
  "Samsung Galaxy S24 Phone": "/product-images/samsung-galaxy-s24-phone.webp",
  "Samsung Odyssey 32 Curved Monitor": "/product-images/samsung-odyssey-32-curved-monitor.jpg",
  "Xiaomi Redmi Note 13 Phone": "/product-images/xiaomi-redmi-note-13-phone.webp",
};

/* Product art lives in client/public/product-images/ and is served by Vite
   at /product-images/<slug>.jpg. The pack ships with its own manifest.csv;
   the slug is the product name lowercased with every run of non-alphanumeric
   characters collapsed to one hyphen, so:

     "Anker 7-in-1 USB-C Hub"  -> anker-7-in-1-usb-c-hub.jpg
     "Levi's 501 Original Jeans" -> levi-s-501-original-jeans.jpg

   Verified against manifest.csv: 44 rows, 44 files, zero mismatches.

   A relative path, not an absolute URL: the art ships with the client, so it
   works offline and on any host without a config change.

   NOT /products/<slug>.jpg — that sits under the SPA's own /products route
   and makes the URL ambiguous. */
const placeholderImage = (name) =>
  REAL_PHOTOS[name] ||
  `/product-images/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`;

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