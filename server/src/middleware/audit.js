const accountRepo = require('../modules/account/account.repo');

/**
 * Writes an admin audit-log entry after a successful staff mutation.
 */
function auditMutation({ action, entityType }) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      const auditData = res.locals.auditData;

      if (!auditData || !req.user) {
        return;
      }

      accountRepo.createAuditLog({
        actorUserId: req.user.userId,
        action,
        entityType,
        entityId: auditData.entityId,
        beforeValue: auditData.beforeValue,
        afterValue: auditData.afterValue,
      }).catch((err) => {
        console.error('Failed to write audit log:', err);
      });
    });

    next();
  };
}

module.exports = { auditMutation };