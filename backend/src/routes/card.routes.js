import { Router } from 'express';
import * as ctrl from '../controllers/card.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { z } from 'zod';

const createSchema = z.object({
  memberId: z.string().min(1),
  template: z.enum(['classic', 'modern', 'minimal']).optional(),
});

const router = Router();
router.use(requireAuth);

router.post('/', validateBody(createSchema), ctrl.createCard);
router.get('/:id/preview', ctrl.previewCard);

export default router;
