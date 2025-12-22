import { Request, Response } from 'express';
import { insertReviewSchema } from '../types/schema.js';
import { storage } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

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
