import { NextFunction, Router, Response } from 'express';
import { User } from '../models/User.ts';
import { Plan } from '../models/Plan.ts';
import { Subscription } from '../models/Subscription.ts';
import { AuthRequest, protect, signToken } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, address, password, planId } = req.body;

    if (!name || !email || !phone || !address || !password) {
      res.status(400).json({
        message: 'Name, email, phone, delivery address, and password are required.',
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
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    let resolvedPlanId = null;
    if (planId) {
      const plan = await Plan.findById(planId);
      if (plan) resolvedPlanId = plan._id;
    }

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      password: String(password),
      role: 'member',
      plan: resolvedPlanId,
      isActive: true,
    });

    const populated = await User.findById(user._id).populate('plan');
    const token = signToken(String(user._id), user.role);

    res.status(201).json({
      token,
      user: populated,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
      .select('+password')
      .populate('plan');

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        message: 'This membership account has been deactivated. Please contact admin.',
      });
      return;
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = signToken(String(user._id), user.role);
    const safeUser = user.toObject();
    delete (safeUser as { password?: string }).password;

    const activeSubscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'paused'] },
    })
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({
      token,
      user: safeUser,
      activeSubscription,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activeSubscription = await Subscription.findOne({
      user: req.user!._id,
      status: { $in: ['active', 'paused'] },
    })
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({
      user: req.user,
      activeSubscription,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/me
router.put('/me', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone, address } = req.body;
    const updates: Record<string, string> = {};
    if (name) updates.name = String(name).trim();
    if (phone) updates.phone = String(phone).trim();
    if (address) updates.address = String(address).trim();

    const updated = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    }).populate('plan');

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/jwt-sign (Sign JWT token using JWT_SECRET for Supabase user session)
router.post('/jwt-sign', (req, res: Response) => {
  const { userId, role = 'member' } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId is required to sign JWT.' });
    return;
  }
  const token = signToken(String(userId), String(role));
  res.json({ token });
});

// GET /api/auth/jwt-verify (Verify custom JWT token)
router.get('/jwt-verify', async (req, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Missing Bearer token.' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    const { getJwtSecret } = await import('../middleware/auth.ts');
    const decoded = jwt.default.verify(token, getJwtSecret()) as {
      id: string;
      role: string;
    };
    res.json({ valid: true, id: decoded.id, role: decoded.role });
  } catch {
    res.status(401).json({ message: 'Invalid or expired JWT token.' });
  }
});

export default router;
