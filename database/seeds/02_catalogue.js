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
  ['Dell Inspiron 15 Laptop', 'Dell', 'Laptops', 'A 15.6-inch everyday laptop with a full-size keyboard and number pad. Suits students and office work where the machine mostly stays on a desk. The 8GB model handles a browser and Office comfortably; take the 16GB if you keep thirty tabs open.',
    [v(231990.00, 12, { RAM: '8GB', Storage: '256GB' }), v(278990.00, 7, { RAM: '16GB', Storage: '512GB' }), v(324990.00, 0, { RAM: '16GB', Storage: '1TB' })]],
  ['HP Pavilion 14 Laptop', 'HP', 'Laptops', 'A 14-inch machine built around battery life rather than raw speed. Good for anyone who works away from a socket most of the day. Light enough at 1.4kg to carry between lectures without noticing it.',
    [v(216990.00, 15, { Colour: 'Silver', Storage: '256GB' }), v(247990.00, 9, { Colour: 'Blue', Storage: '512GB' })]],
  ['Lenovo IdeaPad Slim 3 Laptop', 'Lenovo', 'Laptops', 'The cheapest way into a full-size Windows laptop that is not painful to use. Aimed at first-year students and households that need one shared machine. 256GB fills up fast, so plan on cloud storage or take the 512GB.',
    [v(169990.00, 20, { RAM: '8GB', Storage: '256GB' }), v(200990.00, 0, { RAM: '16GB', Storage: '512GB' })]],
  ['ASUS VivoBook 15 Laptop', 'ASUS', 'Laptops', 'A 15-inch laptop with an SSD fast enough that it never feels like it is waiting for you. Suits anyone replacing an older hard-drive machine. Boots in under ten seconds from cold.',
    [v(185990.00, 11, { Colour: 'Grey' }), v(209990.00, 5, { Colour: 'Blue' })]],
  ['Apple MacBook Air 13 Laptop', 'Apple', 'Laptops', 'Fanless, silent, and it runs all day on a charge. The obvious choice if you already use an iPhone and want things to connect without thinking about it. The 256GB base is tight once photos pile up.',
    [v(340990.00, 6, { Colour: 'Space Grey', Storage: '256GB' }), v(402990.00, 4, { Colour: 'Silver', Storage: '512GB' }), v(464990.00, 0, { Colour: 'Midnight', Storage: '1TB' })]],
  ['Acer Aspire 5 Laptop', 'Acer', 'Laptops', 'A 15.6-inch all-rounder that does not try to be clever. Good for a household wanting one dependable machine for homework and bills. The RAM is upgradeable, which most laptops at this price no longer allow.',
    [v(194990.00, 14, { RAM: '8GB' }), v(225990.00, 8, { RAM: '16GB' })]],

  // --- Monitors ---
  ['Dell 24 Full HD Monitor', 'Dell', 'Monitors', 'A 24-inch IPS panel with thin bezels, so two sit side by side without a wide gap down the middle. Suits a desk where colour accuracy matters more than refresh rate. Tilts and swivels on the included stand.',
    [v(43490.00, 25, { Size: '24 inch' })]],
  ['LG UltraGear 27 Gaming Monitor', 'LG', 'Monitors', '27 inches at 144Hz, which is the difference you actually notice in fast games. For anyone whose graphics card is already outrunning a 60Hz screen. One DisplayPort and two HDMI inputs.',
    [v(85990.00, 10, { Size: '27 inch' }), v(101990.00, 0, { Size: '27 inch', Colour: 'Black' })]],
  ['Samsung Odyssey 32 Curved Monitor', 'Samsung', 'Monitors', 'A 32-inch curved QHD panel that wraps far enough to fill your peripheral vision. Good for spreadsheets and flight sims alike. The 1000R curve is tight enough to matter at desk distance.',
    [v(107990.00, 6, { Size: '32 inch' })]],

  // --- Computer accessories ---
  ['Logitech MX Master 3S Mouse', 'Logitech', 'Computer Accessories', 'A shaped mouse for people who use one eight hours a day. The quiet switches are the point: almost silent clicks. The side scroll wheel earns its keep in spreadsheets once you get used to it.',
    [v(30990.00, 30, { Colour: 'Graphite' }), v(30990.00, 18, { Colour: 'Pale Grey' })]],
  ['Keychron K2 Wireless Keyboard', 'Keychron', 'Computer Accessories', 'A compact mechanical keyboard that keeps the arrow keys, which most compacts drop. Suits a desk short on space. Switches between three devices over Bluetooth with a key combination.',
    [v(27490.00, 16, { Colour: 'Grey' })]],
  ['Anker 7-in-1 USB-C Hub', 'Anker', 'Computer Accessories', 'Turns one USB-C port into HDMI, three USB-A, SD and microSD, plus power pass-through. For a laptop that has run out of ports. Delivers 85W back to the machine while everything else is plugged in.',
    [v(14490.00, 40)]],
  ['SanDisk Extreme Portable SSD', 'SanDisk', 'Computer Accessories', 'A pocket SSD that survives being dropped and rained on. For moving large files between machines or keeping a backup off-site. Around 1000MB/s, so a 50GB transfer takes about a minute.',
    [v(27990.00, 22, { Storage: '500GB' }), v(46490.00, 13, { Storage: '1TB' }), v(76990.00, 0, { Storage: '2TB' })]],

  // --- Phones ---
  ['Samsung Galaxy S24 Phone', 'Samsung', 'Phones', 'A 6.2-inch flagship small enough to use one-handed, which most flagships are not. Suits anyone who wants top-end cameras without a tablet in their pocket. Seven years of Android updates.',
    [v(247990.00, 15, { Colour: 'Black', Storage: '128GB' }), v(278990.00, 8, { Colour: 'Violet', Storage: '256GB' })]],
  ['Apple iPhone 15 Phone', 'Apple', 'Phones', 'The first iPhone to use USB-C, so it charges from the same cable as everything else. For anyone upgrading from an older iPhone and keeping their photo library. The 48MP main camera crops to 2x without losing detail.',
    [v(247990.00, 20, { Colour: 'Blue', Storage: '128GB' }), v(278990.00, 10, { Colour: 'Pink', Storage: '256GB' }), v(340990.00, 0, { Colour: 'Black', Storage: '512GB' })]],
  ['Xiaomi Redmi Note 13 Phone', 'Xiaomi', 'Phones', 'A 108MP camera and a large battery at about a third of flagship money. Good as a first smartphone or a reliable second one. Charges to half in roughly twenty minutes.',
    [v(70990.00, 35, { Colour: 'Midnight Black', Storage: '128GB' }), v(82990.00, 20, { Colour: 'Ocean Blue', Storage: '256GB' })]],
  ['Google Pixel 8 Phone', 'Google', 'Phones', 'Clean Android with no duplicate apps, and the best point-and-shoot camera at this price. Suits anyone who wants photos to come out right without editing them. Gets Android updates the day they are released.',
    [v(216990.00, 9, { Colour: 'Obsidian', Storage: '128GB' })]],
  ['Nokia G42 Phone', 'Nokia', 'Phones', 'Built to be repaired: the back comes off, and the battery and screen are user-replaceable. For anyone tired of replacing a phone every two years. Three years of guaranteed security updates.',
    [v(61990.00, 0, { Colour: 'Grey', Storage: '128GB' })]],

  // --- Audio ---
  ['Sony WH-1000XM5 Headphones', 'Sony', 'Audio', 'The noise cancelling is strong enough to make an aeroplane cabin quiet. For long flights and open-plan offices. Thirty hours a charge, and three minutes of charging gives three hours.',
    [v(107990.00, 14, { Colour: 'Black' }), v(107990.00, 6, { Colour: 'Silver' })]],
  ['JBL Flip 6 Bluetooth Speaker', 'JBL', 'Audio', 'A rugged portable speaker that is genuinely waterproof, not merely splash-resistant. For the beach, the kitchen or the bathroom. Twelve hours a charge at sensible volume.',
    [v(36990.00, 28, { Colour: 'Blue' }), v(36990.00, 0, { Colour: 'Red' })]],
  ['Apple AirPods Pro Earbuds', 'Apple', 'Audio', 'Active noise cancelling in something that fits in a coin pocket. Best if you are already on an iPhone, where pairing is instant. Transparency mode is clear enough to hold a conversation without taking them out.',
    [v(76990.00, 25)]],
  ['Anker Soundcore Q30 Headphones', 'Anker', 'Audio', 'Noise cancelling at a fraction of the usual price, with most of the effect. Good for commuting and study. Forty hours a charge, roughly a week of daily use.',
    [v(24990.00, 32, { Colour: 'Black' })]],

  // --- Kitchen ---
  ['Philips Air Fryer XL', 'Philips', 'Kitchen', 'Cooks chips and chicken with a tablespoon of oil instead of a pan of it. Suits a household of three or four. The 4.1L basket does about 800g at a time; take the 6.2L for a family of five.',
    [v(46490.00, 17, { Capacity: '4.1L' }), v(58990.00, 9, { Capacity: '6.2L' })]],
  ['Russell Hobbs Electric Kettle', 'Russell Hobbs', 'Kitchen', 'Boils 1.7 litres in about three minutes. A straightforward kettle with a removable limescale filter, which matters on Colombo water. The lid opens one-handed.',
    [v(10990.00, 45)]],
  ['NutriBullet Pro Blender', 'NutriBullet', 'Kitchen', 'A high-speed blender that genuinely breaks down ice, nuts and frozen fruit rather than stirring them around. For smoothies and soups. The cup doubles as a travel bottle, so there is one less thing to wash.',
    [v(24990.00, 20, { Colour: 'Grey' })]],
  ['Panasonic Microwave Oven', 'Panasonic', 'Kitchen', 'Inverter heating, so defrosting does not cook the edges while the middle stays frozen. The 23L cavity fits a dinner plate comfortably. Auto-cook settings for rice and reheating.',
    [v(39990.00, 8, { Capacity: '23L' }), v(51990.00, 0, { Capacity: '27L' })]],
  ['Tefal Non-stick Frying Pan', 'Tefal', 'Kitchen', 'A 28cm pan with a heat indicator in the base that turns solid red when it is ready, so you stop adding food to a cold pan. Oven-safe to 175C and dishwasher-safe.',
    [v(9490.00, 50, { Size: '28cm' })]],

  // --- Cleaning ---
  ['Dyson V8 Cordless Vacuum', 'Dyson', 'Cleaning', 'A cordless stick vacuum with enough suction to replace a plug-in one in a small house. Converts to a handheld for the car and the stairs. Forty minutes a charge on the standard head.',
    [v(123990.00, 7)]],
  ['Xiaomi Robot Vacuum S10', 'Xiaomi', 'Cleaning', 'Vacuums and mops in one pass, and maps the house so it cleans in lines rather than at random. For keeping floors tidy between proper cleans. Set no-go zones in the app around the pet bowls.',
    [v(85990.00, 12, { Colour: 'White' })]],
  ['Philips Steam Iron 2400W', 'Philips', 'Cleaning', 'A ceramic soleplate that glides rather than catching on cotton. 2400W reaches steam temperature in about thirty seconds. The vertical setting works on hanging shirts and curtains.',
    [v(13990.00, 26)]],

  // --- Footwear ---
  ['Nike Air Max 270 Shoes', 'Nike', 'Footwear', 'A tall Air unit in the heel makes these comfortable for a full day standing. Everyday shoes rather than running shoes. They run about half a size small, so size up if you are between sizes.',
    [v(46490.00, 18, { Size: '42', Colour: 'White' }), v(46490.00, 11, { Size: '44', Colour: 'Black' }), v(46490.00, 0, { Size: '46', Colour: 'Black' })]],
  ['Adidas Ultraboost Running Shoes', 'Adidas', 'Footwear', 'Springy foam that returns energy, which you feel most on longer runs. For road running from 5km upwards. Heavier than a racing shoe, so these are for training rather than race day.',
    [v(55990.00, 13, { Size: '41', Colour: 'Grey' }), v(55990.00, 9, { Size: '43', Colour: 'Grey' })]],
  ['Puma Velocity Nitro Shoes', 'Puma', 'Footwear', 'A light road shoe at around 260g, with enough cushioning for daily miles. Suits a neutral runner doing three or four sessions a week. The grip holds on wet tarmac.',
    [v(36990.00, 15, { Size: '42' }), v(36990.00, 10, { Size: '44' })]],
  ['Skechers Go Walk Shoes', 'Skechers', 'Footwear', 'Slip-on walking shoes with no laces, which matters if bending down is awkward. For long days on your feet and for travel. Machine washable.',
    [v(22990.00, 22, { Size: '40' }), v(22990.00, 0, { Size: '42' })]],
  ['Converse Chuck Taylor Sneakers', 'Converse', 'Footwear', 'The canvas high-top that has barely changed since 1917. Flat sole, no cushioning, so these are a style choice rather than a comfort one. They soften after a couple of weeks of wear.',
    [v(19990.00, 30, { Size: '41', Colour: 'Black' }), v(19990.00, 25, { Size: '43', Colour: 'White' })]],

  // --- Fashion ---
  ["Levi's 501 Original Jeans", "Levi's", 'Fashion', 'The straight-leg original, cut to sit at the waist rather than the hip. Suits anyone who finds slim-fit jeans restrictive. Rigid denim that shapes to you after a few wears.',
    [v(27490.00, 20, { Size: '32', Colour: 'Indigo' }), v(27490.00, 14, { Size: '34', Colour: 'Indigo' })]],
  ['Uniqlo Supima Cotton T-Shirt', 'Uniqlo', 'Fashion', 'Long-staple cotton, so it holds its shape through repeated washing instead of going shapeless. A plain crew-neck for layering or wearing alone. Pre-shrunk.',
    [v(4490.00, 60, { Size: 'M', Colour: 'White' }), v(4490.00, 45, { Size: 'L', Colour: 'Navy' })]],
  ['Columbia Rain Jacket', 'Columbia', 'Fashion', 'A waterproof shell that still breathes, so you are not wet from the inside after twenty minutes. For the monsoon commute and for hill walking. Packs into its own pocket.',
    [v(33990.00, 9, { Size: 'M', Colour: 'Green' }), v(33990.00, 0, { Size: 'L', Colour: 'Green' })]],
  ['Casio F-91W Digital Watch', 'Casio', 'Fashion', 'The digital watch that has outlived most of its competitors. At 21g you forget it is on your wrist. The battery lasts about seven years.',
    [v(5990.00, 70)]],

  // --- Sports & Outdoors ---
  ['Yonex Astrox Badminton Racket', 'Yonex', 'Sports & Outdoors', 'Head-heavy balance, which puts weight behind a smash at the cost of a slower defence. For attacking singles players. Strung at 24lbs as standard.',
    [v(39990.00, 10)]],
  ['Wilson Evolution Basketball', 'Wilson', 'Sports & Outdoors', 'The indoor game ball most school leagues use, with a tacky composite cover that grips in dry hands. Size 7, official size. Not for outdoor courts, where the cover wears quickly.',
    [v(19990.00, 16)]],
  ['Decathlon Yoga Mat', 'Decathlon', 'Sports & Outdoors', '8mm of padding, thicker than most, which makes kneeling poses bearable on a tiled floor. For home practice rather than carrying to a studio. Non-slip on both faces.',
    [v(5990.00, 40, { Colour: 'Purple' }), v(5990.00, 0, { Colour: 'Teal' })]],
  ['Adidas Tiro Football', 'Adidas', 'Sports & Outdoors', 'A size 5 training ball built for repeated use on hard ground rather than match day. For school and club training. Machine-stitched, so it holds pressure longer than a cheaper glued ball.',
    [v(7490.00, 33)]],

  // One inactive product, so you can verify it never shows up in /products.
  ['Discontinued Test Laptop', 'Dell', 'Laptops', 'No longer stocked. Retained in the catalogue so inactive products can be verified as hidden from search.',
    [v(30490.00, 5)], false],
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
  "Columbia Rain Jacket": "/product-images/columbia-rain-jacket.jpeg",
  "Decathlon Yoga Mat": "/product-images/decathlon-yoga-mat.jpeg",
  "Dell 24 Full HD Monitor": "/product-images/dell-24-full-hd-monitor.jpeg",
  "Dell Inspiron 15 Laptop": "/product-images/dell-inspiron-15-laptop.jpg",
  "Google Pixel 8 Phone": "/product-images/google-pixel-8-phone.jpg",
  "HP Pavilion 14 Laptop": "/product-images/hp-pavilion-14-laptop.png",
  "JBL Flip 6 Bluetooth Speaker": "/product-images/jbl-flip-6-bluetooth-speaker.webp",
  "Keychron K2 Wireless Keyboard": "/product-images/keychron-k2-wireless-keyboard.webp",
  "Lenovo IdeaPad Slim 3 Laptop": "/product-images/lenovo-ideapad-slim-3-laptop.webp",
  "Levi's 501 Original Jeans": "/product-images/levi-s-501-original-jeans.jpeg",
  "Nike Air Max 270 Shoes": "/product-images/nike-air-max-270-shoes.avif",
  "NutriBullet Pro Blender": "/product-images/nutribullet-pro-blender.avif",
  "Puma Velocity Nitro Shoes": "/product-images/puma-velocity-nitro-shoes.jpeg",
  "Samsung Galaxy S24 Phone": "/product-images/samsung-galaxy-s24-phone.webp",
  "Samsung Odyssey 32 Curved Monitor": "/product-images/samsung-odyssey-32-curved-monitor.jpg",
  "Xiaomi Redmi Note 13 Phone": "/product-images/xiaomi-redmi-note-13-phone.webp",
  "Yonex Astrox Badminton Racket": "/product-images/yonex-astrox-badminton-racket.jpeg",
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