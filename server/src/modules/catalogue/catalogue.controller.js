// catalogue slice — OWNER: M2
// TODO(M2): HTTP in/out only. No SQL.

const service = require('./catalogue.service');
 
// GET /api/products?keyword=&category=&brand=&min_price=&max_price=&page=&limit=
exports.getProducts = async (req, res, next) => {
  try {
    const result = await service.searchProducts(req.query);
    res.json(result);
  } catch (err) { next(err); }
};
 
