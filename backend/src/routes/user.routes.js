import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Require authentication AND Admin role for all staff management
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', ctrl.listStaff);
router.post('/', ctrl.inviteStaff);
router.delete('/:id', ctrl.removeStaff);

export default router;
