import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { paystackService } from '../services/paystackService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { enqueueCardGeneration } from '../jobs/cardGeneration.job.js';
import { issueRefund } from '../services/refund.service.js';
import { reconcilePendingPayments } from '../services/reconciliation.service.js';

/* =========================================================
   CONSTANTS
   ========================================================= */

const CARD_PRICE_KOBO = 250_000; // ₦2,500
const CURRENCY = 'NGN';
const PAYMENT_TTL_MS = 30 * 60 * 1000; // 30 min — abandon stale pendings

/* =========================================================
   POST /api/payments/initialize
   ========================================================= */

export const initializePayment = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) throw new ApiError(400, 'cardId is required');

  const card = await prisma.iDCard.findFirst({
    where: { id: cardId, organizationId: req.user.organizationId },
    include: {
      member: true,
      organization: { select: { id: true, name: true, email: true } },
    },
  });

  if (!card) throw new ApiError(404, 'Card not found');
  if (['PAID', 'GENERATED', 'PRINTED'].includes(card.status)) {
    throw new ApiError(409, `Card is already ${card.status.toLowerCase()}`);
  }
  if (card.status === 'REVOKED') {
    throw new ApiError(409, 'Cannot pay for a revoked card');
  }

  // ✅ IDEMPOTENCY: reuse an existing open PENDING payment within TTL
  const existingPending = await prisma.payment.findFirst({
    where: {
      cardId: card.id,
      organizationId: req.user.organizationId,
      status: 'PENDING',
      createdAt: { gte: new Date(Date.now() - PAYMENT_TTL_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPending) {
    const reinit = await paystackService.initialize({
      email: req.user.email,
      amount: existingPending.amount,
      reference: existingPending.reference,
      callback_url: `${env.CLIENT_URL}/payment/success?ref=${existingPending.reference}`,
      metadata: {
        cardId: card.id,
        organizationId: req.user.organizationId,
        memberName: `${card.member.firstName} ${card.member.lastName}`,
      },
    });

    return res.json({
      authorizationUrl: reinit.authorization_url,
      reference: existingPending.reference,
      reused: true,
    });
  }

  // ✅ New payment
  const reference = `CSNG-${card.id.slice(-8)}-${Date.now()}`;
  const amount = CARD_PRICE_KOBO;

  const payment = await prisma.payment.create({
    data: {
      reference,
      amount,
      currency: CURRENCY,
      status: 'PENDING',
      provider: 'paystack',
      cardId: card.id,
      organizationId: req.user.organizationId,
      metadata: {
        memberName: `${card.member.firstName} ${card.member.lastName}`,
        organizationName: card.organization.name,
      },
    },
  });

  // Bump card into PENDING_PAYMENT only if still DRAFT
  if (card.status === 'DRAFT') {
    await prisma.iDCard.update({
      where: { id: card.id },
      data: { status: 'PENDING_PAYMENT' },
    });
  }

  let init;
  try {
    init = await paystackService.initialize({
      email: req.user.email,
      amount,
      reference: payment.reference,
      callback_url: `${env.CLIENT_URL}/payment/success?ref=${payment.reference}`,
      metadata: {
        cardId: card.id,
        organizationId: req.user.organizationId,
        paymentId: payment.id,
      },
    });
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', metadata: { ...payment.metadata, error: err.message } },
    });
    logger.error({ err, reference }, 'Paystack initialize failed');
    throw new ApiError(502, 'Payment gateway unavailable, please try again');
  }

  res.status(201).json({
    authorizationUrl: init.authorization_url,
    reference: payment.reference,
    amount,
    currency: CURRENCY,
  });
});

/* =========================================================
   GET /api/payments/verify/:reference
   Called by the frontend success page after Paystack redirect.
   Confirms status WITHOUT trusting the redirect.
   ========================================================= */

export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  const payment = await prisma.payment.findFirst({
    where: {
      reference,
      organizationId: req.user.organizationId,
    },
    include: { card: true },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  // Already finalized — return cached
  if (payment.status === 'SUCCESS') {
    return res.json({
      status: 'SUCCESS',
      reference,
      cardId: payment.cardId,
      cardStatus: payment.card.status,
      paidAt: payment.paidAt,
    });
  }

  // Ask Paystack directly
  const verified = await paystackService.verify(reference);

  if (
    verified.status !== 'success' ||
    verified.amount !== payment.amount ||
    verified.currency !== payment.currency
  ) {
    logger.warn(
      { reference, verified: verified.status, amount: verified.amount },
      'Payment verification mismatch'
    );
    throw new ApiError(402, 'Payment not confirmed by gateway');
  }

  // Finalize (idempotent, safe to call twice)
  await finalizeSuccess(payment.id);

  res.json({
    status: 'SUCCESS',
    reference,
    cardId: payment.cardId,
    cardStatus: 'PAID',
    paidAt: new Date(),
  });
});

/* =========================================================
   POST /api/payments/webhook
   Must receive RAW body (configured in app.js).
   Always return 200 unless signature is invalid.
   ========================================================= */

export const paystackWebhook = async (req, res) => {
  try {
    // ✅ 1. Signature verification
    const signature = req.headers['x-paystack-signature'];
    if (!signature || !req.body) {
      logger.warn('Webhook missing signature or body');
      return res.status(400).send('Bad request');
    }

    const hash = crypto
      .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(req.body) // Buffer — MUST be raw
      .digest('hex');

    // timing-safe compare
    const sigBuf = Buffer.from(signature, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    if (sigBuf.length !== hashBuf.length || !crypto.timingSafeEqual(sigBuf, hashBuf)) {
      logger.warn({ ip: req.ip }, 'Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    // ✅ 2. Parse event
    const event = JSON.parse(req.body.toString());
    const { event: eventType, data } = event;

    logger.info({ eventType, reference: data?.reference }, 'Webhook received');

    // ✅ 3. Handle events
    switch (eventType) {
      case 'charge.success': {
        await handleChargeSuccess(data);
        break;
      }
      case 'charge.failed': {
        await handleChargeFailed(data);
        break;
      }
      case 'refund.processed': {
        await handleRefundProcessed(data);
        break;
      }
      case 'refund.failed': {
        logger.warn(
          { reference: data?.transaction_reference },
          'Refund failed at Paystack'
        );
        break;
      }
      case 'transfer.success':
      case 'transfer.failed': {
        logger.info({ eventType, reference: data?.reference }, 'Non-charge event ignored');
        break;
      }
      default: {
        logger.info({ eventType }, 'Unhandled webhook event');
      }
    }

    // ✅ 4. ALWAYS ack — prevents Paystack retry storms
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err, body: req.body?.toString?.().slice(0, 500) }, 'Webhook handler error');
    res.sendStatus(200);
  }
};

/* =========================================================
   ADMIN ENDPOINTS
   ========================================================= */

/* POST /api/payments/:id/refund (ADMIN) */
export const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const result = await issueRefund({
    paymentId: id,
    amount: amount ? Number(amount) : null,
    reason: reason || null,
    userId: req.user.id,
    organizationId: req.user.organizationId,
  });

  res.json(result);
});

/* POST /api/payments/:id/retry-generation (ADMIN) */
export const retryCardGeneration = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: { card: true },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== 'SUCCESS') {
    throw new ApiError(409, 'Only successful payments can trigger generation');
  }
  if (['GENERATED', 'PRINTED'].includes(payment.card.status)) {
    throw new ApiError(409, 'Card already generated');
  }
  if (payment.card.status === 'REVOKED') {
    throw new ApiError(409, 'Card is revoked');
  }

  if (payment.card.status !== 'PAID') {
    await prisma.iDCard.update({
      where: { id: payment.card.id },
      data: { status: 'PAID' },
    });
  }

  await enqueueCardGeneration(payment.card.id);

  logger.info(
    { paymentId: payment.id, cardId: payment.card.id, by: req.user.id },
    'Card generation retried'
  );

  res.json({
    message: 'Card generation re-enqueued',
    cardId: payment.card.id,
    jobId: `card:${payment.card.id}`,
  });
});

/* POST /api/payments/reconcile (ADMIN) */
export const reconcilePayments = asyncHandler(async (req, res) => {
  const { dryRun = false } = req.body || {};
  const result = await reconcilePendingPayments({
    organizationId: req.user.organizationId,
    dryRun: Boolean(dryRun),
  });
  res.json(result);
});

/* =========================================================
   READ ENDPOINTS
   ========================================================= */

/* GET /api/payments */
export const listPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, from, to } = req.query;

  const where = {
    organizationId: req.user.organizationId,
    ...(status && { status }),
    ...(from || to
      ? {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        card: {
          select: {
            id: true,
            cardNumber: true,
            status: true,
            member: { select: { firstName: true, lastName: true, memberNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/* GET /api/payments/stats */
export const paymentStats = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totals, monthly, byStatus, refunded] = await Promise.all([
    prisma.payment.aggregate({
      where: { organizationId: orgId, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { organizationId: orgId, status: 'SUCCESS', paidAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        organizationId: orgId,
        status: { in: ['REFUNDED', 'PARTIAL_REFUND'] },
      },
      _sum: { refundedAmount: true },
    }),
  ]);

  res.json({
    totalRevenue: totals._sum.amount || 0,
    totalPayments: totals._count || 0,
    last30Days: { revenue: monthly._sum.amount || 0, payments: monthly._count || 0 },
    refundedTotal: refunded._sum.refundedAmount || 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count._all,
      amount: s._sum.amount || 0,
    })),
  });
});

/* GET /api/payments/:id */
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: {
      card: {
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberNumber: true,
              email: true,
            },
          },
        },
      },
    },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ payment });
});

/* =========================================================
   HELPERS
   ========================================================= */

const handleChargeSuccess = async (data) => {
  const { reference, amount, currency, paid_at } = data;

  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { card: true },
  });

  if (!payment) {
    logger.warn({ reference }, 'Webhook: payment not found');
    return;
  }

  // Amount + currency guard
  if (amount !== payment.amount) {
    logger.error(
      { reference, expected: payment.amount, received: amount },
      'Webhook amount mismatch — ignoring'
    );
    return;
  }
  if (currency !== payment.currency) {
    logger.error(
      { reference, expected: payment.currency, received: currency },
      'Webhook currency mismatch — ignoring'
    );
    return;
  }

  await finalizeSuccess(payment.id, paid_at ? new Date(paid_at) : new Date());
};

const handleChargeFailed = async (data) => {
  const { reference, gateway_response } = data;

  const result = await prisma.payment.updateMany({
    where: { reference, status: 'PENDING' },
    data: {
      status: 'FAILED',
      failureReason: gateway_response || null,
      metadata: { gatewayResponse: gateway_response },
      lastEventAt: new Date(),
    },
  });

  if (result.count > 0) {
    logger.info({ reference }, 'Payment marked FAILED via webhook');
  }
};

const handleRefundProcessed = async (data) => {
  const { transaction_reference, amount, status } = data;

  const payment = await prisma.payment.findUnique({
    where: { reference: transaction_reference },
  });

  if (!payment) {
    logger.warn({ reference: transaction_reference }, 'Refund webhook: payment not found');
    return;
  }

  if (status && status !== 'processed') {
    logger.warn(
      { reference: transaction_reference, status },
      'Refund webhook: non-success status'
    );
    return;
  }

  const alreadyRefunded = payment.refundedAmount || 0;
  const newTotal = Math.min(payment.amount, alreadyRefunded + Number(amount || 0));
  const isFull = newTotal >= payment.amount;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: isFull ? 'REFUNDED' : 'PARTIAL_REFUND',
        refundedAt: payment.refundedAt || new Date(),
        refundedAmount: newTotal,
        lastEventAt: new Date(),
      },
    });

    if (isFull && payment.cardId) {
      await tx.iDCard.updateMany({
        where: {
          id: payment.cardId,
          status: { in: ['PAID', 'GENERATED', 'PRINTED'] },
        },
        data: { status: 'REVOKED' },
      });
    }
  });

  logger.info(
    { reference: transaction_reference, refundAmount: amount, isFull },
    'Refund confirmed via webhook'
  );
};

const finalizeSuccess = async (paymentId, paidAt = new Date()) => {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { card: true },
    });

    if (!payment) return { ok: false, reason: 'not_found' };
    if (payment.status === 'SUCCESS') return { ok: true, reason: 'already_success', payment };

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', paidAt, lastEventAt: new Date() },
    });

    await tx.iDCard.update({
      where: { id: payment.cardId },
      data: { status: 'PAID' },
    });

    return { ok: true, reason: 'new', payment };
  });

  if (!result.ok) {
    logger.warn({ paymentId, reason: result.reason }, 'finalizeSuccess no-op');
    return;
  }

  if (result.reason === 'new') {
    try {
      await enqueueCardGeneration(result.payment.cardId);
      logger.info({ cardId: result.payment.cardId }, 'Card generation enqueued');
    } catch (err) {
      logger.error(
        { err, cardId: result.payment.cardId },
        'Failed to enqueue card generation — manual retry needed'
      );
    }
  }
};
