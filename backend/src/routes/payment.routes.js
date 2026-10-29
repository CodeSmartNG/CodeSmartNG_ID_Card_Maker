import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const paymentInitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many payment attempts, slow down' },
});

const initializeSchema = z.object({
  body: z.object({ cardId: z.string().min(1) }),
});

const router = Router();

// Webhook — public, raw body, no auth. Placed FIRST so it's never shadowed.
router.post('/webhook', paystackWebhook);

// Authenticated endpoints
router.post(
  '/initialize',
  requireAuth,
  paymentInitLimiter,
  validate(initializeSchema),
  initializePayment
);

router.get('/verify/:reference', requireAuth, verifyPayment);

export default router;
