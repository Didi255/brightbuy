// reports slice — OWNER: M5
// TODO(M5): HTTP in/out only. No SQL.
// HTTP in/out only.
const service = require('./reports.service');

exports.quarterlySales = async (req, res, next) => {
  try {
    const result = await service.quarterlySales(req.query.year);
    res.json(result);
  } catch (err) { next(err); }
};

exports.topProducts = async (req, res, next) => {
  try {
    const result = await service.topProducts(req.query.from, req.query.to, req.query.limit);
    res.json(result);
  } catch (err) { next(err); }
};

exports.categoryOrders = async (req, res, next) => {
  try {
    const result = await service.categoryOrders();
    res.json(result);
  } catch (err) { next(err); }
};

exports.upcomingDeliveries = async (req, res, next) => {
  try {
    const result = await service.upcomingDeliveries();
    res.json(result);
  } catch (err) { next(err); }
};

exports.customerSummary = async (req, res, next) => {
  try {
    const result = await service.customerSummary(req.query.customerId);
    res.json(result);
  } catch (err) { next(err); }
};