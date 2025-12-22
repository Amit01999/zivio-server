import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: err.errors[0]?.message || 'Validation error',
      errors: err.errors
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
}
