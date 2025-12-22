import { Router } from 'express';
import {
  getComparisonCart,
  addToCart,
  removeFromCart,
  clearCart
} from '../controllers/comparisonCart.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get user's comparison cart
router.get('/', getComparisonCart);

// Add listing to cart
router.post('/', addToCart);

// Remove listing from cart
router.delete('/:listingId', removeFromCart);

// Clear entire cart
router.delete('/', clearCart);

export default router;
