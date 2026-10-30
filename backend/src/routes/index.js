import { Router } from 'express';
import authRoutes from './auth.routes.js';
import memberRoutes from './member.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/payments', paymentRoutes);

// These will crash the server if the files don't exist yet!
// router.use('/organizations', orgRoutes);
// router.use('/cards', cardRoutes);
// router.use('/verify', verificationRoutes);

export default router;
