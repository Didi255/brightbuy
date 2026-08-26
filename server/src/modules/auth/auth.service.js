const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('./auth.repo');
const ApiError = require('../../utils/ApiError');

const SALT_ROUNDS = 10;

/**
 * TODO(M1): REQ-4.1, REQ-4.2, REQ-4.3
 *   validate mandatory fields, reject duplicate email with a field-level
 *   message, hash the password, create user + customer + default address
 *   inside one transaction (use withTransaction from config/db).
 */
exports.register = async (input) => {
  const existing = await repo.findByEmail(input.email);
  if (existing) {
    throw ApiError.badRequest('Email already registered', { email: 'already in use' });
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const userId = await repo.createCustomer({ ...input, passwordHash });
  return { userId, token: sign({ userId, userType: 'customer' }) };
};

/**
 * REQ-4.4. Note the deliberately vague error message — never reveal whether
 * it was the email or the password that was wrong (SRS 4.4.2 step 4).
 */
exports.login = async ({ email, password }) => {
  const user = await repo.findByEmail(email);
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password');

  return {
    user: { userId: user.user_id, firstName: user.first_name, userType: user.user_type },
    token: sign({ userId: user.user_id, userType: user.user_type, role: user.role }),
  };
};

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
