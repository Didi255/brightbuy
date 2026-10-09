// orders slice — OWNER: M4
// TODO(M4): business rules only. No SQL, no req/res.

const repo = require('./orders.repo');
const ApiError = require('../../utils/ApiError');

const DELIVERY_MODES  = ['store_pickup', 'standard'];
const PAYMENT_METHODS = ['cod', 'card'];

async function confirmCheckout(customerId,{deliveryMode, addressId, paymentMethod}){
    // TODO: Implement business logic for confirming checkout
    
    if(!DELIVERY_MODES.includes(deliveryMode)){
        throw ApiError.badRequest('Invalid delivery mode',{
            deliveryMode: "must be 'store_pickup' or 'standard'",
        });
    }
    if(!PAYMENT_METHODS.includes(paymentMethod)){
        throw ApiError.badRequest('Invalid payment mode',{
            paymentMethod: "must be 'cod' or 'card'",
        });
    }

    //----the cart------
    const cart = await repo.findActiveCart(customerId);
    if(!cart) throw ApiError.badRequest('No active cart to checkout');

    //---resolve the detination city---
    let cityId;
    let resolvedAddressId = null;

    if(deliveryMode === 'store_pickup'){
        cityId = Number(process.env.STORE_CITY_ID);
    }else{
        const owned = await repo.findOwnedAddress(customerId,addressId);
        if(!owned) throw ApiError.forbidden('That address does not belong to you');
        resolvedAddressId = owned.addressId;
        cityId = owned.cityId;
    }

    //--- place it. Only this can Raise a signal therfore this is wrapped
    let out;
    try{
        out = await repo.placeOrder({
            customerId,
            cartId: cart.cartId,
            deliveryMode,
            addressId: resolvedAddressId,
            cityId,
            paymentMethod
        });
    }catch(err){
        if(err.sqlState === '45000' && String(err.message).includes('INSUFFICIENT_STOCK')) {
        throw ApiError.conflict('INSUFFICIENT_STOCK', 'One or more items no longer have enough stock');

    }   
    throw err;
}

    return getOrder(customerId, out.orderId);
}


async function getOrder(customerId, orderId) {
  const row = await repo.findOrderById(orderId, customerId);
  if (!row) throw ApiError.notFound('Order not found');
  const items = await repo.findOrderItems(orderId);
  const payment = await repo.findPaymentForOrder(orderId);
  return toOrderShape(row, items,payment);
}

async function listOrders(customerId) {
  const orders = await repo.findOrdersByCustomer(customerId);
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.orderId)
  const items = await repo.findItemsForOrders(orderIds);
  const payments = await repo.findPaymentsForOrders(orderIds);

  return orders.map((o) =>
    toOrderShape(o, items.filter((i) => i.orderId === o.orderId),
    payments.find((p) => p.orderId === o.orderId) ?? null
    )
  );
}

async function cancelOrder(customerId, orderId) {
  const row = await repo.findOrderById(orderId, customerId);
  if (!row) throw ApiError.notFound('Order not found');

  if (row.orderStatus !== 'Placed') {
    throw ApiError.conflict('INVALID_TRANSITION',
      `An order that is ${row.orderStatus} can no longer be cancelled`);
  }

  try {
    await repo.cancelOrder(orderId, customerId);
  } catch (err) {
    if (err.sqlState === '45000' && String(err.message).includes('INVALID_TRANSITION')) {
      throw ApiError.conflict('INVALID_TRANSITION', 'That order can no longer be cancelled');
    }
    throw err;
  }

  return getOrder(customerId, orderId);
}

function toOrderShape(row, items, payment){
    return {
        orderId:     row.orderId,
        customerId:  row.customerId,
        orderDate:   row.orderDate,
        orderStatus: row.orderStatus,
        totalAmount: row.totalAmount,
        items: items.map((i) => ({
            orderItemId:      i.orderItemId,
            variantId:        i.variantId,
            sku:              i.sku,
            productName:      i.productName,
            quantity:         i.quantity,
            unitPriceAtOrder: i.unitPriceAtOrder,
            lineTotal:        i.lineTotal,
            outOfStockFlag:   Boolean(i.outOfStockFlag),
        })),
        delivery: {
            deliveryMode:          row.deliveryMode,
            addressSnapshot:       row.addressSnapshot,
            cityName:              row.cityName,
            isMainCity:            Boolean(row.isMainCity),
            estimatedDeliveryDate: row.estimatedDeliveryDate,
            deliveryStatus:        row.deliveryStatus,
        },
        payment: payment ? {
            paymentMethod: payment.paymentMethod,
            paymentStatus: payment.paymentStatus,
            gatewayRef:    payment.gatewayRef,
            canRetry:      false,   // REQ-8.5 — slice E owns the 24h window
        } : null,
    };
}



module.exports = {confirmCheckout,getOrder,listOrders,cancelOrder};




