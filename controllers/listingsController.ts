import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service';
import { type SearchFilters } from '../types/schema.js';

export async function getListingsHandler(req: any, res: Response) {
  try {
    const filters: SearchFilters = {
      q: req.query.q as string,
      city: req.query.city as string,
      area: req.query.area as string,
      listingType: req.query.listingType as any,
      propertyType: req.query.propertyType as any,
      category: req.query.category as string,
      completionStatus: req.query.completionStatus as any,
      furnishingStatus: req.query.furnishingStatus as any,
      minPrice: req.query.minPrice
        ? parseInt(req.query.minPrice as string)
        : undefined,
      maxPrice: req.query.maxPrice
        ? parseInt(req.query.maxPrice as string)
        : undefined,
      bedrooms: req.query.bedrooms
        ? parseInt(req.query.bedrooms as string)
        : undefined,
      bathrooms: req.query.bathrooms
        ? parseInt(req.query.bathrooms as string)
        : undefined,
      minArea: req.query.minArea
        ? parseInt(req.query.minArea as string)
        : undefined,
      maxArea: req.query.maxArea
        ? parseInt(req.query.maxArea as string)
        : undefined,
      isFeatured: req.query.isFeatured === 'true',
      isVerified: req.query.isVerified === 'true',
      sortBy: req.query.sortBy as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
    };

    const result = await storage.getListings(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
}

export async function getMyListingsHandler(req: any, res: Response) {
  try {
    const result = await storage.getUserListings(req.userId!);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
}

export async function getListingBySlugHandler(req: any, res: Response) {
  try {
    const listing = await storage.getListingBySlug(req.params.slug);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    await storage.incrementListingViews(listing.id);
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
}

export async function createListingHandler(req: any, res: Response) {
  try {
    const listingData = {
      ...req.body,
      postedBy: req.userId,
      status: 'pending',
    };
    const listing = await storage.createListing(listingData as any);
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create listing' });
  }
}

export async function updateListingHandler(req: any, res: Response) {
  try {
    const listing = await storage.getListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.postedBy !== req.userId) {
      const user = await storage.getUser(req.userId!);
      if (user?.role !== 'admin')
        return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await storage.updateListing(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update listing' });
  }
}

export async function deleteListingHandler(req: any, res: Response) {
  try {
    const listing = await storage.getListing(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.postedBy !== req.userId) {
      const user = await storage.getUser(req.userId!);
      if (user?.role !== 'admin')
        return res.status(403).json({ error: 'Not authorized' });
    }

    await storage.deleteListing(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
}
