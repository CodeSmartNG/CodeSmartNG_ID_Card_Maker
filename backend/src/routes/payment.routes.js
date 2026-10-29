import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  refundPayment,
  retryCardGeneration,
  reconcilePayments,
  listPayments,
  paymentStats,
  getPayment,
} from '../controllers/payment.controller.js';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

/* =========================================================
   RATE LIMITERS
   ========================================================= */

const paymentInitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many payment attempts, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refundLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many refund attempts, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

const reconcileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Reconciliation throttled, try again shortly' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================================================
   VALIDATION SCHEMAS
   ========================================================= */

const initializeSchema = z.object({
  body: z.object({ cardId: z.string().min(1) }),
});

const refundSchema = z.object({
  body: z.object({
    amount: z.number().int().positive().optional(), // kobo; omit for full refund
    reason: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

const reconcileSchema = z.object({
  body: z
    .object({ dryRun: z.boolean().optional() })
    .optional()
    .default({}),
});

const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND'])
      .optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

/* =========================================================
   ROUTER
   ========================================================= */

const router = Router();

/* ─────────────────────────────────────────────────────────
   1. WEBHOOK  — public, raw body, MUST be first
   (raw body handled in app.js before express.json)
   ───────────────────────────────────────────────────────── */
router.post('/webhook', paystackWebhook);

/* ─────────────────────────────────────────────────────────
   2. USER-FACING (auth required)
   ───────────────────────────────────────────────────────── */
router.post(
  '/initialize',
  requireAuth,
  paymentInitLimiter,
  validate(initializeSchema),
  initializePayment
);

router.get('/verify/:reference', requireAuth, verifyPayment);

/* ─────────────────────────────────────────────────────────
   3. ADMIN ACTIONS (auth + ADMIN role)
   ───────────────────────────────────────────────────────── */
router.post(
  '/:id/refund',
  requireAuth,
  requireRole('ADMIN'),
  refundLimiter,
  validate(refundSchema),
  refundPayment
);

router.post(
  '/:id/retry-generation',
  requireAuth,
  requireRole('ADMIN'),
  validate(idParamSchema),
  retryCardGeneration
);

router.post(
  '/reconcile',
  requireAuth,
  requireRole('ADMIN'),
  reconcileLimiter,
  validate(reconcileSchema),
  reconcilePayments
);

/* ─────────────────────────────────────────────────────────
   4. READ ENDPOINTS (auth required)
   ORDER MATTERS: /stats MUST be before /:id
   ───────────────────────────────────────────────────────── */
router.get('/', requireAuth, validate(listPaymentsSchema), listPayments);
router.get('/stats', requireAuth, paymentStats);
router.get('/:id', requireAuth, validate(idParamSchema), getPayment);

export default router;
