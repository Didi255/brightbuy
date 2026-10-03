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

