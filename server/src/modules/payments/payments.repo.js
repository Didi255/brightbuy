// payments slice — OWNER: M5
// TODO(M5): SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');
