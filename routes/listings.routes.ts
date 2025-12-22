import { Router } from 'express';
import * as listingsController from '../controllers/listings.controller';
import { authMiddleware, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, listingsController.getListings);
router.get('/my', authMiddleware, listingsController.getMyListings);
router.get('/:slug', optionalAuth, listingsController.getListingBySlug);
router.post('/', authMiddleware, listingsController.createListing);
router.patch('/:id', authMiddleware, listingsController.updateListing);
router.delete('/:id', authMiddleware, listingsController.deleteListing);

export default router;
