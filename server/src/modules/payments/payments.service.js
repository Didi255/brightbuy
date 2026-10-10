// Business rules only. No SQL, no req/res.
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

const nodemailer = require('nodemailer');

// At top of file, after requires:
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  logger: process.env.SMTP_LOG_ONLY === 'true',
});

// Add this function:
exports.retryPayment = async (userId, paymentId, mockOutcome) => {
  if (!['success', 'failure'].includes(mockOutcome)) {
    throw ApiError.badRequest('Invalid mockOutcome', { mockOutcome: "must be 'success' or 'failure'" });
  }

  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');

  // Ownership check
  if (payment.customer_id !== userId) throw ApiError.forbidden();

  // Exclude cancelled
  if (payment.payment_status === 'Cancelled') {
    throw ApiError.conflict('PAYMENT_CANCELLED', 'This payment was cancelled and cannot be retried');
  }

  // Must be Failed and within 24h
  if (payment.payment_status !== 'Failed') {
    throw ApiError.conflict('NOT_RETRYABLE', 'Only failed payments can be retried');
  }

  const hoursSinceFailure = Math.floor((Date.now() - new Date(payment.updated_at).getTime()) / (1000 * 60 * 60));
  if (hoursSinceFailure > 24) {
    throw ApiError.conflict('RETRY_WINDOW_EXPIRED', 'Retry window (24h) has expired');
  }

  // Mock gateway
  const paid = mockOutcome === 'success';
  const status = paid ? 'Paid' : 'Failed';
  const gatewayRef = paid ? `MOCK-${Date.now()}` : null;

  await repo.updatePaymentStatus(payment.payment_id, status, gatewayRef);

  // Send email notification (stub logs to console)
  try {
    await transporter.sendMail({
      from: 'noreply@brightbuy.com',
      to: payment.email,
      subject: paid ? 'Payment Successful' : 'Payment Failed',
      text: paid
        ? `Your payment retry for order ${payment.order_id} was successful.`
        : `Your payment retry for order ${payment.order_id} failed. Please try again.`,
    });
  } catch (err) {
    console.error('Email send failed (stub mode):', err.message);
  }

  return {
    paymentId: payment.payment_id,
    orderId: payment.order_id,
    paymentStatus: status,
    gatewayRef,
    canRetry: status === 'Failed' && hoursSinceFailure < 24,
  };
};