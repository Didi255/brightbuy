/**
 * Auth middleware.                                        OWNER: M1
 * Four other slices depend on this — ship it in week 1.
 */
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/** Attaches req.user if a valid token is present. Never rejects. */
function optionalAuth(req, _res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* ignore */ }
  }
  next();
}

/** Rejects unless a valid token is present. */
function requireAuth(req, _res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/**
 * Rejects unless the authenticated user holds one of the given staff roles.
 *   router.get('/admin/orders', requireAuth, requireRole('admin','minor_exec'), ctrl.list)
 * REQ-10.5, REQ-12.6
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.userType !== 'staff' || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

module.exports = { optionalAuth, requireAuth, requireRole };
