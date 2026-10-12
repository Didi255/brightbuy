const repo = require('./reports.repo');
const ApiError = require('../../utils/ApiError');

const buildResponse = (data) => ({
  data,
  generatedAt: new Date().toISOString(),
});

const validDate = (value) =>
  typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

exports.quarterlySales = async (year) => {
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2099) {
    throw ApiError.badRequest('Invalid year', { year: 'must be a year from 2000 to 2099' });
  }

  return buildResponse(await repo.callQuarterlySales(numericYear));
};

exports.topProducts = async (from, to, limit) => {
  if (!validDate(from)) {
    throw ApiError.badRequest('Invalid date range', { from: 'must be YYYY-MM-DD' });
  }
  if (!validDate(to)) {
    throw ApiError.badRequest('Invalid date range', { to: 'must be YYYY-MM-DD' });
  }
  if (from > to) {
    throw ApiError.badRequest('Invalid date range', { to: 'must not be before from' });
  }

  const numericLimit = Number(limit);
  if (!Number.isInteger(numericLimit) || numericLimit < 1 || numericLimit > 100) {
    throw ApiError.badRequest('Invalid limit', { limit: 'must be an integer from 1 to 100' });
  }

  return buildResponse(await repo.callTopProducts(from, to, numericLimit));
};

exports.categoryOrders = async () =>
  buildResponse(await repo.callCategoryOrders());

exports.upcomingDeliveries = async () =>
  buildResponse(await repo.callUpcomingDeliveries());

exports.customerSummary = async (customerId) => {
  let numericCustomerId = null;

  if (customerId !== undefined && customerId !== '') {
    numericCustomerId = Number(customerId);
    if (!Number.isInteger(numericCustomerId) || numericCustomerId <= 0) {
      throw ApiError.badRequest('Invalid customerId', {
        customerId: 'must be a positive integer',
      });
    }
  }

  return buildResponse(await repo.callCustomerSummary(numericCustomerId));
};