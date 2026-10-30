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
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';

/* =========================================================
   RATE LIMITERS
   ========================================================= */

const paymentInitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many payment attempts, slow down' },
});

const refundLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many refund attempts, slow down' },
});

const reconcileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: 'Reconciliation throttled, try again shortly' },
});

/* =========================================================
   VALIDATION SCHEMAS (Body only now)
   ========================================================= */

const initializeSchema = z.object({ cardId: z.string().min(1) });

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
});

const reconcileSchema = z.object({
  dryRun: z.boolean().optional().default(false),
});

const listPaymentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const idParam = z.object({ id: z.string().min(1) });

/* =========================================================
   ROUTER
   ========================================================= */

const router = Router();

// 1. WEBHOOK (must be first, public)
router.post('/webhook', paystackWebhook);

// 2. USER-FACING
router.post('/initialize', requireAuth, paymentInitLimiter, validateBody(initializeSchema), initializePayment);
router.get('/verify/:reference', requireAuth, verifyPayment);

// 3. ADMIN ACTIONS
router.post('/:id/refund', requireAuth, requireRole('ADMIN'), refundLimiter, validateParams(idParam), validateBody(refundSchema), refundPayment);
router.post('/:id/retry-generation', requireAuth, requireRole('ADMIN'), validateParams(idParam), retryCardGeneration);
router.post('/reconcile', requireAuth, requireRole('ADMIN'), reconcileLimiter, validateBody(reconcileSchema), reconcilePayments);

// 4. READS (Order matters: /stats before /:id)
router.get('/', requireAuth, validateQuery(listPaymentsSchema), listPayments);
router.get('/stats', requireAuth, paymentStats);
router.get('/:id', requireAuth, validateParams(idParam), getPayment);

export default router;
