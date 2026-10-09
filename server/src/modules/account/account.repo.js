
const { pool, withTransaction } = require('../../config/db');

exports.findCustomerById = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
        u.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.user_type AS userType,
        c.phone,
        c.address_id AS addressId
     FROM user u
     JOIN customer c ON c.user_id = u.user_id
     WHERE u.user_id = ?`,
    [userId]
  );

  return rows[0] || null;
};

exports.updateCustomerProfile = async (userId, {
  firstName,
  lastName,
  phone,
}) => {
  await pool.query(
    `UPDATE user
     SET first_name = ?, last_name = ?
     WHERE user_id = ?`,
    [firstName, lastName, userId]
  );

  await pool.query(
    `UPDATE customer
     SET phone = ?
     WHERE user_id = ?`,
    [phone || null, userId]
  );
};

exports.findAddressesByCustomerId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
        a.address_id AS addressId,
        a.house_num AS houseNum,
        a.address_1 AS address1,
        a.address_2 AS address2,
        a.address_3 AS address3,
        a.city_id AS cityId,
        ci.city_name AS cityName
     FROM address a
     JOIN city ci ON ci.city_id = a.city_id
     WHERE a.customer_id = ?
     ORDER BY a.address_id`,
    [userId]
  );

  return rows;
};

exports.createAddress = async (userId, {
  cityId,
  houseNum,
  address1,
  address2,
  address3,
}) => {
  const [result] = await pool.query(
    `INSERT INTO address
       (customer_id, city_id, house_num, address_1, address_2, address_3)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      cityId,
      houseNum,
      address1,
      address2 || null,
      address3 || null,
    ]
  );

  return result.insertId;
};

exports.findCityById = async (cityId) => {
  const [rows] = await pool.query(
    `SELECT
        city_id AS cityId,
        city_name AS cityName,
        is_main_city AS isMainCity
     FROM city
     WHERE city_id = ?`,
    [cityId]
  );

  return rows[0] || null;
};

exports.findAllCities = async () => {
  const [rows] = await pool.query(
    `SELECT
        city_id AS cityId,
        city_name AS cityName,
        is_main_city AS isMainCity
     FROM city
     ORDER BY city_name`
  );

  return rows;
};

exports.createCity = async (cityName, isMainCity) => {
  const [result] = await pool.query(
    `INSERT INTO city (city_name, is_main_city)
     VALUES (?, ?)`,
    [cityName, isMainCity]
  );

  return result.insertId;
};

exports.updateCity = async (cityId, {
  cityName,
  isMainCity,
}) => {
  const [result] = await pool.query(
    `UPDATE city
     SET city_name = ?, is_main_city = ?
     WHERE city_id = ?`,
    [cityName, isMainCity, cityId]
  );

  return result.affectedRows;
};

exports.findAllUsers = async () => {
  const [rows] = await pool.query(
    `SELECT
        u.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.user_type AS userType,
        u.is_active AS isActive,
        u.created_at AS createdAt,
        c.phone,
        s.role
     FROM user u
     LEFT JOIN customer c ON c.user_id = u.user_id
     LEFT JOIN staff s ON s.user_id = u.user_id
     ORDER BY u.user_id`
  );

  return rows;
};

exports.createAuditLog = async ({
  actorUserId,
  action,
  entityType,
  entityId,
  beforeValue,
  afterValue,
}) => {
  await pool.query(
    `INSERT INTO admin_audit_log
       (actor_user_id, action, entity_type, entity_id, before_value, after_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      action,
      entityType,
      entityId,
      beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue ? JSON.stringify(afterValue) : null,
    ]
  );
};

// Find a user before changing their role or activation status.
exports.findUserById = async (userId) => {
  const [rows] = await pool.query(
    `SELECT
        u.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.user_type AS userType,
        u.is_active AS isActive,
        s.role
     FROM user u
     LEFT JOIN staff s ON s.user_id = u.user_id
     WHERE u.user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

// Update a user and record the changes in one transaction.
exports.updateAdminUserWithAudit = async ({
  userId,
  actorUserId,
  role,
  isActive,
}) => {
  return withTransaction(async (connection) => {
    // Lock the target user during the transaction.
    const [rows] = await connection.query(
      `SELECT
          u.user_id AS userId,
          u.user_type AS userType,
          u.is_active AS isActive,
          s.role
       FROM user u
       LEFT JOIN staff s ON s.user_id = u.user_id
       WHERE u.user_id = ?
       FOR UPDATE`,
      [userId]
    );

    const beforeUser = rows[0] || null;

    if (!beforeUser) {
      return null;
    }

    // Enforce critical rules against the locked database state.
    if (role !== undefined && beforeUser.userType !== 'staff') {
      const err = new Error('Cannot change a customer role');
      err.status = 400;
      throw err;
    }

    if (
      isActive === false &&
      Number(userId) === Number(actorUserId)
    ) {
      const err = new Error('You cannot deactivate your own account');
      err.status = 400;
      throw err;
    }

    const beforeValue = {};
    const afterValue = {};

    // Change the staff role if necessary.
    if (role !== undefined && role !== beforeUser.role) {
      const [result] = await connection.query(
        `UPDATE staff
         SET role = ?
         WHERE user_id = ?`,
        [role, userId]
      );

      if (result.affectedRows !== 1) {
        throw new Error('Staff record not found');
      }

      beforeValue.role = beforeUser.role;
      afterValue.role = role;
    }

    // Change account activation status if necessary.
    if (
      isActive !== undefined &&
      Boolean(beforeUser.isActive) !== isActive
    ) {
      await connection.query(
        `UPDATE user
         SET is_active = ?
         WHERE user_id = ?`,
        [isActive, userId]
      );

      beforeValue.isActive = Boolean(beforeUser.isActive);
      afterValue.isActive = isActive;
    }

    // Log only actual changes.
    if (Object.keys(afterValue).length > 0) {
      await connection.query(
        `INSERT INTO admin_audit_log
           (actor_user_id, action, entity_type, entity_id,
            before_value, after_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          actorUserId,
          'update',
          'user',
          userId,
          JSON.stringify(beforeValue),
          JSON.stringify(afterValue),
        ]
      );
    }

    // Retrieve the updated account information.
    const [updatedRows] = await connection.query(
      `SELECT
          u.user_id AS userId,
          u.first_name AS firstName,
          u.last_name AS lastName,
          u.email,
          u.user_type AS userType,
          u.is_active AS isActive,
          s.role
       FROM user u
       LEFT JOIN staff s ON s.user_id = u.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    const updatedUser = updatedRows[0];

    return {
      ...updatedUser,
      isActive: Boolean(updatedUser.isActive),
    };
  });
};
