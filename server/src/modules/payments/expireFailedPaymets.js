require('dotenv').config({
  path: require('path').join(__dirname, '..', '..', '.env'),
});

const { pool } = require('../src/config/db');
const service = require('../src/modules/payments/payments.service');

(async () => {
  try {
    const result = await service.expireFailedCardPayments();

    console.info(
      `Payment expiry run: examined=${result.examined}, `
      + `cancelled=${result.cancelled}, failed=${result.failedOrderIds.length}`
    );

    if (result.failedOrderIds.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Payment expiry job failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();