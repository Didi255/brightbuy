

/**
 * Seed: demo orders spread across quarters.             OWNER: M4
 *
 * The five reports need data to report on. Generate orders across all four
 * quarters of at least one year, across several customers and categories,
 * with a mix of payment statuses and delivery modes. Without this, M5 cannot
 * verify Report 1 or Report 3.
 */
module.exports = async function seed(pool) {
  // This seed is not row-level idempotent: orders have no natural unique key,
  // so there is nothing to INSERT IGNORE against. Instead, bail out entirely
  // if demo orders already exist. Re-seeding from scratch means a fresh
  // database (docker compose down -v), which is what the team does anyway.
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM orders');
  if (n > 0) {
    console.log(`  03_demo_orders: ${n} orders already present, skipping`);
    return;
  }


  const [cityRows] = await pool.query(`SELECT city_id,city_name FROM city`);
  const cityId = new Map(cityRows.map((c) => [c.city_name,c.city_id]));
  const [custRows] = await pool.query(
    `SELECT u.user_id, u.email
    FROM user u JOIN customer c ON c.user_id = u.user_id`
  );

  const customerId = new Map(custRows.map((u) => [u.email, u.user_id]));

  // addresses

  const DEMO_ADDRESSES = [
    // email,                          city,          house, street
    ['john.smith@brightbuy.com',       'Houston',     '12',  'Westheimer Rd'],
    ['emily.johnson@brightbuy.com',    'Dallas',      '48',  'Elm St'],
    ['michael.williams@brightbuy.com', 'Austin',      '7',   'Congress Ave'],
    ['daniel.miller@brightbuy.com',    'San Antonio', '33',  'Commerce St'],
    ['sarah.brown@brightbuy.com',      'Lubbock',     '221', 'Broadway'],
    ['david.jones@brightbuy.com',      'Waco',        '15',  'Austin Ave'],
    ['jessica.garcia@brightbuy.com',   'Plano',       '90',  'Legacy Dr'],
    ['ashley.davis@brightbuy.com',     'Amarillo',    '5',   'Polk St'],
  ];

  const addressIdFor = new Map();

  for (const [email,city,house,street] of DEMO_ADDRESSES){
    const customer = customerId.get(email);
    const city_ = cityId.get(city);
    if(!customer) throw new Error(`03_demo_orders : no customer ${email}`);
    if(!city_) throw new Error(`03_demo_orders : no city named ${city}`);

    const [res] = await pool.query(
      `INSERT INTO address(customer_id, city_id, house_num,address_1)
      VALUES(?,?,?,?)`,
      [customer,city_,house,street]);
      addressIdFor.set(email,{addressId: res.insertId, cityId:city_});
  }

  const [variantRows] = await pool.query(
    `SELECT v.variant_id,v.price,v.stock_quantity,
    c.category_id,c.category_name
    FROM variant v
    Join product p ON p.product_id = v.product_id
    JOIN product_category pc ON pc.product_id = p.product_id
    JOIN category c ON c.category_id = pc.category_id
    WHERE v.is_active = true
    ORDER BY v.variant_id`
  );

  const budget = new Map(variantRows.map((v) => [v.variant_id, v.stock_quantity]));

  const inStock = variantRows.filter((v) => v.stock_quantity > 0);
  const outOfStock = variantRows.filter((v) => v.stock_quantity === 0);

  const byCategory = new Map();

  for(const v of inStock){
    if(!byCategory.has(v.category_name)) byCategory.set(v.category_name,[]);
    byCategory.get(v.category_name).push(v);
  }


  const STORE_CITY_ID = Number(process.env.STORE_CITY_ID);
  if(!STORE_CITY_ID) throw new Error ('03_demo_orders: STORE_CITY_ID not set in .env');

  //place an order through the procedure

  async function placeOrder({email,lines, mode = 'standard' , paymentMethod = 'cod' }){
    const customer = customerId.get(email);
    if(!customer) throw new Error(`03_demo_orders: unknown customer ${email}`);

    const address = addressIdFor.get(email);
    if(mode === 'standard' && !address){
      throw new Error(`03_demo_orders: ${email} has no demo address for standard delivery`);
    }
    const addressId = mode ==='standard' ? address.addressId : null;
    const orderCityId = mode === 'standard' ? address.cityId    : STORE_CITY_ID;

    // 1. sp_place_order reads FROM cart_item, so every order needs a cart.
    const [cart] = await pool.query(
      `INSERT INTO cart (customer_id, cart_status) VALUES(?,'active')`,
      [customer]
    );

    // 2. the lines
    for(const {variantId,quantity} of lines){
      await pool.query(
        `INSERT INTO cart_item (cart_id,variant_id,quantity) VALUES (?,?,?)`,
        [cart.insertId,variantId,quantity]
      );
      const left = budget.get(variantId) ?? 0;
      budget.set(variantId, left >0 ? Math.max(0,left - quantity) : 0);

    }

    const conn = await pool.getConnection();
    try{
      await conn.query(' CALL sp_place_order(?,?,?,?,?,?,@oid,@st)',
        [customer, cart.insertId, mode, addressId, orderCityId, paymentMethod]
      )
      const [[out]] = await conn.query( 'SELECT @oid AS orderId ,@st as status');
      return out.orderId;
    }finally{
      conn.release();
    }


  }

  //move a freshly placed order back in time
  async function backdate(orderId,isoDate){
    const stamp = `${isoDate} 10:30:00`;
    await pool.query(
      `UPDATE delivery
      SET estimated_delivery_date = DATE_ADD(DATE(?), INTERVAL DATEDIFF(estimated_delivery_date,CURDATE()) DAY),
      status_updated_at = ?
      WHERE order_id =?`,
      [isoDate,stamp,orderId]
    )

    await pool.query(
      `UPDATE orders SET order_date = ? WHERE order_id =?`,
      [stamp,orderId]
    );

    await pool.query(
      `UPDATE payment SET created_at = ?, updated_at = ? WHERE order_id =?`,
      [stamp,stamp,orderId]
    );
  }


  // --- history: 60 orders across the four quarters of 2025 ---------------
    // --- history: 60 orders across the four quarters of 2025 ---------------
  const YEAR = 2025;
  const QUARTER_MONTHS = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
  const PER_QUARTER = 15;

  const BUYERS = DEMO_ADDRESSES.map(([email]) => email);

  // Deliberately uneven: repeats mean more orders for that customer, so
  // sp_report_customer_summary shows a spread instead of 8 identical rows.
  const BUYER_ROTATION = [
    BUYERS[0], BUYERS[0], BUYERS[0], BUYERS[1], BUYERS[1], BUYERS[2],
    BUYERS[2], BUYERS[3], BUYERS[4], BUYERS[5], BUYERS[6], BUYERS[7],
  ];

  const categories = [...byCategory.keys()];

  // First variant in `cat` that our ledger still has `qty` of.
  function pick(cat, qty) {
    for (const v of byCategory.get(cat) ?? []) {
      if ((budget.get(v.variant_id) ?? 0) >= qty) return v;
    }
    return null;
  }

  // sp_cancel_order only writes an audit row when the actor is staff.
  const [[staffRow]] = await pool.query('SELECT user_id FROM staff ORDER BY user_id LIMIT 1');
  const STAFF_ID = staffRow.user_id;

    let made = 0, cancelled = 0, seq = 0;

  for (const q of [1, 2, 3, 4]) {
    for (let i = 0; i < PER_QUARTER; i++) {
      const month = QUARTER_MONTHS[q][i % 3];
      const day   = 2 + ((i * 2) % 26);        // 2..26 - safe in February
      const date  = `${YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const lines = [];
      if (i % 5 === 0) {
        // Spans three categories: REQ-12.3 must count this order once in EACH.
        for (let k = 0; k < 3; k++) {
          const v = pick(categories[(seq + k) % categories.length], 1);
          if (v) lines.push({ variantId: v.variant_id, quantity: 1 });
        }
      } else if (i % 5 === 1) {
        // Two variants in ONE category: proves COUNT(DISTINCT o.order_id)
        // dedupes instead of counting this order twice.
        const cat = categories[seq % categories.length];
        const two = (byCategory.get(cat) ?? [])
          .filter((v) => (budget.get(v.variant_id) ?? 0) >= 1).slice(0, 2);
        for (const v of two) lines.push({ variantId: v.variant_id, quantity: 1 });
      } else {
        const qty = 1 + (i % 3);
        const v = pick(categories[(seq * 3) % categories.length], qty);
        if (v) lines.push({ variantId: v.variant_id, quantity: qty });
      }

      if (lines.length === 0) { seq++; continue; }   // ledger exhausted here

      const orderId = await placeOrder({
        email: BUYER_ROTATION[seq % BUYER_ROTATION.length],
        lines,
        mode: seq % 4 === 3 ? 'store_pickup' : 'standard',
        paymentMethod: seq % 3 === 0 ? 'card' : 'cod',
      });

      if (seq % 7 === 6) {
        // Every 7th is cancelled so the `order_status != 'Cancelled'` filter
        // in REQ-12.1 and REQ-12.3 is actually exercised. sp_cancel_order
        // restores stock itself; we do NOT credit the ledger back, so we can
        // only ever under-spend, never overdraw.
        await pool.query('CALL sp_cancel_order(?, ?)', [orderId, STAFF_ID]);
        cancelled++;
      } else {
        // History is finished business. Without this these would all show up
        // in sp_report_upcoming_deliveries, which filters on
        // delivery_status != 'delivered' and has NO date filter.
        await pool.query(
          `UPDATE orders SET order_status = 'DeliveredOrPicked' WHERE order_id = ?`, [orderId]);
        await pool.query(
          `UPDATE delivery SET delivery_status = 'delivered' WHERE order_id = ?`, [orderId]);
        // A delivered order was paid for - COD settles on handover.
        await pool.query(
          `UPDATE payment SET payment_status = 'Paid' WHERE order_id = ?`, [orderId]);
      }

      
      await backdate(orderId, date);

      made++;
      seq++;
    }
  }

  //undelivered orders
  const LIVE = [
    {email: BUYERS[0], oos:false,status: 'Placed'},
    { email: BUYERS[4], oos: false, status: 'Processing' },
    { email: BUYERS[1], oos: true,  status: 'Placed'     },
    { email: BUYERS[5], oos: true,  status: 'ReadyOrOut' }
  ]

  let live = 0;

  for (const [k,spec] of LIVE.entries()){
    const v = spec.oos ? outOfStock[k % outOfStock.length] : pick(categories[k% categories.length], 1);
    if(!v){console.log(`  03_demo_orders: live order ${k} skipped, no variant`); continue;}
  

  const orderId = await placeOrder({
    email : spec.email,
    lines: [{variantId: v.variant_id, quantity: 1}],
    mode: 'standard',
    paymentMethod: k % 2 === 0 ? 'cod' : 'card',
  });

  if(spec.status !== 'Placed'){
    await pool.query( 'UPDATE orders SET order_status = ? WHERE order_id = ?',
    [spec.status,orderId])
  }
  live++;
}

  console.log(`  03_demo_orders: ${live} live orders awaiting delivery`);





  

  
};
