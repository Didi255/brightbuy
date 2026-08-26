/**
 * Throw these from services. errorHandler turns them into the shared envelope.
 *
 *   throw new ApiError(409, 'INSUFFICIENT_STOCK', 'Only 2 left in stock');
 */
class ApiError extends Error {
  constructor(status, code, message, fields = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
  static badRequest(msg, fields)  { return new ApiError(400, 'VALIDATION_ERROR', msg, fields); }
  static unauthorized(msg = 'Authentication required') { return new ApiError(401, 'UNAUTHENTICATED', msg); }
  static forbidden(msg = 'Not permitted')              { return new ApiError(403, 'FORBIDDEN', msg); }
  static notFound(msg = 'Not found')                   { return new ApiError(404, 'NOT_FOUND', msg); }
  static conflict(code, msg)                           { return new ApiError(409, code, msg); }
}

module.exports = ApiError;
