import { NextFunction, Router, Response } from 'express';
import { User } from '../models/User.ts';
import { Plan } from '../models/Plan.ts';
import { Subscription } from '../models/Subscription.ts';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';

const router = Router();

router.use(protect, authorize('admin'));

// GET /api/members
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search = '', status = 'all', planId = '' } = req.query;
    const query: Record<string, unknown> = { role: 'member' };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (planId) query.plan = planId;

    if (String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const members = await User.find(query)
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json(members);
  } catch (err) {
    next(err);
  }
});

// POST /api/members (Admin Add Member)
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, password, planId } = req.body;

    if (!name || !email || !phone || !address || !password) {
      res.status(400).json({
        message: 'Name, email, phone, address, and password are all required.',
      });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ message: 'A member with this email already exists.' });
      return;
    }

    let resolvedPlan = null;
    if (planId) {
      resolvedPlan = await Plan.findById(planId);
      if (!resolvedPlan) {
        res.status(400).json({ message: 'Selected membership plan not found.' });
        return;
      }
    }

    const member = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      password: String(password),
      role: 'member',
      plan: resolvedPlan ? resolvedPlan._id : null,
      isActive: true,
    });

    const populated = await User.findById(member._id).populate('plan');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/members/:id/deactivate (Soft delete: isActive=false)
router.patch('/:id/deactivate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member || member.role === 'admin') {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }

    member.isActive = false;
    await member.save();

    // Pause any active subscription for the deactivated member
    await Subscription.updateMany(
      { user: member._id, status: 'active' },
      { status: 'paused', pausedAt: new Date() }
    );

    const populated = await User.findById(member._id).populate('plan');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/members/:id/reactivate
router.patch('/:id/reactivate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member || member.role === 'admin') {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }

    member.isActive = true;
    await member.save();

    const populated = await User.findById(member._id).populate('plan');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/members/:id/plan
router.patch('/:id/plan', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;
    const member = await User.findById(req.params.id);
    if (!member || member.role === 'admin') {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }

    member.plan = planId || null;
    await member.save();

    const populated = await User.findById(member._id).populate('plan');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

export default router;
