import { Request, Response } from 'express';
import { storage } from '../services/storage.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getBrokers = asyncHandler(async (req: Request, res: Response) => {
  const verified = req.query.verified === 'true' ? true : undefined;
  const brokers = await storage.getBrokers({ verified });
  res.json(brokers);
});

export const getBrokerById = asyncHandler(async (req: Request, res: Response) => {
  const broker = await storage.getBroker(req.params.id);
  if (!broker) {
    return res.status(404).json({ error: 'Broker not found' });
  }
  res.json(broker);
});
