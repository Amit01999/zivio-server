import { Response } from 'express';
import { z } from 'zod';
import { insertListingSchema, type SearchFilters } from '../types/schema.js';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const filters: SearchFilters = {
    q: req.query.q as string,
    city: req.query.city as string,
    area: req.query.area as string,
    listingType: req.query.listingType as any,
    propertyType: req.query.propertyType as any,
    category: req.query.category as string,
    completionStatus: req.query.completionStatus as any,
    furnishingStatus: req.query.furnishingStatus as any,
    minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
    bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
    bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
    minArea: req.query.minArea ? parseInt(req.query.minArea as string) : undefined,
    maxArea: req.query.maxArea ? parseInt(req.query.maxArea as string) : undefined,
    amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
    isFeatured: req.query.isFeatured === 'true',
    isVerified: req.query.isVerified === 'true',
    sortBy: req.query.sortBy as any,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 12
  };

  const result = await storage.getListings(filters);
  res.json(result);
});

export const getMyListings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await storage.getUserListings(req.userId!);
  res.json(result);
});

export const getListingBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListingBySlug(req.params.slug);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if ((listing as any).status === 'published') {
    await storage.incrementListingViews((listing as any).id);
  }

  res.json(listing);
});

export const createListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('=== CREATE LISTING API CALLED ===');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('User ID:', req.userId);
  console.log('User role:', req.user?.role);

  try {
    console.log('Validating request body with Zod schema...');
    const data = insertListingSchema.parse(req.body);
    console.log('✓ Validation passed');

    console.log('Fetching broker information...');
    const broker = await storage.getBrokerByUserId(req.userId!);
    console.log('Broker:', broker ? `Found (ID: ${broker.id})` : 'Not found');

    // Admin uploads bypass approval workflow and go straight to published
    const isAdmin = req.user?.role === 'admin';
    const status = isAdmin ? 'published' : 'pending';
    const isVerified = isAdmin ? true : (broker?.verified || false);

    console.log('Creating listing with status:', status);
    const listing = await storage.createListing({
      ...data,
      postedBy: req.userId!,
      brokerId: broker?.id || null,
      isFeatured: false,
      isVerified,
      status
    });

    console.log('✓ Listing created successfully:', listing.id);
    res.status(201).json(listing);
  } catch (error: any) {
    console.error('=== CREATE LISTING ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;  // Re-throw to let asyncHandler handle it
  }
});

export const updateListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await storage.getListing(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (existing.postedBy !== req.userId) {
    return res.status(403).json({ error: 'Not authorized to update this listing' });
  }

  const updates = insertListingSchema.partial().parse(req.body);
  const listing = await storage.updateListing(req.params.id, updates as any);

  res.json(listing);
});

export const deleteListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = await storage.getListing(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (existing.postedBy !== req.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this listing' });
  }

  await storage.deleteListing(req.params.id);
  res.json({ success: true });
});
