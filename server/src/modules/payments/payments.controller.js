// HTTP in/out only. No SQL.
const service = require('./payments.service');

exports.payCard = async (req, res, next) => {
  try {
    const result = await service.payCard(req.user.userId, req.body.orderId, req.body.mockOutcome);
    res.json(result);
  } catch (err) { next(err); }
};

exports.retryPayment = async (req, res, next) => {
  try {
    const result = await service.retryPayment(
      req.user.userId,
      Number(req.params.id),
      req.body.mockOutcome
    );
    res.json(result);
  } catch (err) { next(err); }
};

exports.markCodPaid = async (req, res, next) => {
  try {
    const result = await service.markCodPaid(req.user.userId, Number(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
};