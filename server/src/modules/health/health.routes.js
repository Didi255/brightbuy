const router = require('express').Router();
const { pool } = require('../../config/db');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ api: 'up', database: rows[0].ok === 1 ? 'up' : 'unknown' });
  } catch (err) { next(err); }
});

module.exports = router;
