// catalogue slice — OWNER: M2
// HTTP in/out only. No SQL. Every function: call the service, send JSON, pass errors to next().
const service = require('./catalogue.service');

// ---- customer-facing ------------------------------------------------------

// GET /api/products?q=&categoryId=&brand=&minPrice=&maxPrice=&page=&pageSize=
exports.getProducts = async (req, res, next) => {
  try {
    res.json(await service.searchProducts(req.query));
  } catch (err) { next(err); }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const activeOnly = req.query.includeInactive === 'true' ? false : true;
    res.json(await service.getProduct(req.params.id, { activeOnly }));
  } catch (err) { next(err); }
};

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await service.getCategoryTree({ includeInactive }));
  } catch (err) { next(err); }
};

// ---- staff: products ------------------------------------------------------

// POST /api/admin/products
exports.createProduct = async (req, res, next) => {
  try {
    res.status(201).json(await service.createProduct(req.body));
  } catch (err) { next(err); }
};

// PUT /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    res.json(await service.updateProduct(req.params.id, req.body));
  } catch (err) { next(err); }
};

// DELETE /api/admin/products/:id  (deactivates, never deletes)
exports.deactivateProduct = async (req, res, next) => {
  try {
    res.json(await service.deactivateProduct(req.params.id));
  } catch (err) { next(err); }
};

// ---- staff: categories ----------------------------------------------------

// POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
  try {
    res.status(201).json(await service.createCategory(req.body));
  } catch (err) { next(err); }
};

// PUT /api/admin/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    res.json(await service.updateCategory(req.params.id, req.body));
  } catch (err) { next(err); }
};

// DELETE /api/admin/categories/:id  (deactivates, never deletes)
exports.deactivateCategory = async (req, res, next) => {
  try {
    res.json(await service.deactivateCategory(req.params.id));
  } catch (err) { next(err); }
};

// ---- staff: variants ------------------------------------------------------

// POST /api/admin/variants
exports.createVariant = async (req, res, next) => {
  try {
    res.status(201).json(await service.createVariant(req.body));
  } catch (err) { next(err); }
};

// PUT /api/admin/variants/:id
exports.updateVariant = async (req, res, next) => {
  try {
    res.json(await service.updateVariant(req.params.id, req.body));
  } catch (err) { next(err); }
};