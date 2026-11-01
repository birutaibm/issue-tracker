import { Router } from 'express';
import { list, create } from '../controllers/commentController.js';

const router = Router({ mergeParams: true });

router.get('/', list);
router.post('/', create);

export default router;
