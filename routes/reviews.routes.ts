import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, reviewsController.createReview);
router.get('/:brokerId', reviewsController.getReviews);

export default router;
