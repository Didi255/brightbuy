// reports slice — OWNER: M5
// TODO(M5): business rules only. No SQL, no req/res.
const repo = require('./reports.repo');
const ApiError = require('../../utils/ApiError');

const buildResponse = (data) => ({
  data,
  generatedAt: new Date().toISOString(),
});

exports.quarterlySales = async (year) => {
  if (!Number.isInteger(Number(year)) || Number(year) < 2000 || Number(year) > 2099) {
    throw ApiError.badRequest('Invalid year', { year: 'must be a 4-digit year' });
  }
  const data = await repo.callQuarterlySales(Number(year));
  return buildResponse(data);
};

exports.topProducts = async (from, to, limit) => {
  if (!from || !to) {
    throw ApiError.badRequest('Missing date range', { from: 'required', to: 'required' });
  }
  if (!Number.isInteger(Number(limit)) || Number(limit) <= 0) {
    throw ApiError.badRequest('Invalid limit', { limit: 'must be a positive integer' });
  }
  const data = await repo.callTopProducts(from, to, Number(limit));
  return buildResponse(data);
};

exports.categoryOrders = async () => {
  const data = await repo.callCategoryOrders();
  return buildResponse(data);
};

exports.upcomingDeliveries = async () => {
  const data = await repo.callUpcomingDeliveries();
  return buildResponse(data);
};

exports.customerSummary = async (customerId) => {
  const data = await repo.callCustomerSummary(customerId || null);
  return buildResponse(data);
};