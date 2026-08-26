const ApiError = require('../utils/ApiError');

// 404 for unmatched routes
function notFound(req, res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// Central error handler — MUST be registered last, and MUST take 4 args.
// Every error response in the app comes out of here, so the shape stays consistent.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // MySQL SIGNAL from a trigger or stored procedure
  if (err.sqlState === '45000') {
    return res.status(409).json({ error: { code: 'DB_RULE_VIOLATION', message: err.message } });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'That value already exists' } });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong' : err.message,
      ...(err.fields ? { fields: err.fields } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
