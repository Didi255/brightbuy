// orders slice — OWNER: M4
// TODO(M4): SQL ONLY. Use placeholders, never string concatenation.
const { pool, withTransaction } = require('../../config/db');

exports.placeOrder = async ({customerId, cartId, deliveryMode, addressId, cityId, paymentMethod}) => {
    const conn = await pool.getConnection();
    try{
        await conn.query(
            'CALL sp_place_order(?,?,?,?,?,?,@oid,@st)',
            [customerId, cartId, deliveryMode ,addressId ,cityId,paymentMethod]
        );
        const[[out]] = await conn.query('SELECT @oid AS orderId, @st AS status');
        return out;


    }finally{
        conn.release();
    }
};

exports.findActiveCart = async(customerId) =>{
    const [rows] = await pool.query(
        `SELECT cart_id AS cartId FROM cart 
        WHERE customer_id = ? AND cart_status = 'active'
        ORDER BY cart_id DESC
        LIMIT 1`,
        [customerId]
    );
    return rows[0] || null;
};

exports.findOwnedAdress = async (customerId,addressId) => {
    const [rows] = await pool.query(
        `SELECT a.address_id AS addressId, a.city_id AS cityId
        FROM customer c
        JOIN address a ON a.address_id = c.address_id
        WHERE c.user_id = ? AND a.address_id = ?`,
        [customerId, addressId]
    );
    return rows[0] || null;
}


