import { Router } from 'express';
import { listByProject, create, getById, update, remove } from '../controllers/cardController.js';

const router = Router({ mergeParams: true });

router.get('/', listByProject);
router.post('/', create);
router.get('/:id', getById);
router.patch('/:id', update);
router.delete('/:id', remove);

export default router;
