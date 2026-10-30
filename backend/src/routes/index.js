import { Router } from 'express';
import authRoutes from './auth.routes.js';
import memberRoutes from './member.routes.js';
import paymentRoutes from './payment.routes.js';
import cardRoutes from './card.routes.js'; // <-- Make sure this is here
import verificationRoutes from './verification.routes.js';


const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/payments', paymentRoutes);
router.use('/cards', cardRoutes); // <-- Make sure this is here
router.use('/verify', verificationRoutes);

export default router;
