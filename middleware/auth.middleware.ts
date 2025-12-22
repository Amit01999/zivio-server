import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { storage } from '../services/storage.service';
import type { SafeUser, UserRole } from '../types/schema';

export interface AuthRequest extends Request {
  userId?: string;
  user?: SafeUser;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiry });
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    req.userId = decoded.userId;

    // Fetch user for role-based access control
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Remove password hash before attaching to request
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser as SafeUser;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      req.userId = decoded.userId;

      const user = await storage.getUser(decoded.userId);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        req.user = safeUser as SafeUser;
      }
    } catch {
      // Invalid token, but optional so continue
    }
  }
  next();
}

// Role-based access control middleware
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Convenience middleware for specific roles
export const requireAdmin = requireRole('admin');
export const requireBroker = requireRole('broker', 'admin');
export const requireSeller = requireRole('seller', 'admin');
export const requireBuyer = requireRole('buyer', 'admin');
