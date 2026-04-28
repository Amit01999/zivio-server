import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, favoritesController.getFavorites);
router.post('/', authMiddleware, favoritesController.addFavorite);
// Static path must come before /:listingId to avoid Express treating "check" as an id
router.get('/check/:listingId', authMiddleware, favoritesController.checkFavorite);
router.delete('/:listingId', authMiddleware, favoritesController.removeFavorite);

export default router;
