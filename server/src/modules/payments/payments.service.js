// Business rules only. No SQL, no req/res.
const repo = require('./payments.repo');
const ApiError = require('../../utils/ApiError');

const OUTCOMES = ['success', 'failure'];
const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;

function logEmail({ to, subject, text }) {
  console.info('[BrightBuy email stub]', JSON.stringify({
    from: 'noreply@brightbuy.com',
    to,
    subject,
    text,
  }));
}

exports.payCard = async (userId, orderId, mockOutcome) => {
  const numericOrderId = Number(orderId);

  if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
    throw ApiError.badRequest('orderId is required', {
      orderId: 'must be a positive integer',
    });
  }

  if (!OUTCOMES.includes(mockOutcome)) {
    throw ApiError.badRequest('Invalid mockOutcome', {
      mockOutcome: "must be 'success' or 'failure'",
    });
  }

  const payment = await repo.findByOrderId(numericOrderId);
  if (!payment) throw ApiError.notFound('Payment not found for this order');

  if (payment.customer_id !== userId) throw ApiError.forbidden();

  if (payment.payment_method !== 'card') {
    throw ApiError.conflict('NOT_A_CARD_ORDER', 'This order is not a card payment');
  }

  if (payment.payment_status !== 'Pending') {
    throw ApiError.conflict('PAYMENT_NOT_PENDING', 'This payment is not awaiting payment');
  }

  const paid = mockOutcome === 'success';
  const status = paid ? 'Paid' : 'Failed';
  const gatewayRef = paid ? `MOCK-${Date.now()}` : null;

    const changed = await repo.setCardResultIfPending(payment.payment_id, status, gatewayRef);
  if (changed === 0) {
    throw ApiError.conflict('PAYMENT_NOT_PENDING', 'This payment was already processed');
  }
  return {
    paymentId: payment.payment_id,
    orderId: payment.order_id,
    paymentStatus: status,
    gatewayRef,
    canRetry: status === 'Failed',
  };
};

exports.retryPayment = async (userId, paymentId, mockOutcome) => {
  const numericPaymentId = Number(paymentId);

  if (!Number.isInteger(numericPaymentId) || numericPaymentId <= 0) {
    throw ApiError.badRequest('Invalid paymentId', {
      paymentId: 'must be a positive integer',
    });
  }

  if (!OUTCOMES.includes(mockOutcome)) {
    throw ApiError.badRequest('Invalid mockOutcome', {
      mockOutcome: "must be 'success' or 'failure'",
    });
  }

  const payment = await repo.findPaymentById(numericPaymentId);
  if (!payment) throw ApiError.notFound('Payment not found');

  if (payment.customer_id !== userId) throw ApiError.forbidden();

  if (payment.payment_status === 'Cancelled') {
    throw ApiError.conflict(
      'PAYMENT_CANCELLED',
      'This payment was cancelled and cannot be retried'
    );
  }

  if (payment.payment_status !== 'Failed') {
    throw ApiError.conflict('NOT_RETRYABLE', 'Only failed payments can be retried');
  }

  const updatedAtMs = new Date(payment.updated_at).getTime();
  const elapsedMs = Date.now() - updatedAtMs;

  if (!Number.isFinite(updatedAtMs) || elapsedMs >= RETRY_WINDOW_MS) {
    throw ApiError.conflict(
      'RETRY_WINDOW_EXPIRED',
      'Retry window (24h) has expired'
    );
  }

  const paid = mockOutcome === 'success';
  const status = paid ? 'Paid' : 'Failed';
  const gatewayRef = paid ? `MOCK-${Date.now()}` : null;

    const changed = await repo.setRetryResultIfFailed(payment.payment_id, status, gatewayRef);
  if (changed === 0) {
    throw ApiError.conflict('NOT_RETRYABLE', 'This payment was already retried');
  }


  logEmail({
    to: payment.email,
    subject: paid ? 'Payment Successful' : 'Payment Failed',
    text: paid
      ? `Your payment retry for order ${payment.order_id} was successful.`
      : `Your payment retry for order ${payment.order_id} failed. Please try again.`,
  });

  return {
    paymentId: payment.payment_id,
    orderId: payment.order_id,
    paymentStatus: status,
    gatewayRef,
    canRetry: status === 'Failed' && elapsedMs < RETRY_WINDOW_MS,
  };
};

exports.markCodPaid = async (staffId, paymentId,requestedStatus) => {
    if (requestedStatus !== undefined && requestedStatus !== 'Paid') {
    throw ApiError.badRequest('Invalid paymentStatus', {
      paymentStatus: "must be 'Paid'",
    });
  }

  const numericPaymentId = Number(paymentId);

  if (!Number.isInteger(numericPaymentId) || numericPaymentId <= 0) {
    throw ApiError.badRequest('Invalid paymentId', {
      paymentId: 'must be a positive integer',
    });
  }

  const payment = await repo.findPaymentById(numericPaymentId);
  if (!payment) throw ApiError.notFound('Payment not found');

  if (payment.payment_method !== 'cod') {
    throw ApiError.conflict(
      'NOT_COD_PAYMENT',
      'Only COD payments can be marked paid this way'
    );
  }

  if (payment.payment_status !== 'Pending') {
    throw ApiError.conflict('NOT_PENDING', `Payment is already ${payment.payment_status}`);
  }

    const changed = await repo.markCodPaidIfPending(numericPaymentId, staffId);
  if (changed === 0) {
    throw ApiError.conflict('NOT_PENDING', 'Payment is no longer pending');
  }

  logEmail({
    to: payment.email,
    subject: 'Payment Received',
    text: `Payment for order ${payment.order_id} has been received. Thank you!`,
  });

  return {
    paymentId: numericPaymentId,
    orderId: payment.order_id,
    paymentStatus: 'Paid',
    staffId,
  };
};

exports.expireFailedCardPayments = async () => {
  const expired = await repo.findExpiredFailedCardPayments();
  const failures = [];
  let cancelled = 0;

  for (const payment of expired) {
    try {
      await repo.cancelExpiredPaymentOrder(payment.order_id);
      cancelled += 1;
      console.info(`Expired failed card payment cancelled for order ${payment.order_id}`);
    } catch (error) {
      failures.push(payment.order_id);
      console.error(
        `Could not cancel expired failed card payment for order ${payment.order_id}:`,
        error.message
      );
    }
  }

  return {
    examined: expired.length,
    cancelled,
    failedOrderIds: failures,
  };
};