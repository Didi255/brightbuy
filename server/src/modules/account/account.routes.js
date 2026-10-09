const router = require('express').Router();
const controller = require('./account.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { auditMutation } = require('../../middleware/audit');

router.get('/me', requireAuth, controller.getMe);
router.put('/me', requireAuth, controller.updateMe);

router.get('/me/addresses', requireAuth, controller.getAddresses);
router.post('/me/addresses', requireAuth, controller.createAddress);

router.get('/cities', controller.getCities);

router.get(
  '/admin/cities',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  controller.getAdminCities
);
router.post(
  '/admin/cities',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  auditMutation({
    action: 'create',
    entityType: 'city',
  }),
  controller.createCity
);
router.patch(
  '/admin/cities/:id',
  requireAuth,
  requireRole('admin', 'major_exec', 'minor_exec', 'labour'),
  auditMutation({
    action: 'update',
    entityType: 'city',
  }),
  controller.updateCity
);

router.get(
  '/admin/users',
  requireAuth,
  requireRole('admin'),
  controller.getAdminUsers
);

router.patch(
  '/admin/users/:id',
  requireAuth,
  requireRole('admin'),
  controller.updateAdminUser
);


router.get(
  '/admin/audit-log',
  requireAuth,
  requireRole('admin'),
  controller.getAuditLogs
);


module.exports = router;