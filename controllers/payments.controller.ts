import { Response, Request } from 'express';
import { storage } from '../services/storage.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { randomUUID } from 'crypto';

export const initiatePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount, listingId, gateway, type = 'featured' } = req.body;

  if (!amount || !gateway || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transactionId = `TXN-${gateway.toUpperCase()}-${randomUUID().slice(0, 8)}`;

  const transaction = await storage.createTransaction({
    userId: req.userId!,
    listingId: listingId || null,
    amount,
    currency: 'BDT',
    gateway,
    type,
    status: 'pending',
    paymentDetails: { transactionId }
  });

  res.json({
    success: true,
    transactionId,
    gatewayUrl: `/api/payments/callback/${gateway}?txn=${transactionId}`,
    message: `Mock payment initiated via ${gateway}`
  });
});

export const paymentCallback = asyncHandler(async (req: Request, res: Response) => {
  const { gateway } = req.params;
  const transactionId = (req.query.txn as string) || (req.body as any)?.transactionId;

  res.json({
    success: true,
    gateway,
    transactionId,
    status: 'completed',
    message: 'Mock payment completed successfully'
  });
});
