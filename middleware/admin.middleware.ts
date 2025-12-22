import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { UserModel } = await import('../models');
    const user = await UserModel.findById(req.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
