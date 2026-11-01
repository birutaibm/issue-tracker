import { Router } from 'express';
import { list, create, remove } from '../controllers/commentController.js';

const router = Router({ mergeParams: true });

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

export default router;
