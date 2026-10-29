import { Router } from 'express';
import * as ctrl from '../controllers/member.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { createMemberSchema, updateMemberSchema, listMembersSchema } from '../validations/member.validation.js';
import { z } from 'zod';
import multer from 'multer';

// Configure multer for memory storage (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const idParam = z.object({ id: z.string().min(1) });

const router = Router();

// All member routes require authentication
router.use(requireAuth);

// List
router.get('/', validateQuery(listMembersSchema), ctrl.listMembers);

// Create
router.post('/', validateBody(createMemberSchema), ctrl.createMember);

// Get one
router.get('/:id', validateParams(idParam), ctrl.getMember);

// Update
router.put(
  '/:id',
  validateParams(idParam),
  validateBody(updateMemberSchema),
  ctrl.updateMember
);

// Delete
router.delete('/:id', validateParams(idParam), ctrl.deleteMember);

// Upload photo
router.post(
  '/:id/photo',
  validateParams(idParam),
  upload.single('photo'),
  ctrl.uploadPhoto
);

export default router;
