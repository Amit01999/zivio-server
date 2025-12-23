import { Router } from 'express';
import * as reviewsController from '../controllers/reviews.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, reviewsController.createReview);
router.get('/:brokerId', reviewsController.getReviews);

export default router;
