import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../types/schema.js';
import { storage } from '../services/storage.service';
import { generateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config/environment';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await storage.getUserByEmail(data.email);
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = await storage.createUser({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role,
    verified: false,
    profilePhotoUrl: null
  });

  if (data.role === 'broker') {
    await storage.createBroker({
      userId: user.id,
      verified: false
    });
  }

  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id);

  res.status(201).json({
    user,
    tokens: { accessToken, refreshToken }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const user = await storage.validatePassword(data.email, data.password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = generateToken(user.id);
  const refreshToken = generateToken(user.id);

  const { passwordHash, ...safeUser } = user;

  res.json({
    user: safeUser,
    tokens: { accessToken, refreshToken }
  });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await storage.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as { userId: string };

    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateToken(user.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true });
});
