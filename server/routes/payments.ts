import { NextFunction, Router, Response } from 'express';
import { Payment } from '../models/Payment.ts';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';

const router = Router();

// GET /api/payments/my (Member Cash on Delivery ledger)
router.get('/my', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await Payment.find({ user: req.user!._id }).sort({
      createdAt: -1,
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// GET /api/payments (Admin Cash on Delivery ledger)
router.get(
  '/',
  protect,
  authorize('admin'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const payments = await Payment.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
      res.json(payments);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
