import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('API Error:', err);

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({ message: errors[0] || 'Validation failed', errors });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: 'Invalid resource identifier format.' });
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: number }).code === 11000
  ) {
    res.status(409).json({ message: 'An account or record with this value already exists.' });
    return;
  }

  const statusCode =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? Number((err as { statusCode: number }).statusCode)
      : 500;
  const message =
    err instanceof Error ? err.message : 'An unexpected server error occurred.';

  res.status(statusCode).json({ message });
}
