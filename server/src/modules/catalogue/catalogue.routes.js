/**
 * catalogue slice — OWNER: M2
 * URL -> controller (plus auth middleware). No logic here.
 *
 * Mounted in src/app.js as:  app.use('/api', require('./modules/catalogue/catalogue.routes'));
 * so GET /products here is GET /api/products.
 */
const router = require('express').Router();
const controller = require('./catalogue.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');

// docs/API.md says "staff" for the admin routes, so every staff role is allowed.
// To restrict catalogue editing to certain roles, change this one line.
const staffOnly = [requireAuth, requireRole('admin', 'major_exec', 'minor_exec', 'labour')];

// --- customer-facing (no login needed) -------------------------------------
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProduct);
router.get('/categories', controller.getCategories);

// --- staff only ------------------------------------------------------------
// The auth check is attached to each route, NOT with router.use('/admin', ...).
// This router is mounted at /api before the other slices, so a router-wide
// /admin check would also run for /api/admin/orders, /admin/cities, etc.
router.post('/admin/products', staffOnly, controller.createProduct);
router.put('/admin/products/:id', staffOnly, controller.updateProduct);
router.delete('/admin/products/:id', staffOnly, controller.deactivateProduct);

router.post('/admin/categories', staffOnly, controller.createCategory);
router.put('/admin/categories/:id', staffOnly, controller.updateCategory);
router.delete('/admin/categories/:id', staffOnly, controller.deactivateCategory);

router.post('/admin/variants', staffOnly, controller.createVariant);
router.put('/admin/variants/:id', staffOnly, controller.updateVariant);

module.exports = router;