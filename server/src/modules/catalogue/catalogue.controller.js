// catalogue slice — OWNER: M2
// HTTP in/out only. No SQL, no business logic.

const service = require('./catalogue.service');

// ─── Customer endpoints ──────────────────────────────────────────────────────

// GET /api/products?q=&categoryId=&brand=&minPrice=&maxPrice=&page=&pageSize=
exports.getProducts = async (req, res, next) => {
  try {
    const result = await service.searchProducts(req.query);
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await service.getProduct(Number(req.params.id));
    res.json(product);
  } catch (err) { next(err); }
};

// GET /api/categories
exports.getCategories = async (req, res, next) => {
  try {
    const tree = await service.getCategories();
    res.json(tree);
  } catch (err) { next(err); }
};

// ─── Admin: products ─────────────────────────────────────────────────────────

// POST /api/admin/products
exports.adminCreateProduct = async (req, res, next) => {
  try {
    const result = await service.adminCreateProduct(req.body);
    // Store entity info for the audit middleware.
    res.locals.auditData = { entityId: result.productId, afterValue: req.body };
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// PUT /api/admin/products/:id
exports.adminUpdateProduct = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const before = await service.adminUpdateProduct(productId, req.body);
    res.locals.auditData = {
      entityId: productId,
      beforeValue: before,
      afterValue: req.body,
    };
    res.json(before);
  } catch (err) { next(err); }
};

// DELETE /api/admin/products/:id  (deactivates — never hard-deletes)
exports.adminDeactivateProduct = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    await service.adminDeactivateProduct(productId);
    res.locals.auditData = { entityId: productId };
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
};

// ─── Admin: categories ───────────────────────────────────────────────────────

// POST /api/admin/categories
exports.adminCreateCategory = async (req, res, next) => {
  try {
    const result = await service.adminCreateCategory(req.body);
    res.locals.auditData = { entityId: result.categoryId, afterValue: req.body };
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// PUT /api/admin/categories/:id
exports.adminUpdateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    const updated = await service.adminUpdateCategory(categoryId, req.body);
    res.locals.auditData = { entityId: categoryId, afterValue: req.body };
    res.json(updated);
  } catch (err) { next(err); }
};

// DELETE /api/admin/categories/:id  (deactivates — blocks if active products exist)
exports.adminDeactivateCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.id);
    await service.adminDeactivateCategory(categoryId);
    res.locals.auditData = { entityId: categoryId };
    res.json({ message: 'Category deactivated' });
  } catch (err) { next(err); }
};

// ─── Admin: variants ─────────────────────────────────────────────────────────

// POST /api/admin/variants
exports.adminCreateVariant = async (req, res, next) => {
  try {
    const result = await service.adminCreateVariant(req.body);
    res.locals.auditData = { entityId: result.variantId, afterValue: req.body };
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// PUT /api/admin/variants/:id
exports.adminUpdateVariant = async (req, res, next) => {
  try {
    const variantId = Number(req.params.id);
    const updated = await service.adminUpdateVariant(variantId, req.body);
    res.locals.auditData = { entityId: variantId, afterValue: req.body };
    res.json(updated);
  } catch (err) { next(err); }
};
