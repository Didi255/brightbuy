// payments slice — OWNER: M5
// TODO(M5): business rules only. No SQL, no req/res.
const repo = require('./payments.repo');
const ApiError = require('../../utils/ApiError');

const OUTCOMES = ['success', 'failure'];

exports.payCard = async (userId, orderId, mockOutcome) => {
  if (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
    throw ApiError.badRequest('orderId is required', { orderId: 'must be a positive integer' });
  }
  if (!OUTCOMES.includes(mockOutcome)) {
    throw ApiError.badRequest('Invalid mockOutcome', { mockOutcome: "must be 'success' or 'failure'" });
  }

  const payment = await repo.findByOrderId(Number(orderId));
  if (!payment) throw ApiError.notFound('Payment not found for this order');

  if (payment.customer_id !== userId) throw ApiError.forbidden();

  if (payment.payment_method !== 'card') {
    throw ApiError.conflict('NOT_A_CARD_ORDER', 'This order is not a card payment');
  }
  if (payment.payment_status !== 'Pending') {
    throw ApiError.conflict('PAYMENT_NOT_PENDING', 'This payment is not awaiting payment');
  }

  // Mock gateway. A real gateway would replace only this block.
  const paid = mockOutcome === 'success';
  const status = paid ? 'Paid' : 'Failed';
  const gatewayRef = paid ? `MOCK-${Date.now()}` : null;

  await repo.updateStatus(payment.payment_id, status, gatewayRef);

  return {
    paymentId: payment.payment_id,
    orderId: payment.order_id,
    paymentStatus: status,
    gatewayRef,
    canRetry: status === 'Failed',
  };
};