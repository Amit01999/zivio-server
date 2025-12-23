import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service.js';

export async function getFavoritesHandler(req: any, res: Response) {
  try {
    const favorites = await storage.getFavorites(req.userId!);
    res.json({ data: favorites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}

export async function addFavoriteHandler(req: any, res: Response) {
  try {
    const { listingId } = req.body;
    if (!listingId)
      return res.status(400).json({ error: 'listingId is required' });
    const favorite = await storage.addFavorite(req.userId!, listingId);
    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add favorite' });
  }
}

export async function removeFavoriteHandler(req: any, res: Response) {
  try {
    await storage.removeFavorite(req.userId!, req.params.listingId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}
