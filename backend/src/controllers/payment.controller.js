import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { paystackService } from '../services/paystackService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { enqueueCardGeneration } from '../jobs/cardGeneration.job.js';
import { issueRefund } from '../services/refund.service.js';           // + ADD
import { reconcilePendingPayments } from '../services/reconciliation.service.js'; // + ADD
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
    // Re-initialize the same reference with Paystack (safe, idempotent upstream)
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
    // Roll back the payment row so user can retry cleanly
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
      case 'transfer.success':
      case 'transfer.failed':
      case 'refund.processed': {
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
    // Still ack so Paystack doesn't retry endlessly on our bug — check logs instead
    res.sendStatus(200);
  }
};

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

  // ✅ Amount + currency guard (protects against tampered/partial charges)
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

  // ✅ Idempotent — safe to receive twice
  await finalizeSuccess(payment.id, paid_at ? new Date(paid_at) : new Date());
};

const handleChargeFailed = async (data) => {
  const { reference, gateway_response } = data;

  // Use updateMany so it's a no-op if already SUCCESS
  const result = await prisma.payment.updateMany({
    where: { reference, status: 'PENDING' },
    data: {
      status: 'FAILED',
      metadata: { gatewayResponse: gateway_response },
    },
  });

  if (result.count > 0) {
    logger.info({ reference }, 'Payment marked FAILED via webhook');
  }
};

const finalizeSuccess = async (paymentId, paidAt = new Date()) => {
  // ✅ Atomic transaction — payment + card + enqueue
  const result = await prisma.$transaction(async (tx) => {
    // Guard: only transition if still PENDING (or already SUCCESS for idempotency)
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { card: true },
    });

    if (!payment) return { ok: false, reason: 'not_found' };
    if (payment.status === 'SUCCESS') return { ok: true, reason: 'already_success', payment };

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', paidAt },
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

  // ✅ Enqueue AFTER commit — only if we just transitioned
  if (result.reason === 'new') {
    try {
      await enqueueCardGeneration(result.payment.cardId);
      logger.info({ cardId: result.payment.cardId }, 'Card generation enqueued');
    } catch (err) {
      logger.error(
        { err, cardId: result.payment.cardId },
        'Failed to enqueue card generation — manual retry needed'
      );
      // Card is PAID but no job — user can re-trigger via admin endpoint
    }
  }
};
