import { NextFunction, Router, Response } from 'express';
import crypto from 'crypto';
import { Subscription } from '../models/Subscription.ts';
import { Plan, IPlan } from '../models/Plan.ts';
import { User } from '../models/User.ts';
import { Salad } from '../models/Salad.ts';
import { Order } from '../models/Order.ts';
import { Payment } from '../models/Payment.ts';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';

const router = Router();

async function generateDailySubscriptionOrders(params: {
  userId: unknown;
  subscriptionId: unknown;
  plan: IPlan;
  startDate: Date;
  daysToGenerate: number;
  deliveryAddress: string;
  timeSlot: string;
  preferredSaladId?: string | null;
}) {
  const salads = await Salad.find({ isAvailable: true });
  if (salads.length === 0) return;

  const preferred = params.preferredSaladId
    ? salads.find((s) => String(s._id) === String(params.preferredSaladId))
    : null;

  const ordersToCreate = [];
  const baseStamp = Date.now().toString().slice(-4);

  for (let dayIndex = 0; dayIndex < params.daysToGenerate; dayIndex++) {
    const sched = new Date(params.startDate);
    sched.setDate(sched.getDate() + dayIndex);

    const chosenSalad = preferred || salads[dayIndex % salads.length];
    const rand = crypto.randomInt(100, 999);

    ordersToCreate.push({
      orderNumber: `VB-SUB-${baseStamp}${dayIndex + 1}-${rand}`,
      user: params.userId,
      subscription: params.subscriptionId,
      isSubscriptionOrder: true,
      scheduledDate: sched,
      items: [
        {
          itemType: 'salad' as const,
          saladId: chosenSalad._id,
          name: chosenSalad.name,
          quantity: params.plan.saladsPerDay,
          unitPrice: 0,
          calories: chosenSalad.calories,
          customizationDetails: `${params.plan.name} Plan · Day ${dayIndex + 1} (${params.plan.saladsPerDay} bowl${params.plan.saladsPerDay > 1 ? 's' : ''}/day)`,
        },
      ],
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      deliveryFee: 0,
      totalAmount: 0,
      deliveryAddress: params.deliveryAddress,
      timeSlot: params.timeSlot,
      paymentMethod: 'subscription' as const,
      paymentStatus: 'pending' as const,
      status: 'Pending' as const,
    });
  }

  await Order.insertMany(ordersToCreate);
}

// GET /api/subscriptions/my (Member subscriptions)
router.get('/my', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user!._id })
      .populate('plan preferredSaladId')
      .sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions (Admin: all subscriptions)
router.get(
  '/',
  protect,
  authorize('admin'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const subscriptions = await Subscription.find()
        .populate('user', 'name email phone isActive')
        .populate('plan')
        .sort({ createdAt: -1 });
      res.json(subscriptions);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/subscriptions (Subscribe to a plan & auto-generate daily orders)
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      planId,
      deliveryAddress,
      timeSlot = 'Lunch (12:00 PM - 2:00 PM)',
      preferredSaladId = null,
    } = req.body;

    if (!planId) {
      res.status(400).json({ message: 'Please select a membership plan.' });
      return;
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({ message: 'Selected membership plan not found.' });
      return;
    }

    const resolvedAddress = String(deliveryAddress || req.user!.address || '').trim();
    if (!resolvedAddress) {
      res.status(400).json({ message: 'Delivery address is required.' });
      return;
    }

    // Check if member already has an active or paused subscription
    const existingActive = await Subscription.findOne({
      user: req.user!._id,
      status: { $in: ['active', 'paused'] },
    });
    if (existingActive) {
      res.status(400).json({
        message:
          'You already have an active or paused subscription. Cancel it before starting a new plan.',
      });
      return;
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.daysPerMonth - 1);

    const subscription = await Subscription.create({
      user: req.user!._id,
      plan: plan._id,
      status: 'active',
      paymentMethod: 'cod',
      startDate,
      endDate,
      totalDays: plan.daysPerMonth,
      saladsPerDay: plan.saladsPerDay,
      amountPaid: plan.monthlyPrice,
      deliveryAddress: resolvedAddress,
      timeSlot,
      preferredSaladId: preferredSaladId || null,
    });

    // Update user's active plan
    await User.findByIdAndUpdate(req.user!._id, { plan: plan._id });

    // Record Cash on Delivery payment
    await Payment.create({
      user: req.user!._id,
      subscription: subscription._id,
      purpose: 'subscription',
      amount: plan.monthlyPrice,
      currency: 'INR',
      method: 'cod',
      status: 'pending_cod',
    });

    // Auto-generate daily orders for the subscription period
    await generateDailySubscriptionOrders({
      userId: req.user!._id,
      subscriptionId: subscription._id,
      plan,
      startDate,
      daysToGenerate: plan.daysPerMonth,
      deliveryAddress: resolvedAddress,
      timeSlot,
      preferredSaladId,
    });

    const populated = await Subscription.findById(subscription._id).populate(
      'plan preferredSaladId'
    );
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id/pause
router.patch('/:id/pause', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }
    if (sub.status !== 'active') {
      res.status(400).json({ message: 'Only active subscriptions can be paused.' });
      return;
    }

    sub.status = 'paused';
    sub.pausedAt = new Date();
    await sub.save();

    // Cancel future pending orders beyond today while paused (will regenerate remaining on resume)
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    await Order.updateMany(
      {
        subscription: sub._id,
        status: 'Pending',
        scheduledDate: { $gt: tomorrow },
      },
      { status: 'Cancelled' }
    );

    const populated = await Subscription.findById(sub._id).populate('plan preferredSaladId');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id/resume
router.patch('/:id/resume', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).populate('plan');

    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }
    if (sub.status !== 'paused') {
      res.status(400).json({ message: 'Only paused subscriptions can be resumed.' });
      return;
    }

    const plan = sub.plan as unknown as IPlan;
    const completedOrActiveCount = await Order.countDocuments({
      subscription: sub._id,
      status: { $ne: 'Cancelled' },
    });

    const remainingDays = Math.max(0, sub.totalDays - completedOrActiveCount);
    const resumeStart = new Date();
    resumeStart.setDate(resumeStart.getDate() + 1);
    resumeStart.setHours(0, 0, 0, 0);

    const newEndDate = new Date(resumeStart);
    newEndDate.setDate(newEndDate.getDate() + Math.max(0, remainingDays - 1));

    sub.status = 'active';
    sub.pausedAt = null;
    if (remainingDays > 0) {
      sub.endDate = newEndDate;
      await generateDailySubscriptionOrders({
        userId: req.user!._id,
        subscriptionId: sub._id,
        plan,
        startDate: resumeStart,
        daysToGenerate: remainingDays,
        deliveryAddress: sub.deliveryAddress,
        timeSlot: sub.timeSlot,
        preferredSaladId: sub.preferredSaladId ? String(sub.preferredSaladId) : null,
      });
    }
    await sub.save();

    const populated = await Subscription.findById(sub._id).populate('plan preferredSaladId');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/subscriptions/:id/cancel
router.patch('/:id/cancel', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await Subscription.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });
    if (!sub) {
      res.status(404).json({ message: 'Subscription not found.' });
      return;
    }
    if (sub.status === 'cancelled') {
      res.status(400).json({ message: 'Subscription is already cancelled.' });
      return;
    }

    sub.status = 'cancelled';
    await sub.save();

    await User.findByIdAndUpdate(req.user!._id, { plan: null });

    await Order.updateMany(
      { subscription: sub._id, status: 'Pending' },
      { status: 'Cancelled' }
    );

    const populated = await Subscription.findById(sub._id).populate('plan preferredSaladId');
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

export default router;
