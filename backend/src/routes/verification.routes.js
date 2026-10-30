import { Router } from 'express';
import { verifyCard } from '../controllers/verification.controller.js';

const router = Router();

// No requireAuth() here because this is public
router.get('/:id', verifyCard);

export default router;
