/**
 * Concurrency harness — OWNER: M4, evidence for REQ-6.1..6.3.
 *
 * Sets one variant to exactly 1 unit of stock, fires N simultaneous checkouts
 * at it, and asserts that exactly ONE order line gets out_of_stock_flag = 0
 * while the rest are back-ordered, and that stock lands at 0 and never below.
 *
 * Note: all N checkouts SUCCEED. sp_place_order does not reject a shortfall,
 * it back-orders it (DECISIONS #21). The contention is resolved inside the
 * procedure by SELECT ... FOR UPDATE ordered by variant_id, so the question
 * is not who errors, it is who gets the unit.
 *
 * If more than one line has out_of_stock_flag = 0, the FOR UPDATE is missing
 * or the transaction boundary is wrong. If stock goes negative, the trigger
 * and CHECK have both been bypassed. This is the single most convincing
 * artifact in the final report — screenshot the passing run.
 *
 * Run: npm run test:concurrency
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

const VARIANT_ID = 1;
const ATTEMPTS = 20;


const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: ATTEMPTS,          // the shared pool caps at 10
});


(async () => {
    // --- fixture ---------------------------------------------------------
  await pool.query(
    `UPDATE variant SET stock_quantity = 1 WHERE variant_id = ?`, [VARIANT_ID]);

    // Seeded customers have no addresses - only registration creates one - so the
  // harness checks out as store pickup: no address needed, and the city comes
  // from STORE_CITY_ID (DECISIONS #23). This test is about stock contention,
  // not delivery modes.
  const [[who]] = await pool.query(`SELECT user_id FROM customer LIMIT 1`);
  const storeCityId = Number(process.env.STORE_CITY_ID);

  const cartIds = [];
  for (let i = 0; i < ATTEMPTS; i++) {
    const [res] = await pool.query(
      `INSERT INTO cart (customer_id, cart_status) VALUES (?, 'active')`, [who.user_id]);
    cartIds.push(res.insertId);
    await pool.query(
      `INSERT INTO cart_item (cart_id, variant_id, quantity) VALUES (?, ?, 1)`,
      [res.insertId, VARIANT_ID]);
  }

  console.log(`fixture ready: variant ${VARIANT_ID} stock=1, ${cartIds.length} carts, customer ${who.user_id}`);

  // --- baseline, BEFORE firing -------------------------------------------
  // The fixture adds to whatever is already in the database; it never clears
  // order_item. So the test measures the DELTA across the firing, not a raw
  // count - otherwise a second run would double every number and fail.
  // SUM() over zero rows is NULL, not 0, hence the ?? 0 below.
  const [[before]] = await pool.query(
    `SELECT SUM(out_of_stock_flag = 0) AS real_,
            SUM(out_of_stock_flag = 1) AS back_
       FROM order_item WHERE variant_id = ?`, [VARIANT_ID]);

  // --- firing -------------------------------------------------------------
  // allSettled, not all: a rejected CALL is data we want to count, not a
  // reason to abandon the other 19 and lose the evidence.
  const results = await Promise.allSettled(
    cartIds.map((cartId) =>
      pool.query(
        'CALL sp_place_order(?, ?, ?, ?, ?, ?, @o, @s)',
        [who.user_id, cartId, 'store_pickup', null, storeCityId, 'cod']
      )
    )
  );

  const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
  const rejected  = results.filter((r) => r.status === 'rejected').length;
  console.log(`\n${ATTEMPTS} parallel checkouts -> ${fulfilled} fulfilled, ${rejected} rejected`);

  if (rejected > 0) {
    const why = new Set(results.filter((r) => r.status === 'rejected')
                               .map((r) => r.reason.sqlMessage ?? r.reason.message));
    console.log(`  rejection reasons: ${[...why].join(' | ')}`);
  }

  // --- assertions ---------------------------------------------------------
  const [[after]] = await pool.query(
    `SELECT SUM(out_of_stock_flag = 0) AS real_,
            SUM(out_of_stock_flag = 1) AS back_
       FROM order_item WHERE variant_id = ?`, [VARIANT_ID]);
  const [[{ stock }]] = await pool.query(
    `SELECT stock_quantity AS stock FROM variant WHERE variant_id = ?`, [VARIANT_ID]);

  const tookTheUnit = Number(after.real_ ?? 0) - Number(before.real_ ?? 0);
  const backOrdered = Number(after.back_ ?? 0) - Number(before.back_ ?? 0);

  const checks = [
    ['stock never went negative',           stock >= 0,                    `stock = ${stock}`],
    ['stock landed at exactly 0',           stock === 0,                   `stock = ${stock}`],
    ['exactly ONE checkout took the unit',  tookTheUnit === 1,             `${tookTheUnit} line(s) with out_of_stock_flag = 0`],
    [`the other ${ATTEMPTS - 1} were back-ordered`,
                                            backOrdered === ATTEMPTS - 1,  `${backOrdered} of ${ATTEMPTS - 1}`],
  ];

  let failed = 0;
  for (const [label, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}  (${detail})`);
    if (!ok) failed++;
  }

  console.log(failed === 0
    ? `\nALL CHECKS PASSED - ACID held under ${ATTEMPTS}-way contention`
    : `\n${failed} CHECK(S) FAILED`);

  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
})();
