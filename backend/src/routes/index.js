import { Router } from 'express';
import authRoutes from './auth.routes.js';
// import others...

const router = Router();
router.use('/auth', authRoutes);
// router.use('/organizations', orgRoutes);
// router.use('/members', memberRoutes);
// router.use('/cards', cardRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/verify', verificationRoutes);

export default router;
