import { Router } from 'express';
import * as ctrl from '../controllers/organization.controller.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(requireAuth);
router.put('/me', ctrl.updateOrganization);
router.post('/me/logo', upload.single('logo'), ctrl.uploadLogo);

export default router;
