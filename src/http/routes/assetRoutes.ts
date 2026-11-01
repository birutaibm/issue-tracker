import { Router } from 'express';
import { serve } from '../controllers/assetController.js';

const router = Router();

router.get('/projects/:projectSlug/assets/:cardSlug/:filename', serve);

export default router;
