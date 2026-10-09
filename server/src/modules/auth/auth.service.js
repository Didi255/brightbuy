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
  const fields = {};

  // 1. Validate required registration fields.
  if (!input.firstName?.trim()) {
    fields.firstName = 'First name is required';
  }

  if (!input.lastName?.trim()) {
    fields.lastName = 'Last name is required';
  }

  if (!input.email?.trim()) {
    fields.email = 'Email is required';
  }

  if (!input.password) {
    fields.password = 'Password is required';
  }

  if (!input.address) {
    fields.address = 'Address is required';
  } else {
    if (!input.address.address1?.trim()) {
      fields.address1 = 'Address line 1 is required';
    }

    if (!input.address.cityId) {
      fields.cityId = 'City is required';
    }
  }

  if (Object.keys(fields).length > 0) {
    throw ApiError.badRequest('Validation failed', fields);
  }

  // 2. Normalise the email before checking/storing it.
  const email = input.email.trim().toLowerCase();

  // 3. Reject an already registered email.
  const existing = await repo.findByEmail(email);

  if (existing) {
    throw ApiError.badRequest('Email already registered', {
      email: 'already in use',
    });
  }

  // 4. Never store the plaintext password.
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // 5. Create user + customer + first address in one transaction.
  const userId = await repo.createCustomer({
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    passwordHash,
  });

  // 6. Return the response shape required by API.md.
  return {
    user: {
      userId,
      firstName: input.firstName.trim(),
      userType: 'customer',
    },
    token: sign({
      userId,
      userType: 'customer',
    }),
  };
};

/**
 * REQ-4.4. Note the deliberately vague error message — never reveal whether
 * it was the email or the password that was wrong (SRS 4.4.2 step 4).
 */
exports.login = async ({ email, password }) => {
  // Normalise email the same way as registration.
  const normalizedEmail = email?.trim().toLowerCase();

  // Keep the login error deliberately vague.
  if (!normalizedEmail || !password) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const user = await repo.findByEmail(normalizedEmail);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }
// Do not issue JWTs to deactivated accounts.
  if (!user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }


  return {
    user: {
      userId: user.user_id,
      firstName: user.first_name,
      userType: user.user_type,
    },
    token: sign({
      userId: user.user_id,
      userType: user.user_type,
      role: user.role,
    }),
  };
};

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
