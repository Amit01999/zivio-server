import { Response } from 'express';
import { insertMessageSchema } from '../types/schema.js';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await storage.getConversations(req.userId!);
  res.json(conversations);
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messages = await storage.getMessages(req.params.id);
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = insertMessageSchema.parse(req.body);

  if (data.fromUserId !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const message = await storage.createMessage(data);
  res.status(201).json(message);
});
