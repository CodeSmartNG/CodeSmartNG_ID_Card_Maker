import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { paystackService } from '../services/paystackService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { issueRefund } from '../services/refund.service.js';
import { reconcilePendingPayments } from '../services/reconciliation.service.js';
import { generateCardPdf } from '../services/cardGenerator.js'; // 👈 Import the PDF generator

/* =========================================================
   CONSTANTS
   ========================================================= */

const CARD_PRICE_KOBO = 250_000; // ₦2,500
const CURRENCY = 'NGN';
const PAYMENT_TTL_MS = 30 * 60 * 1000; // 30 min

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
      metadata: { cardId: card.id, organizationId: req.user.organizationId },
    });
    return res.json({ authorizationUrl: reinit.authorization_url, reference: existingPending.reference, reused: true });
  }

  const reference = `CSNG-${card.id.slice(-8)}-${Date.now()}`;
  const amount = CARD_PRICE_KOBO;

  const payment = await prisma.payment.create({
    data: {
      reference, amount, currency: CURRENCY, status: 'PENDING', provider: 'paystack',
      cardId: card.id, organizationId: req.user.organizationId,
    },
  });

  if (card.status === 'DRAFT') {
    await prisma.iDCard.update({ where: { id: card.id }, data: { status: 'PENDING_PAYMENT' } });
  }

  let init;
  try {
    init = await paystackService.initialize({
      email: req.user.email, amount, reference: payment.reference,
      callback_url: `${env.CLIENT_URL}/payment/success?ref=${payment.reference}`,
      metadata: { cardId: card.id, organizationId: req.user.organizationId, paymentId: payment.id },
    });
  } catch (err) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', metadata: { error: err.message } } });
    logger.error({ err, reference }, 'Paystack initialize failed');
    throw new ApiError(502, 'Payment gateway unavailable, please try again');
  }

  res.status(201).json({ authorizationUrl: init.authorization_url, reference: payment.reference, amount, currency: CURRENCY });
});

/* =========================================================
   GET /api/payments/verify/:reference
   ========================================================= */

export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  const payment = await prisma.payment.findFirst({
    where: { reference, organizationId: req.user.organizationId },
    include: { card: true },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');

  if (payment.status === 'SUCCESS') {
    return res.json({ status: 'SUCCESS', reference, cardId: payment.cardId, cardStatus: payment.card.status, paidAt: payment.paidAt });
  }

  const verified = await paystackService.verify(reference);

  if (verified.status !== 'success' || verified.amount !== payment.amount || verified.currency !== payment.currency) {
    logger.warn({ reference, verified: verified.status }, 'Payment verification mismatch');
    throw new ApiError(402, 'Payment not confirmed by gateway');
  }

  await finalizeSuccess(payment.id);
  res.json({ status: 'SUCCESS', reference, cardId: payment.cardId, cardStatus: 'PAID', paidAt: new Date() });
});

/* =========================================================
   POST /api/payments/webhook
   ========================================================= */

export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature || !req.body) return res.status(400).send('Bad request');

    const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(req.body).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const hashBuf = Buffer.from(hash, 'hex');
    
    if (sigBuf.length !== hashBuf.length || !crypto.timingSafeEqual(sigBuf, hashBuf)) {
      logger.warn({ ip: req.ip }, 'Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString());
    const { event: eventType, data } = event;

    switch (eventType) {
      case 'charge.success': await handleChargeSuccess(data); break;
      case 'charge.failed': await handleChargeFailed(data); break;
      case 'refund.processed': await handleRefundProcessed(data); break;
      default: logger.info({ eventType }, 'Unhandled webhook event');
    }
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, 'Webhook handler error');
    res.sendStatus(200); // Always ack Paystack
  }
};

/* =========================================================
   ADMIN ENDPOINTS & READS
   ========================================================= */

export const refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const result = await issueRefund({
    paymentId: id, amount: amount ? Number(amount) : null, reason: reason || null,
    userId: req.user.id, organizationId: req.user.organizationId,
  });
  res.json(result);
});

/* POST /api/payments/:id/retry-generation - NOW SYNCHRONOUS */
export const retryCardGeneration = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: { card: { include: { member: true, organization: true } } },
  });

  if (!payment) throw new ApiError(404, 'Payment not found');
  if (payment.status !== 'SUCCESS') throw new ApiError(409, 'Only successful payments can trigger generation');
  if (['GENERATED', 'PRINTED'].includes(payment.card.status)) throw new ApiError(409, 'Card already generated');
  if (payment.card.status === 'REVOKED') throw new ApiError(409, 'Card is revoked');

  try {
    const { pdfUrl } = await generateCardPdf({
      card: payment.card,
      member: payment.card.member,
      organization: payment.card.organization,
      templateName: payment.card.organization.template || 'classic'
    });

    await prisma.iDCard.update({
      where: { id: payment.card.id },
      data: { status: 'GENERATED', pdfUrl },
    });

    res.json({ message: 'Card generated successfully', cardId: payment.card.id, pdfUrl });
  } catch (err) {
    logger.error({ err, cardId: payment.card.id }, 'Manual generation failed');
    throw new ApiError(500, 'Failed to generate PDF');
  }
});

export const reconcilePayments = asyncHandler(async (req, res) => {
  const result = await reconcilePendingPayments({
    organizationId: req.user.organizationId,
    dryRun: Boolean(req.body?.dryRun),
  });
  res.json(result);
});

/* GET /api/payments - ADDED pdfUrl: true */
export const listPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = { organizationId: req.user.organizationId, ...(status && { status }) };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        card: {
          select: {
            id: true,
            cardNumber: true,
            status: true,
            pdfUrl: true, // 👈 CRITICAL: This allows the frontend to show the Download button
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

  res.json({ data, meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
});

export const paymentStats = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totals, monthly, byStatus, refunded] = await Promise.all([
    prisma.payment.aggregate({ where: { organizationId: orgId, status: 'SUCCESS' }, _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { organizationId: orgId, status: 'SUCCESS', paidAt: { gte: since } }, _sum: { amount: true }, _count: true }),
    prisma.payment.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { organizationId: orgId, status: { in: ['REFUNDED', 'PARTIAL_REFUND'] } }, _sum: { refundedAmount: true } }),
  ]);

  res.json({
    totalRevenue: totals._sum.amount || 0,
    totalPayments: totals._count || 0,
    last30Days: { revenue: monthly._sum.amount || 0, payments: monthly._count || 0 },
    refundedTotal: refunded._sum.refundedAmount || 0,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all, amount: s._sum.amount || 0 })),
  });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    include: { card: { include: { member: true } } },
  });
  if (!payment) throw new ApiError(404, 'Payment not found');
  res.json({ payment });
});

/* =========================================================
   HELPERS
   ========================================================= */

const handleChargeSuccess = async (data) => {
  const { reference, amount, currency, paid_at } = data;
  const payment = await prisma.payment.findUnique({ where: { reference } });

  if (!payment) return;
  if (amount !== payment.amount || currency !== payment.currency) return;

  await finalizeSuccess(payment.id, paid_at ? new Date(paid_at) : new Date());
};

const handleChargeFailed = async (data) => {
  const { reference, gateway_response } = data;
  await prisma.payment.updateMany({
    where: { reference, status: 'PENDING' },
    data: { status: 'FAILED', failureReason: gateway_response || null, metadata: { gatewayResponse: gateway_response } },
  });
};

const handleRefundProcessed = async (data) => {
  const { transaction_reference, amount, status } = data;
  const payment = await prisma.payment.findUnique({ where: { reference: transaction_reference } });
  if (!payment || status !== 'processed') return;

  const newTotal = Math.min(payment.amount, (payment.refundedAmount || 0) + Number(amount || 0));
  const isFull = newTotal >= payment.amount;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: isFull ? 'REFUNDED' : 'PARTIAL_REFUND', refundedAt: new Date(), refundedAmount: newTotal },
    });
    if (isFull && payment.cardId) {
      await tx.iDCard.updateMany({ where: { id: payment.cardId, status: { in: ['PAID', 'GENERATED'] } }, data: { status: 'REVOKED' } });
    }
  });
};

/* FINALIZE SUCCESS - NOW SYNCHRONOUS */
const finalizeSuccess = async (paymentId, paidAt = new Date()) => {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { card: { include: { member: true, organization: true } } }, // Include relations for PDF!
    });

    if (!payment) return { ok: false, reason: 'not_found' };
    if (payment.status === 'SUCCESS') return { ok: true, reason: 'already_success', payment };

    await tx.payment.update({ where: { id: paymentId }, data: { status: 'SUCCESS', paidAt } });
    await tx.iDCard.update({ where: { id: payment.cardId }, data: { status: 'PAID' } });

    return { ok: true, reason: 'new', payment };
  });

  if (!result.ok || result.reason !== 'new') return;

  // Generate PDF right now (No Redis/BullMQ needed!)
  try {
    logger.info({ cardId: result.payment.cardId }, 'Synchronously generating PDF...');
    
    const { pdfUrl } = await generateCardPdf({
      card: result.payment.card,
      member: result.payment.card.member,
      organization: result.payment.card.organization,
      templateName: result.payment.card.organization.template || 'classic'
    });

    await prisma.iDCard.update({
      where: { id: result.payment.cardId },
      data: { status: 'GENERATED', pdfUrl },
    });
    
    logger.info({ cardId: result.payment.cardId, pdfUrl }, '✅ PDF generated and saved');
  } catch (err) {
    logger.error({ err, cardId: result.payment.cardId }, '❌ PDF generation failed');
  }
};
