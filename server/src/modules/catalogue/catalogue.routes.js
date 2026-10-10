//* Main idea ----> mapping URL s and HTTP methods to the necessary functions

// catalogue slice — OWNER: M2
// URL → controller mapping only. No logic.

const router     = require('express').Router();
const controller = require('./catalogue.controller');

const { requireAuth, requireRole } = require('../../middleware/auth');
const { auditMutation }            = require('../../middleware/audit');

// Staff roles allowed to manage the catalogue (REQ-10.5).
const staffRoles = requireRole('admin', 'major_exec', 'minor_exec');

// ─── Customer routes (public) ────────────────────────────────────────────────

// GET /api/products?q=&categoryId=&brand=&minPrice=&maxPrice=&page=&pageSize=
router.get('/products', controller.getProducts);     

// GET /api/products/:id
router.get('/products/:id', controller.getProduct);

// GET /api/categories
router.get('/categories', controller.getCategories);

// ─── Admin: products (staff only) ────────────────────────────────────────────

router.post(
  '/admin/products',
  requireAuth, staffRoles,
  auditMutation({ action: 'create', entityType: 'product' }),
  controller.adminCreateProduct
);

router.put(
  '/admin/products/:id',
  requireAuth, staffRoles,
  auditMutation({ action: 'update', entityType: 'product' }),
  controller.adminUpdateProduct
);

// DELETE deactivates — never hard-deletes (REQ-10.1).
router.delete(
  '/admin/products/:id',
  requireAuth, staffRoles,
  auditMutation({ action: 'update', entityType: 'product' }),
  controller.adminDeactivateProduct
);

// ─── Admin: categories (staff only) ──────────────────────────────────────────

router.post(
  '/admin/categories',
  requireAuth, staffRoles,
  auditMutation({ action: 'create', entityType: 'category' }),
  controller.adminCreateCategory
);

router.put(
  '/admin/categories/:id',
  requireAuth, staffRoles,
  auditMutation({ action: 'update', entityType: 'category' }),
  controller.adminUpdateCategory
);

router.delete(
  '/admin/categories/:id',
  requireAuth, staffRoles,
  auditMutation({ action: 'update', entityType: 'category' }),
  controller.adminDeactivateCategory
);

// ─── Admin: variants (staff only) ────────────────────────────────────────────

router.post(
  '/admin/variants',
  requireAuth, staffRoles,
  auditMutation({ action: 'create', entityType: 'variant' }),
  controller.adminCreateVariant
);

router.put(
  '/admin/variants/:id',
  requireAuth, staffRoles,
  auditMutation({ action: 'update', entityType: 'variant' }),
  controller.adminUpdateVariant
);

module.exports = router;
