import { Response } from 'express';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get buyer dashboard stats
export const getBuyerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storage.getBuyerStats(req.userId!);
  res.json(stats);
});

// Get seller dashboard stats
export const getSellerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storage.getSellerStats(req.userId!);
  res.json(stats);
});

// Get broker dashboard stats
export const getBrokerDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storage.getBrokerStats(req.userId!);
  res.json(stats);
});

// Get admin dashboard stats (reuse existing admin stats)
export const getAdminDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storage.getStats();
  res.json(stats);
});

// Get listing analytics (for sellers/brokers)
export const getListingAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params;

  // Verify listing exists and user has access
  const listing = await storage.getListing(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  // Check authorization: owner, broker, or admin
  const isAuthorized =
    listing.postedBy === req.userId ||
    listing.brokerId === req.userId ||
    req.user?.role === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Not authorized to view analytics for this listing' });
  }

  const analytics = await storage.getListingAnalytics(listingId);
  res.json(analytics);
});
