import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service.js';

export async function initiatePaymentHandler(req: any, res: Response) {
  try {
    const { gateway, amount, listingId, type } = req.body;

    if (!['bkash', 'nagad', 'sslcommerz'].includes(gateway))
      return res.status(400).json({ error: 'Invalid payment gateway' });

    const transaction = await storage.createTransaction({
      userId: req.userId!,
      listingId,
      amount,
      currency: 'BDT',
      gateway,
      type,
      status: 'pending',
      paymentDetails: null,
    });

    const mockPaymentUrl = `https://mock-payment.Zivio Living.com/${gateway}?txn=${transaction.id}`;

    res.json({
      transaction,
      paymentUrl: mockPaymentUrl,
      message: `Mock ${gateway} payment initiated. In production, this would redirect to the actual payment gateway.`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
}

export async function paymentCallbackHandler(req: Request, res: Response) {
  try {
    const { gateway } = req.params;
    const { transactionId, status } = req.body;
    console.log(`Mock ${gateway} callback:`, { transactionId, status });
    res.json({ success: true, message: 'Payment callback processed (mock)' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process callback' });
  }
}
