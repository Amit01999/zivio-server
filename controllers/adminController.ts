import { type Request, type Response } from 'express';
import { storage } from '../services/storage.service.js';

export async function getStatsHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function getUsersHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const users = await storage.getUsers();
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getAdminListingsHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    const status = (req.query.status as string) || 'pending';
    const listings = await storage.getListings({ limit: 100 } as any);
    const filtered = {
      ...listings,
      data: listings.data.filter((l: any) => {
        if (status === 'pending') return l.status === 'pending';
        if (status === 'published') return l.status === 'published';
        if (status === 'rejected') return l.status === 'rejected';
        return true;
      }),
    };
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
}

export async function approveListingHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const listing = await storage.updateListing(req.params.id, {
      status: 'published',
      isVerified: true,
    });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve listing' });
  }
}

export async function rejectListingHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const listing = await storage.updateListing(req.params.id, {
      status: 'rejected',
    });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject listing' });
  }
}

export async function getAdminBrokersHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const brokers = await storage.getBrokers();
    res.json({ data: brokers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
}

export async function verifyBrokerHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (user?.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const broker = await storage.updateBroker(req.params.id, {
      verified: true,
    });
    res.json(broker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify broker' });
  }
}
