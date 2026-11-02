import { Router } from 'express';
import * as ctrl from '../controllers/member.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { 
  createMemberSchema, 
  updateMemberSchema, 
  listMembersSchema,
  bulkCreateMemberSchema 
} from '../validations/member.validation.js';
import { z } from 'zod';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const idParam = z.object({ id: z.string().min(1) });

const router = Router();
router.use(requireAuth);

router.get('/', validateQuery(listMembersSchema), ctrl.listMembers);
router.post('/', validateBody(createMemberSchema), ctrl.createMember);

// 👇 BULK ROUTE MUST BE HERE
router.post('/bulk', validateBody(bulkCreateMemberSchema), ctrl.bulkCreateMembers);

router.get('/:id', validateParams(idParam), ctrl.getMember);
router.put('/:id', validateParams(idParam), validateBody(updateMemberSchema), ctrl.updateMember);
router.delete('/:id', validateParams(idParam), ctrl.deleteMember);
router.post('/:id/photo', validateParams(idParam), upload.single('photo'), ctrl.uploadPhoto);

export default router;
