import { Response } from 'express';
import { storage } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Get user's comparison cart
export const getComparisonCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cart = await storage.getComparisonCart(req.userId!);
  res.json(cart);
});

// Add listing to comparison cart
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.body;

  if (!listingId) {
    return res.status(400).json({ error: 'Listing ID is required' });
  }

  // Verify listing exists
  const listing = await storage.getListing(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  try {
    const cart = await storage.addToComparisonCart(req.userId!, listingId);
    res.json(cart);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Remove listing from comparison cart
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params;

  try {
    const cart = await storage.removeFromComparisonCart(req.userId!, listingId);
    res.json(cart);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Clear entire comparison cart
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  await storage.clearComparisonCart(req.userId!);
  res.json({ success: true });
});
