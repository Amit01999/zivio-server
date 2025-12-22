import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, favoritesController.getFavorites);
router.post('/', authMiddleware, favoritesController.addFavorite);
router.delete('/:listingId', authMiddleware, favoritesController.removeFavorite);

export default router;
