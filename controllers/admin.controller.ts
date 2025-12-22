import { Response } from 'express';
import { storage } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await storage.getStats();
  res.json(stats);
});

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const users = await storage.getUsers();
  res.json(users);
});

export const getListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = req.query.status as any;
  const filters = status ? { status } : {};

  const result = await storage.getListings(filters as any);
  res.json(result);
});

export const approveListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.updateListing(req.params.id, {
    status: 'published',
    isVerified: true
  });

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json(listing);
});

export const rejectListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.updateListing(req.params.id, {
    status: 'rejected'
  });

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json(listing);
});

export const getBrokers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const brokers = await storage.getBrokers();
  res.json(brokers);
});

export const verifyBroker = asyncHandler(async (req: AuthRequest, res: Response) => {
  const broker = await storage.updateBroker(req.params.id, {
    verified: true
  });

  if (!broker) {
    return res.status(404).json({ error: 'Broker not found' });
  }

  res.json(broker);
});

// Get all inquiries (admin only)
export const getAllInquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters = {
    status: req.query.status as any,
    requestType: req.query.requestType as any,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20
  };

  const result = await storage.getAllPropertyInquiries(filters);
  res.json(result);
});

// Feature/Unfeature a listing
export const toggleFeatured = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListing(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const updated = await storage.updateListing(req.params.id, {
    isFeatured: !listing.isFeatured
  });

  res.json(updated);
});

// Delete any listing (admin only)
export const deleteListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListing(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  await storage.deleteListing(req.params.id);
  res.json({ success: true });
});

// Get a single listing by ID (admin only)
export const getListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListing(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json(listing);
});

// Update any listing (admin only)
export const updateListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListing(req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const updated = await storage.updateListing(req.params.id, req.body);
  res.json(updated);
});

// Update user role or details (admin only)
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await storage.getUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updated = await storage.updateUser(req.params.id, req.body);
  res.json(updated);
});

// Delete user (admin only)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await storage.getUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await storage.deleteUser(req.params.id);
  res.json({ success: true });
});
