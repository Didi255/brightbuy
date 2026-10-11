// orders slice — OWNER: M4
// TODO(M4): HTTP in/out only. No SQL.

const service = require('./orders.service');


exports.confirmCheckout = async (req, res, next) => {
  try {
    const result = await service.confirmCheckout(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const result = await service.getOrder(req.user.userId, Number(req.params.orderId));
    res.json(result);
  } catch (err) { next(err); }
};

exports.listOrders = async (req, res,next) => {
  try{
    const result = await service.listOrders(req.user.userId);
    res.json(result);

  }catch(err) {next(err);}
}

exports.cancelOrder = async (req, res, next) => {
  try {
    const result = await service.cancelOrder(req.user.userId, Number(req.params.orderId));
    res.json(result);
  } catch (err) { next(err); }
};



// ---- Staff order console (slice E) ----
exports.listAllOrders = async (req, res, next) => {
  try {
    const result = await service.listAllOrders({
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      deliveryMode: req.query.deliveryMode,
      from: req.query.from,
      to: req.query.to,
    });
    res.json(result);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const result = await service.transitionOrderStatus(
      req.user.userId,
      Number(req.params.id),
      req.body.orderStatus
    );
    res.json(result);
  } catch (err) { next(err); }
};


exports.createAdjustment = async (req, res, next) => {
  try {
    const result = await service.adjustStock(
      req.user.userId,
      Number(req.body.variantId),
      Number(req.body.changeQty),
      req.body.reason
    );
    res.status(201).json(result);
  } catch (err) { next(err); }
};
