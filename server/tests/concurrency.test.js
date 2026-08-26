/**
 * Concurrency harness — OWNER: M4, evidence for REQ-6.1..6.3.
 *
 * Sets one variant to exactly 1 unit of stock, fires N simultaneous checkouts
 * at it, and asserts that exactly one succeeds and stock lands at 0.
 *
 * If more than one succeeds, your SELECT ... FOR UPDATE is missing or the
 * transaction boundary is wrong. This is the single most convincing artifact
 * you can put in the final report — take a screenshot of the passing run.
 *
 * Run: npm run test:concurrency
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { pool } = require('../src/config/db');

const VARIANT_ID = 1;
const ATTEMPTS = 20;

(async () => {
  // TODO(M4): once sp_place_order exists —
  //   1. UPDATE variant SET stock_quantity = 1 WHERE variant_id = ?
  //   2. build ATTEMPTS carts, each with 1 unit of that variant
  //   3. Promise.allSettled() over ATTEMPTS parallel CALL sp_place_order(...)
  //   4. assert: fulfilled === 1, rejected === ATTEMPTS - 1
  //   5. assert: stock_quantity === 0, and exactly 1 order row exists
  console.log('Not implemented yet — see TODO(M4)');
  await pool.end();
})();
