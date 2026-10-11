
/**
 * Seed: cities + staff/admin + demo customers + addresses.
 * OWNER: M1
 *
 * Run via `npm run seed` from server/.
 * Must be idempotent: rerunning must not duplicate seed data.
 *
 * BrightBuy trades in Sri Lanka. Main cities per REQ-7.3 are the six
 * commercial centres that get the 5-day estimate:
 *   Colombo, Kandy, Galle, Jaffna, Negombo, Kurunegala.
 *
 * Fifteen further cities across all nine provinces are included so the
 * 7-day branch of fn_estimate_delivery_days is exercised, and so the
 * delivery report shows a spread rather than one district.
 *
 * STORE_CITY_ID must point at a main city — Colombo is city 1, and the
 * server asserts this at startup.
 */

const bcrypt = require('../../server/node_modules/bcrypt');

module.exports = async function seed(pool) {
  // --------------------------------------------------
  // 1. Seed cities
  // --------------------------------------------------

  const cities = [
    /* main cities — 5-day delivery (REQ-7.3) */
    ['Colombo', true],
    ['Kandy', true],
    ['Galle', true],
    ['Jaffna', true],
    ['Negombo', true],
    ['Kurunegala', true],

    /* the rest — 7-day delivery, one or more per province */
    ['Dehiwala', false],
    ['Moratuwa', false],
    ['Sri Jayawardenepura Kotte', false],
    ['Gampaha', false],
    ['Kalutara', false],
    ['Matara', false],
    ['Hambantota', false],
    ['Ratnapura', false],
    ['Badulla', false],
    ['Nuwara Eliya', false],
    ['Anuradhapura', false],
    ['Polonnaruwa', false],
    ['Trincomalee', false],
    ['Batticaloa', false],
    ['Puttalam', false],
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
      firstName: 'Suranga',
      lastName: 'Jayasuriya',
      email: 'admin@brightbuy.com',
      password: 'Admin@123',
      role: 'admin',
    },
    {
      firstName: 'Anoma',
      lastName: 'Senanayake',
      email: 'majorexec@brightbuy.com',
      password: 'Major@123',
      role: 'major_exec',
    },
    {
      firstName: 'Lakmal',
      lastName: 'Ekanayake',
      email: 'minorexec@brightbuy.com',
      password: 'Minor@123',
      role: 'minor_exec',
    },
    {
      firstName: 'Saman',
      lastName: 'Pathirana',
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
      firstName: 'Nimal',
      lastName: 'Perera',
      email: 'nimal.perera@brightbuy.com',
      password: 'Customer@123',
      phone: '077-412-8801',
    },
    {
      firstName: 'Dilani',
      lastName: 'Fernando',
      email: 'dilani.fernando@brightbuy.com',
      password: 'Customer@123',
      phone: '071-905-3312',
    },
    {
      firstName: 'Kasun',
      lastName: 'Jayawardena',
      email: 'kasun.jayawardena@brightbuy.com',
      password: 'Customer@123',
      phone: '076-338-7420',
    },
    {
      firstName: 'Thilini',
      lastName: 'Wickramasinghe',
      email: 'thilini.wickramasinghe@brightbuy.com',
      password: 'Customer@123',
      phone: '070-221-9654',
    },
    {
      firstName: 'Ruwan',
      lastName: 'Bandara',
      email: 'ruwan.bandara@brightbuy.com',
      password: 'Customer@123',
      phone: '075-883-1207',
    },
    {
      firstName: 'Shanika',
      lastName: 'Gunawardena',
      email: 'shanika.gunawardena@brightbuy.com',
      password: 'Customer@123',
      phone: '078-460-5538',
    },
    {
      firstName: 'Mohamed',
      lastName: 'Rizwan',
      email: 'mohamed.rizwan@brightbuy.com',
      password: 'Customer@123',
      phone: '077-114-6093',
    },
    {
      firstName: 'Fathima',
      lastName: 'Nazeer',
      email: 'fathima.nazeer@brightbuy.com',
      password: 'Customer@123',
      phone: '071-657-2284',
    },
    {
      firstName: 'Arjun',
      lastName: 'Thevarajah',
      email: 'arjun.thevarajah@brightbuy.com',
      password: 'Customer@123',
      phone: '076-902-4471',
    },
    {
      firstName: 'Priya',
      lastName: 'Sivakumar',
      email: 'priya.sivakumar@brightbuy.com',
      password: 'Customer@123',
      phone: '070-538-8816',
    },
    {
      firstName: 'Chamara',
      lastName: 'Rathnayake',
      email: 'chamara.rathnayake@brightbuy.com',
      password: 'Customer@123',
      phone: '075-247-3350',
    },
    {
      firstName: 'Nilusha',
      lastName: 'Silva',
      email: 'nilusha.silva@brightbuy.com',
      password: 'Customer@123',
      phone: '078-776-1129',
    },
    {
      firstName: 'Dinesh',
      lastName: 'Abeysekara',
      email: 'dinesh.abeysekara@brightbuy.com',
      password: 'Customer@123',
      phone: '077-603-9962',
    },
    {
      firstName: 'Hasini',
      lastName: 'Ranasinghe',
      email: 'hasini.ranasinghe@brightbuy.com',
      password: 'Customer@123',
      phone: '071-382-5074',
    },
    {
      firstName: 'Sanjeewa',
      lastName: 'Dissanayake',
      email: 'sanjeewa.dissanayake@brightbuy.com',
      password: 'Customer@123',
      phone: '076-519-6628',
    },
    {
      firstName: 'Ishara',
      lastName: 'Weerasinghe',
      email: 'ishara.weerasinghe@brightbuy.com',
      password: 'Customer@123',
      phone: '070-845-2293',
    },
    {
      firstName: 'Ahamed',
      lastName: 'Faizal',
      email: 'ahamed.faizal@brightbuy.com',
      password: 'Customer@123',
      phone: '075-930-7715',
    },
    {
      firstName: 'Yohan',
      lastName: 'de Silva',
      email: 'yohan.desilva@brightbuy.com',
      password: 'Customer@123',
      phone: '078-164-4486',
    },
    {
      firstName: 'Menaka',
      lastName: 'Amarasinghe',
      email: 'menaka.amarasinghe@brightbuy.com',
      password: 'Customer@123',
      phone: '077-271-8359',
    },
    {
      firstName: 'Tharindu',
      lastName: 'Karunaratne',
      email: 'tharindu.karunaratne@brightbuy.com',
      password: 'Customer@123',
      phone: '071-746-0921',
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
    'Colombo',
    'Kandy',
    'Galle',
    'Jaffna',
    'Negombo',
    'Kurunegala',
    'Dehiwala',
    'Moratuwa',
    'Sri Jayawardenepura Kotte',
    'Gampaha',
    'Kalutara',
    'Matara',
    'Hambantota',
    'Ratnapura',
    'Badulla',
    'Nuwara Eliya',
    'Anuradhapura',
    'Polonnaruwa',
    'Trincomalee',
    'Batticaloa',
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

        /* The address snapshot is shown verbatim on every historical order,
           so a literal "Demo Street" would appear in the UI and in M5's
           delivery report. Deterministic, but a real thoroughfare in the
           matching city. */
        const STREETS = {
          'Colombo': 'Galle Road, Kollupitiya',
          'Kandy': 'Dalada Veediya',
          'Galle': 'Wakwella Road',
          'Jaffna': 'Hospital Road',
          'Negombo': 'Lewis Place',
          'Kurunegala': 'Kandy Road',
          'Dehiwala': 'Hill Street',
          'Moratuwa': 'De Soysa Road',
          'Sri Jayawardenepura Kotte': 'Pagoda Road',
          'Gampaha': 'Colombo Road',
          'Kalutara': 'Main Street',
          'Matara': 'Anagarika Dharmapala Mawatha',
          'Hambantota': 'Tissa Road',
          'Ratnapura': 'Bandaranayake Mawatha',
          'Badulla': 'Lower King Street',
          'Nuwara Eliya': 'Badulla Road',
          'Anuradhapura': 'Maithripala Senanayake Mawatha',
          'Polonnaruwa': 'Batticaloa Road',
          'Trincomalee': 'Dockyard Road',
          'Batticaloa': 'Trincomalee Road',
        };
        const houseNum = String(12 + i * 7);
        const address1 = STREETS[cityName] || 'Main Street';

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
