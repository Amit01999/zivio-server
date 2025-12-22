import { Response } from 'express';
import { storage } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const favorites = await storage.getFavorites(req.userId!);
  res.json(favorites);
});

export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.body;

  if (!listingId) {
    return res.status(400).json({ error: 'listingId is required' });
  }

  const favorite = await storage.addFavorite(req.userId!, listingId);
  res.status(201).json(favorite);
});

export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params;

  const success = await storage.removeFavorite(req.userId!, listingId);
  if (!success) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  res.json({ success: true });
});
