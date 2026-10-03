// payments slice — OWNER: M5
// TODO(M5): HTTP in/out only. No SQL.
const service = require('./payments.service');

exports.payCard = async (req, res, next) => {
  try {
    const result = await service.payCard(req.user.userId, req.body.orderId, req.body.mockOutcome);
    res.json(result);
  } catch (err) { next(err); }
};