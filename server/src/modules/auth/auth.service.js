
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repo = require('./auth.repo');
const ApiError = require('../../utils/ApiError');

const SALT_ROUNDS = 10;

/**
 * REQ-4.1, REQ-4.2, REQ-4.3
 *
 * Register a new customer.
 * Validate required fields, reject duplicate emails,
 * hash the password, and create the customer account.
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

  // 2. Normalize the email.
  const email = input.email.trim().toLowerCase();

  // 3. Check whether the email is already registered.
  const existing = await repo.findByEmail(email);

  if (existing) {
    throw ApiError.badRequest('Email already registered', {
      email: 'already in use',
    });
  }

  // 4. Hash the password before storing it.
  const passwordHash = await bcrypt.hash(
    input.password,
    SALT_ROUNDS
  );

  // 5. Create user, customer, and address in one transaction.
  const userId = await repo.createCustomer({
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    passwordHash,
  });

  // 6. Return customer information and JWT.
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
 * REQ-4.4
 *
 * Authenticate an existing user.
 * Do not reveal whether the email or password was incorrect.
 *
 * Staff users must receive their role in the user response
 * so that the frontend can apply role-based navigation.
 */
exports.login = async ({ email, password }) => {
  // 1. Normalize the email.
  const normalizedEmail = email?.trim().toLowerCase();

  // 2. Validate login input.
  if (!normalizedEmail || !password) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 3. Find the user in MySQL.
  const user = await repo.findByEmail(normalizedEmail);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 4. Compare password with stored password hash.
  const ok = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!ok) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 5. Prevent deactivated accounts from logging in.
  if (!user.is_active) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 6. Construct the user object returned to React.
  const authenticatedUser = {
    userId: user.user_id,
    firstName: user.first_name,
    userType: user.user_type,

    // Include the staff role only for staff accounts.
    ...(user.user_type === 'staff'
      ? { role: user.role }
      : {}),
  };

  // 7. Generate JWT and return the login response.
  return {
    user: authenticatedUser,
    token: sign({
      userId: user.user_id,
      userType: user.user_type,
      role: user.role,
    }),
  };
};

/**
 * Generate a signed JWT.
 */
function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
