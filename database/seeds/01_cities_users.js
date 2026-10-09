/**
 * Seed: cities + staff/admin + demo customers.          OWNER: M1
 *
 * Run via `npm run seed` from server/. Must be idempotent — use
 * INSERT IGNORE or ON DUPLICATE KEY UPDATE so re-running is safe.
 *
 * Texas main cities per REQ-7.3:
 *   Houston, San Antonio, Dallas, Austin, Fort Worth, El Paso   -> is_main_city = TRUE
 * Add ~15 other Texas cities with is_main_city = FALSE so the 7-day branch
 * of the delivery rule is actually testable.
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
    // Check whether the user already exists.
    const [existingRows] = await pool.query(
      `SELECT user_id
       FROM user
       WHERE email = ?`,
      [staff.email]
    );

    let userId;

    if (existingRows.length > 0) {
      // Reuse the existing user.
      userId = existingRows[0].user_id;
    } else {
      // Hash the password before storing it.
      const passwordHash = await bcrypt.hash(staff.password, 10);

      const [result] = await pool.query(
        `INSERT INTO user
          (first_name, last_name, email, password_hash, user_type)
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

    // Create the corresponding staff record.
    // INSERT IGNORE keeps the seed idempotent.
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
    // Check whether the user already exists.
    const [existingRows] = await pool.query(
      `SELECT user_id
       FROM user
       WHERE email = ?`,
      [customer.email]
    );

    let userId;

    if (existingRows.length > 0) {
      // Reuse the existing user.
      userId = existingRows[0].user_id;
    } else {
      // Hash the password before storing it.
      const passwordHash = await bcrypt.hash(customer.password, 10);

      const [result] = await pool.query(
        `INSERT INTO user
          (first_name, last_name, email, password_hash, user_type)
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

    // Create the corresponding customer record.
    await pool.query(
      `INSERT IGNORE INTO customer (user_id, address_id, phone)
       VALUES (?, NULL, ?)`,
      [userId, customer.phone]
    );
  }

  console.log(
    `  01_cities_users: inserted/verified ${customers.length} customer users`
  );
}