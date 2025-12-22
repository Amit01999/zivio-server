import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service';

export async function getBrokersHandler(_req: Request, res: Response) {
  try {
    const verified = _req.query.verified !== 'false';
    const brokers = await storage.getBrokers({ verified });
    res.json({ data: brokers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
}

export async function getBrokerHandler(req: Request, res: Response) {
  try {
    const broker = await storage.getBroker(req.params.id);
    if (!broker) return res.status(404).json({ error: 'Broker not found' });
    res.json(broker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
}
