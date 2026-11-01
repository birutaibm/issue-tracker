import { Router } from 'express';
import projectRoutes from './routes/projectRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import {
  getById as getCardById,
  update as updateCard,
  remove as deleteCard,
} from './controllers/cardController.js';

const router = Router();

router.use('/projects', projectRoutes);
router.use('/projects/:projectId/cards', cardRoutes);
router.use('/cards/:cardId/comments', commentRoutes);

// Direct card access by ID (for card detail view)
router.get('/cards/:id', getCardById);
router.patch('/cards/:id', updateCard);
router.delete('/cards/:id', deleteCard);

router.use('/', assetRoutes);

export default router;
