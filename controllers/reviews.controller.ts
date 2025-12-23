import { Request, Response } from 'express';
import { insertReviewSchema } from '../types/schema.js';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = insertReviewSchema.parse(req.body);

  const review = await storage.createReview({
    ...data,
    reviewerId: req.userId!
  });

  res.status(201).json(review);
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await storage.getReviews(req.params.brokerId);
  res.json(reviews);
});
