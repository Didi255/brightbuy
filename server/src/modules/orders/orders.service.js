// orders slice — OWNER: M4
// TODO(M4): business rules only. No SQL, no req/res.

const repo = require('./orders.repo');
const ApiError = require('../../utils/ApiError');

const DELIVERY_MODES  = ['store_pickup', 'standard'];
const PAYMENT_METHODS = ['cod', 'card'];

exports.confirmCheckout = async (customerId,{deliveryMode, addressId, paymentMethod}) =>{
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
        const owned = await repo.findOwnedAdress(customerId,addressId);
        if(!owned) throw ApiError.forbidden('That address does not belong to you');
        resolvedAddressId = owned.addressId;
        cityId = owned.cityId;
    }

    //--- place it. Only this can Raise a signal therfore this is wrapped

    try{
        return await repo.placeOrder({
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


}


