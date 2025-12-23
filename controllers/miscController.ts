import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service.js';
import { contactFormSchema } from '../types/schema.js';
import { z } from 'zod';

export async function contactFormHandler(req: Request, res: Response) {
  try {
    const data = contactFormSchema.parse(req.body);
    console.log('New inquiry:', data);
    res.json({ success: true, message: 'Inquiry received' });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors[0].message });
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
}

export async function createViewingRequestHandler(req: any, res: Response) {
  try {
    const request = await storage.createViewingRequest({
      listingId: req.body.listingId,
      userId: req.userId!,
      preferredDate: new Date(req.body.preferredDate),
      preferredTime: req.body.preferredTime,
      message: req.body.message,
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create viewing request' });
  }
}

export async function createReviewHandler(req: any, res: Response) {
  try {
    const review = await storage.createReview({
      reviewerId: req.userId!,
      brokerId: req.body.brokerId,
      listingId: req.body.listingId,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
}

export async function getReviewsHandler(req: Request, res: Response) {
  try {
    const reviews = await storage.getReviews(req.params.brokerId);
    res.json({ data: reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
