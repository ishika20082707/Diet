import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IUser, User } from '../models/User.ts';

export interface AuthRequest extends Request {
  user?: IUser;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || 'shalini';
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export async function protect(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Please log in.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };

    const user = await User.findById(decoded.id).populate('plan');
    if (!user) {
      res.status(401).json({ message: 'User account no longer exists.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: 'Your membership account has been deactivated. Contact support.',
      });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

export function authorize(...roles: Array<'admin' | 'member'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
}
