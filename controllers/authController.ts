import { type Request, type Response } from 'express';
import { z } from 'zod';
import { storage } from '../services/storage.service.js';
import { registerSchema, loginSchema } from '../types/schema.js';

export async function registerHandler(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await storage.getUserByEmail(data.email);
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const user = await storage.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
      verified: false,
      profilePhotoUrl: null,
    });

    if (data.role === 'broker') {
      await storage.createBroker({ userId: user.id, verified: false });
    }

    res.json({ user, message: 'registered' });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors[0].message });
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await storage.validatePassword(data.email, data.password);
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password' });

    const { passwordHash, ...safeUser } = user as any;
    res.json({ user: safeUser });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors[0].message });
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function meHandler(req: any, res: Response) {
  try {
    const user = await storage.getUser(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, ...safeUser } = user as any;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
}

export async function logoutHandler(req: any, res: Response) {
  const authHeader = req.headers.authorization as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // token invalidation is handled in routes-level token map
  }
  res.json({ success: true });
}
