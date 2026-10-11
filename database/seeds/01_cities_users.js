
/**
 * Seed: cities + staff/admin + demo customers + addresses.
 * OWNER: M1
 *
 * Run via `npm run seed` from server/.
 * Must be idempotent: rerunning must not duplicate seed data.
 *
 * Texas main cities per REQ-7.3:
 * Houston, San Antonio, Dallas, Austin, Fort Worth, El Paso.
 *
 * Other Texas cities are included to test the 7-day
 * delivery rule.
 */

const bcrypt = require('../../server/node_modules/bcrypt');

module.exports = async function seed(pool) {
  // --------------------------------------------------
  // 1. Seed cities
  // --------------------------------------------------

  const cities = [
    ['Houston', true],
    ['San Antonio', true],
    ['Dallas', true],
    ['Austin', true],
    ['Fort Worth', true],
    ['El Paso', true],

    ['Arlington', false],
    ['Corpus Christi', false],
    ['Plano', false],
    ['Lubbock', false],
    ['Irving', false],
    ['Garland', false],
    ['Amarillo', false],
    ['Grand Prairie', false],
    ['McKinney', false],
    ['Frisco', false],
    ['Brownsville', false],
    ['Pasadena', false],
    ['Killeen', false],
    ['Waco', false],
    ['Midland', false],
  ];

  await pool.query(
    `INSERT IGNORE INTO city (city_name, is_main_city)
     VALUES ?`,
    [cities]
  );

  console.log(
    `  01_cities_users: inserted/verified ${cities.length} cities`
  );

  // --------------------------------------------------
  // 2. Seed staff users
  // --------------------------------------------------

  const staffUsers = [
    {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@brightbuy.com',
      password: 'Admin@123',
      role: 'admin',
    },
    {
      firstName: 'Major',
      lastName: 'Executive',
      email: 'majorexec@brightbuy.com',
      password: 'Major@123',
      role: 'major_exec',
    },
    {
      firstName: 'Minor',
      lastName: 'Executive',
      email: 'minorexec@brightbuy.com',
      password: 'Minor@123',
      role: 'minor_exec',
    },
    {
      firstName: 'Labour',
      lastName: 'Staff',
      email: 'labour@brightbuy.com',
      password: 'Labour@123',
      role: 'labour',
    },
  ];

  for (const staff of staffUsers) {
    const [existingRows] = await pool.query(
      `SELECT user_id
       FROM user
       WHERE email = ?`,
      [staff.email]
    );

    let userId;

    if (existingRows.length > 0) {
      userId = existingRows[0].user_id;
    } else {
      const passwordHash = await bcrypt.hash(
        staff.password,
        10
      );

      const [result] = await pool.query(
        `INSERT INTO user
           (first_name, last_name, email,
            password_hash, user_type)
         VALUES (?, ?, ?, ?, 'staff')`,
        [
          staff.firstName,
          staff.lastName,
          staff.email,
          passwordHash,
        ]
      );

      userId = result.insertId;
    }

    await pool.query(
      `INSERT IGNORE INTO staff (user_id, role)
       VALUES (?, ?)`,
      [userId, staff.role]
    );
  }

  console.log(
    `  01_cities_users: inserted/verified ${staffUsers.length} staff users`
  );

  // --------------------------------------------------
  // 3. Seed customer users
  // --------------------------------------------------

  const customers = [
    {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@brightbuy.com',
      password: 'Customer@123',
      phone: '713-555-1001',
    },
    {
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@brightbuy.com',
      password: 'Customer@123',
      phone: '210-555-1002',
    },
    {
      firstName: 'Michael',
      lastName: 'Williams',
      email: 'michael.williams@brightbuy.com',
      password: 'Customer@123',
      phone: '214-555-1003',
    },
    {
      firstName: 'Sarah',
      lastName: 'Brown',
      email: 'sarah.brown@brightbuy.com',
      password: 'Customer@123',
      phone: '512-555-1004',
    },
    {
      firstName: 'David',
      lastName: 'Jones',
      email: 'david.jones@brightbuy.com',
      password: 'Customer@123',
      phone: '817-555-1005',
    },
    {
      firstName: 'Jessica',
      lastName: 'Garcia',
      email: 'jessica.garcia@brightbuy.com',
      password: 'Customer@123',
      phone: '915-555-1006',
    },
    {
      firstName: 'Daniel',
      lastName: 'Miller',
      email: 'daniel.miller@brightbuy.com',
      password: 'Customer@123',
      phone: '682-555-1007',
    },
    {
      firstName: 'Ashley',
      lastName: 'Davis',
      email: 'ashley.davis@brightbuy.com',
      password: 'Customer@123',
      phone: '361-555-1008',
    },
    {
      firstName: 'Matthew',
      lastName: 'Rodriguez',
      email: 'matthew.rodriguez@brightbuy.com',
      password: 'Customer@123',
      phone: '469-555-1009',
    },
    {
      firstName: 'Amanda',
      lastName: 'Martinez',
      email: 'amanda.martinez@brightbuy.com',
      password: 'Customer@123',
      phone: '972-555-1010',
    },
    {
      firstName: 'Christopher',
      lastName: 'Hernandez',
      email: 'christopher.hernandez@brightbuy.com',
      password: 'Customer@123',
      phone: '806-555-1011',
    },
    {
      firstName: 'Jennifer',
      lastName: 'Lopez',
      email: 'jennifer.lopez@brightbuy.com',
      password: 'Customer@123',
      phone: '254-555-1012',
    },
    {
      firstName: 'Andrew',
      lastName: 'Gonzalez',
      email: 'andrew.gonzalez@brightbuy.com',
      password: 'Customer@123',
      phone: '432-555-1013',
    },
    {
      firstName: 'Elizabeth',
      lastName: 'Wilson',
      email: 'elizabeth.wilson@brightbuy.com',
      password: 'Customer@123',
      phone: '409-555-1014',
    },
    {
      firstName: 'Joshua',
      lastName: 'Anderson',
      email: 'joshua.anderson@brightbuy.com',
      password: 'Customer@123',
      phone: '903-555-1015',
    },
    {
      firstName: 'Stephanie',
      lastName: 'Thomas',
      email: 'stephanie.thomas@brightbuy.com',
      password: 'Customer@123',
      phone: '325-555-1016',
    },
    {
      firstName: 'Ryan',
      lastName: 'Taylor',
      email: 'ryan.taylor@brightbuy.com',
      password: 'Customer@123',
      phone: '956-555-1017',
    },
    {
      firstName: 'Nicole',
      lastName: 'Moore',
      email: 'nicole.moore@brightbuy.com',
      password: 'Customer@123',
      phone: '281-555-1018',
    },
    {
      firstName: 'Brandon',
      lastName: 'Jackson',
      email: 'brandon.jackson@brightbuy.com',
      password: 'Customer@123',
      phone: '972-555-1019',
    },
    {
      firstName: 'Rachel',
      lastName: 'Martin',
      email: 'rachel.martin@brightbuy.com',
      password: 'Customer@123',
      phone: '915-555-1020',
    },
  ];

  for (const customer of customers) {
    const [existingRows] = await pool.query(
      `SELECT user_id
       FROM user
       WHERE email = ?`,
      [customer.email]
    );

    let userId;

    if (existingRows.length > 0) {
      userId = existingRows[0].user_id;
    } else {
      const passwordHash = await bcrypt.hash(
        customer.password,
        10
      );

      const [result] = await pool.query(
        `INSERT INTO user
           (first_name, last_name, email,
            password_hash, user_type)
         VALUES (?, ?, ?, ?, 'customer')`,
        [
          customer.firstName,
          customer.lastName,
          customer.email,
          passwordHash,
        ]
      );

      userId = result.insertId;
    }

    await pool.query(
      `INSERT IGNORE INTO customer
         (user_id, address_id, phone)
       VALUES (?, NULL, ?)`,
      [userId, customer.phone]
    );
  }

  console.log(
    `  01_cities_users: inserted/verified ${customers.length} customer users`
  );

  // --------------------------------------------------
  // 4. Seed default delivery addresses
  // --------------------------------------------------

  // First 6 are main cities; remaining cities are
  // non-main cities. This allows delivery-rule testing.

  const deliveryCities = [
    'Houston',
    'San Antonio',
    'Dallas',
    'Austin',
    'Fort Worth',
    'El Paso',
    'Arlington',
    'Corpus Christi',
    'Plano',
    'Lubbock',
    'Irving',
    'Garland',
    'Amarillo',
    'Grand Prairie',
    'McKinney',
    'Frisco',
    'Brownsville',
    'Pasadena',
    'Killeen',
    'Waco',
  ];

  let addressesCreated = 0;
  let defaultsAssigned = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const cityName = deliveryCities[i];

    // One transaction per customer. Locking the customer row
    // also serializes concurrent seed runs that use this
    // same locking approach.

    const connection = await pool.getConnection();

    let createdThisCustomer = 0;
    let assignedThisCustomer = 0;

    try {
      await connection.beginTransaction();

      // Find the customer and lock the record.
      const [customerRows] = await connection.query(
        `SELECT c.user_id AS userId,
                c.address_id AS addressId
         FROM customer c
         JOIN user u ON u.user_id = c.user_id
         WHERE u.email = ?
         LIMIT 1
         FOR UPDATE`,
        [customer.email]
      );

      if (customerRows.length === 0) {
        throw new Error(
          `Seed customer not found: ${customer.email}`
        );
      }

      const { userId, addressId } = customerRows[0];

      // Do not overwrite an existing default address.
      if (addressId === null) {

        // Look up the existing city.
        const [cityRows] = await connection.query(
          `SELECT city_id AS cityId
           FROM city
           WHERE city_name = ?
           LIMIT 1`,
          [cityName]
        );

        if (cityRows.length === 0) {
          throw new Error(
            `Seed city not found: ${cityName}`
          );
        }

        const cityId = cityRows[0].cityId;

        // Deterministic fictional addresses for testing.
        const houseNum = String(100 + i);
        const address1 = `${100 + i} Demo Street`;

        // Reuse a matching seed address if it exists.
        const [addressRows] = await connection.query(
          `SELECT address_id AS addressId
           FROM address
           WHERE customer_id = ?
             AND city_id = ?
             AND house_num = ?
             AND address_1 = ?
           ORDER BY address_id
           LIMIT 1`,
          [userId, cityId, houseNum, address1]
        );

        let defaultAddressId;

        if (addressRows.length > 0) {
          defaultAddressId = addressRows[0].addressId;
        } else {
          // Insert the new address in the transaction.
          const [result] = await connection.query(
            `INSERT INTO address
               (customer_id, city_id, house_num,
                address_1, address_2, address_3)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              cityId,
              houseNum,
              address1,
              null,
              null,
            ]
          );

          defaultAddressId = result.insertId;
          createdThisCustomer = 1;
        }

        // Assign the default address.
        const [updateResult] = await connection.query(
          `UPDATE customer
           SET address_id = ?
           WHERE user_id = ?
             AND address_id IS NULL`,
          [defaultAddressId, userId]
        );

        if (updateResult.affectedRows !== 1) {
          throw new Error(
            `Could not assign default address for ${customer.email}`
          );
        }

        assignedThisCustomer = 1;
      }

      // Both address operations succeeded.
      await connection.commit();

      // Count only successfully committed changes.
      addressesCreated += createdThisCustomer;
      defaultsAssigned += assignedThisCustomer;

    } catch (err) {
      // Undo changes made within this transaction.
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        err.rollbackError = rollbackErr;
      }

      throw err;

    } finally {
      // Always return the connection to the pool.
      connection.release();
    }
  }

  console.log(
    `  01_cities_users: created ${addressesCreated} addresses, ` +
    `assigned ${defaultsAssigned} default addresses`
  );
};
