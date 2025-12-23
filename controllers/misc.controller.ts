import { Request, Response } from 'express';
import { contactFormSchema, insertViewingRequestSchema } from '../types/schema.js';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const contactFormHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = contactFormSchema.parse(req.body);

  console.log('Contact form submission:', data);

  res.json({
    success: true,
    message: 'Thank you for contacting us. We will get back to you soon.'
  });
});

export const createViewingRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = insertViewingRequestSchema.parse(req.body);

  const request = await storage.createViewingRequest({
    ...data,
    userId: req.userId!
  });

  res.status(201).json(request);
});
