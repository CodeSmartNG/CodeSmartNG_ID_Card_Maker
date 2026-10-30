import { Router } from 'express';
import authRoutes from './auth.routes.js';
import memberRoutes from './member.routes.js';
import paymentRoutes from './payment.routes.js'; // <-- Add this import

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/payments', paymentRoutes); // <-- Add this line

// Note: Comment out the ones below until you actually create those files!
// router.use('/organizations', orgRoutes);
// router.use('/cards', cardRoutes);
// router.use('/verify', verificationRoutes);

export default router;
