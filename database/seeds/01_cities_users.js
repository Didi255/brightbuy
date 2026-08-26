/**
 * Seed: cities + staff/admin + demo customers.          OWNER: M1
 *
 * Run via `npm run seed` from server/. Must be idempotent — use
 * INSERT IGNORE or ON DUPLICATE KEY UPDATE so re-running is safe.
 *
 * Texas main cities per REQ-7.3:
 *   Houston, San Antonio, Dallas, Austin, Fort Worth, El Paso   -> is_main_city = TRUE
 * Add ~15 other Texas cities with is_main_city = FALSE so the 7-day branch
 * of the delivery rule is actually testable.
 */
module.exports = async function seed(pool) {
  // TODO(M1)
  console.log('  01_cities_users: not implemented yet');
};
