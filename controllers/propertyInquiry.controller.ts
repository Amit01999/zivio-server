import { Response } from 'express';
import { z } from 'zod';
import { storage } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { insertPropertyInquirySchema, inquiryStatuses } from '../types/schema.js';

// Create a new property inquiry
export const createInquiry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = insertPropertyInquirySchema.parse({
    ...req.body,
    buyerId: req.userId,
    status: 'new'
  });

  const inquiry = await storage.createPropertyInquiry(data);
  res.status(201).json(inquiry);
});

// Get buyer's own inquiries
export const getBuyerInquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inquiries = await storage.getPropertyInquiriesByBuyer(req.userId!);
  res.json({ data: inquiries });
});

// Get inquiry details
export const getInquiryDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const inquiry = await storage.getPropertyInquiry(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  // Check authorization: buyer can see their own, owner can see inquiries for their property, admin can see all
  const isAuthorized =
    inquiry.buyerId === req.userId ||
    inquiry.property?.postedBy === req.userId ||
    req.user?.role === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Not authorized to view this inquiry' });
  }

  res.json(inquiry);
});

// Update inquiry status (owner/admin only)
export const updateInquiryStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body;

  if (!inquiryStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const inquiry = await storage.getPropertyInquiry(req.params.id);

  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  // Check authorization: property owner or admin
  const isAuthorized =
    inquiry.property?.postedBy === req.userId || req.user?.role === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Not authorized to update this inquiry' });
  }

  const updated = await storage.updatePropertyInquiryStatus(req.params.id, status);
  res.json(updated);
});

// Get all inquiries for a specific listing (owner/admin only)
export const getListingInquiries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const listing = await storage.getListing(req.params.listingId);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  // Check authorization: property owner or admin
  const isAuthorized =
    listing.postedBy === req.userId || req.user?.role === 'admin';

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Not authorized to view inquiries for this listing' });
  }

  const inquiries = await storage.getPropertyInquiriesByListing(req.params.listingId);
  res.json({ data: inquiries });
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
