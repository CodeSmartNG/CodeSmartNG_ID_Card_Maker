import { prisma } from '../config/database.js';
import { paystackService } from '../services/paystackService.js';
import { logger } from '../config/logger.js';
import { enqueueCardGeneration } from '../jobs/cardGeneration.job.js';

const STALE_MINUTES = 10;

/**
 * Reconcile PENDING payments older than STALE_MINUTES by asking Paystack.
 * Useful when webhooks fail (network, misconfig, Paystack downtime).
 */
export const reconcilePendingPayments = async ({ organizationId, dryRun = false }) => {
  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);

  const stale = await prisma.payment.findMany({
    where: {
      organizationId,
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    take: 50, // cap per run
    orderBy: { createdAt: 'asc' },
  });

  const results = { checked: stale.length, success: [], failed: [], skipped: [] };

  for (const payment of stale) {
    try {
      const verified = await paystackService.verify(payment.reference);

      if (verified.status === 'success') {
        // Amount guard
        if (verified.amount !== payment.amount) {
          logger.error(
            { reference: payment.reference, expected: payment.amount, got: verified.amount },
            'Reconciliation amount mismatch'
          );
          results.skipped.push({ reference: payment.reference, reason: 'amount_mismatch' });
          continue;
        }

        if (!dryRun) {
          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'SUCCESS',
                paidAt: new Date(verified.paid_at || Date.now()),
                reconciliationNote: `Recovered from webhook miss @ ${new Date().toISOString()}`,
              },
            }),
            prisma.iDCard.update({
              where: { id: payment.cardId },
              data: { status: 'PAID' },
            }),
          ]);
          await enqueueCardGeneration(payment.cardId);
        }
        results.success.push(payment.reference);
      } else if (['failed', 'abandoned', 'reversed'].includes(verified.status)) {
        if (!dryRun) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: verified.gateway_response || verified.status,
              reconciliationNote: `Reconciled: Paystack reports ${verified.status}`,
            },
          });
        }
        results.failed.push({ reference: payment.reference, status: verified.status });
      } else {
        results.skipped.push({ reference: payment.reference, reason: verified.status });
      }
    } catch (err) {
      logger.warn({ err, reference: payment.reference }, 'Reconcile: verify failed');
      results.skipped.push({ reference: payment.reference, reason: 'verify_error' });
    }
  }

  logger.info({ ...results, dryRun }, 'Reconciliation run complete');
  return { ...results, dryRun };
};
