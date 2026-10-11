
/**
 * Authentication and authorization middleware.
 * OWNER: M1
 */
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { pool } = require('../config/db');

/**
 * Read the user's CURRENT account status and staff role.
 *
 * Never trust the role stored in an old JWT, because an
 * admin may have changed that role after login.
 */
async function findActiveUser(decoded) {
  if (!Number.isInteger(decoded.userId) || decoded.userId <= 0) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT
       u.user_id AS userId,
       u.user_type AS userType,
       u.is_active AS isActive,
       s.role AS role
     FROM user u
     LEFT JOIN staff s ON s.user_id = u.user_id
     WHERE u.user_id = ?
     LIMIT 1`,
    [decoded.userId]
  );

  const user = rows[0];

  if (!user || !user.isActive) {
    return null;
  }

  return {
    ...decoded,
    userId: user.userId,
    userType: user.userType,
    role: user.role || null,
  };
}

/**
 * Attach req.user only if a valid token belongs to
 * an active account. Invalid tokens are ignored.
 */
async function optionalAuth(req, _res, next) {
  const token = (req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '');

  if (!token) return next();

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next();
  }

  try {
    req.user = await findActiveUser(decoded) || undefined;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require a valid JWT AND an active database account.
 */
async function requireAuth(req, _res, next) {
  const token = (req.headers.authorization || '')
    .replace(/^Bearer\s+/i, '');

  if (!token) {
    return next(ApiError.unauthorized());
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }

  try {
    const user = await findActiveUser(decoded);

    if (!user) {
      return next(ApiError.unauthorized(
        'Account is inactive or no longer exists'
      ));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require one of the specified CURRENT staff roles.
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (
      req.user.userType !== 'staff' ||
      !roles.includes(req.user.role)
    ) {
      return next(ApiError.forbidden());
    }

    next();
  };
}

module.exports = { optionalAuth, requireAuth, requireRole };
