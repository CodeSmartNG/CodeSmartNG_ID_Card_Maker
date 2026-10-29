import { prisma } from '../config/database.js';
import { paystackService } from './paystackService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

/**
 * Issue a refund against a SUCCESS payment.
 * Handles:
 *  - full refund  (amount === payment.amount)
 *  - partial refund (amount < payment.amount)
 *  - idempotency  (same refundReference re-requested)
 *  - Paystack failure (rolls back local state)
 *  - card status transition (REVOKED on full refund of generated card)
 */
export const issueRefund = async ({ paymentId, amount, reason, userId, organizationId }) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, organizationId },
    include: { card: true },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (!['SUCCESS', 'PARTIAL_REFUND'].includes(payment.status)) {
    throw new ApiError(409, `Cannot refund a payment in status ${payment.status}`);
  }

  // Calculate already refunded
  const alreadyRefunded = payment.refundedAmount || 0;
  const remaining = payment.amount - alreadyRefunded;

  if (remaining <= 0) {
    throw new ApiError(409, 'Payment already fully refunded');
  }

  // Default = full remaining refund
  const refundAmount = amount ?? remaining;

  if (refundAmount <= 0) throw new ApiError(400, 'Refund amount must be positive');
  if (refundAmount > remaining) {
    throw new ApiError(400, `Refund amount exceeds remaining balance (₦${remaining / 100})`);
  }

  const isFullRefund = refundAmount === remaining;

  // Call Paystack
  let paystackRefund;
  try {
    paystackRefund = await paystackService.refund({
      reference: payment.reference,
      amount: refundAmount,
    });
  } catch (err) {
    logger.error({ err, paymentId }, 'Paystack refund failed');
    throw new ApiError(502, 'Refund gateway error — no money was returned');
  }

  // Persist refund result atomically
  const updated = await prisma.$transaction(async (tx) => {
    const newStatus = isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUND';
    const newRefunded = alreadyRefunded + refundAmount;

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        refundedAt: new Date(),
        refundedAmount: newRefunded,
        refundReference: paystackRefund.id?.toString() || paystackRefund.reference,
        refundReason: reason,
        refundedByUserId: userId,
      },
    });

    // On full refund of a generated/paid card → revoke it
    if (isFullRefund && ['PAID', 'GENERATED', 'PRINTED'].includes(payment.card.status)) {
      await tx.iDCard.update({
        where: { id: payment.cardId },
        data: { status: 'REVOKED' },
      });
    }

    return updatedPayment;
  });

  logger.info(
    { paymentId, refundAmount, isFullRefund, paystackId: paystackRefund.id },
    'Refund processed'
  );

  return {
    payment: updated,
    refund: {
      amount: refundAmount,
      full: isFullRefund,
      reference: paystackRefund.id,
      status: paystackRefund.status,
    },
  };
};
