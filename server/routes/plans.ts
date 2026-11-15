import { NextFunction, Router, Request, Response } from 'express';
import { Plan } from '../models/Plan.ts';
import { authorize, protect } from '../middleware/auth.ts';

const router = Router();

// GET /api/plans
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

// PUT /api/plans/:id (Admin update)
router.put(
  '/:id',
  protect,
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await Plan.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        res.status(404).json({ message: 'Membership plan not found.' });
        return;
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
