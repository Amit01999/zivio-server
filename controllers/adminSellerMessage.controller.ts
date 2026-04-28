import { Response } from 'express';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Admin: send a message to a seller about a property
export const sendSellerMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sellerId, propertyId, message, relatedInquiryId } = req.body;

  if (!sellerId || !propertyId || !message?.trim()) {
    return res.status(400).json({ error: 'sellerId, propertyId and message are required' });
  }

  const msg = await storage.sendAdminSellerMessage({
    adminId: req.userId!,
    sellerId,
    propertyId,
    message: message.trim(),
    relatedInquiryId: relatedInquiryId || undefined,
  });

  res.status(201).json(msg);
});

// Admin: get all messages sent (with property + seller details)
export const getAdminSentMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messages = await storage.getAdminSentMessages(req.userId!);
  res.json({ data: messages });
});

// Admin: get enriched seller list with per-seller stats
export const getSellerListWithStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const sellers = await storage.getSellerListWithStats();
  res.json({ data: sellers });
});

// Seller: get messages addressed to them
export const getSellerMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'seller' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  const messages = await storage.getSellerMessages(req.userId!);
  res.json({ data: messages });
});

// Seller: mark a message as read
export const markMessageRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'seller') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  const msg = await storage.markSellerMessageRead(req.params.id, req.userId!);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  res.json(msg);
});

// Admin: reply to an existing message thread
export const addAdminThreadReply = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  const msg = await storage.addAdminThreadReply(req.params.id, req.userId!, text.trim());
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  res.json(msg);
});

// Seller: reply to a message thread
export const addSellerThreadReply = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'seller') {
    return res.status(403).json({ error: 'Seller access required' });
  }
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  const msg = await storage.addSellerThreadReply(req.params.id, req.userId!, text.trim());
  if (!msg) return res.status(404).json({ error: 'Message not found or access denied' });
  res.json(msg);
});

// Admin: get full seller profile + listings with inquiry counts
export const getSellerDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await storage.getSellerFullProfile(req.params.sellerId);
  if (!profile) return res.status(404).json({ error: 'Seller not found' });
  res.json(profile);
});

// Admin: get all conversations for a seller (ordered oldest→newest)
export const getSellerConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messages = await storage.getSellerConversationsForAdmin(req.params.sellerId);
  res.json({ data: messages });
});
