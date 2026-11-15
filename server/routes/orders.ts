import { NextFunction, Router, Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order.ts';
import { Plan, IPlan } from '../models/Plan.ts';
import { Subscription } from '../models/Subscription.ts';
import { Payment } from '../models/Payment.ts';
import { AuthRequest, authorize, protect } from '../middleware/auth.ts';

const router = Router();

function generateOrderNumber(): string {
  const rand = crypto.randomInt(1000, 9999);
  const suffix = Date.now().toString().slice(-3);
  return `VB-${rand}${suffix}`;
}

// POST /api/orders (Place an order - Member or Admin)
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      items,
      deliveryAddress,
      timeSlot,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Your cart is empty.' });
      return;
    }

    if (!deliveryAddress || !String(deliveryAddress).trim()) {
      res.status(400).json({ message: 'Delivery address is required.' });
      return;
    }

    if (!timeSlot) {
      res.status(400).json({ message: 'Please select a delivery time slot.' });
      return;
    }

    // Determine member discount and free delivery perk from active subscription or assigned plan
    let discountPercent = 0;
    let freeDelivery = false;

    const activeSub = await Subscription.findOne({
      user: req.user!._id,
      status: 'active',
    }).populate('plan');

    if (activeSub && activeSub.plan) {
      const plan = activeSub.plan as unknown as IPlan;
      discountPercent = plan.discountPercent;
      freeDelivery = plan.freeDelivery;
    } else if (req.user!.plan) {
      const plan = await Plan.findById(req.user!.plan);
      if (plan) {
        discountPercent = plan.discountPercent;
        freeDelivery = plan.freeDelivery;
      }
    }

    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + Number(item.unitPrice) * Number(item.quantity),
      0
    );

    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const deliveryFee = freeDelivery || afterDiscount >= 799 ? 0 : 35;
    const totalAmount = afterDiscount + deliveryFee;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user!._id,
      subscription: null,
      isSubscriptionOrder: false,
      scheduledDate: new Date(),
      items: items.map((item: {
        itemType: 'salad' | 'custom';
        saladId?: string;
        customSaladId?: string;
        name: string;
        quantity: number;
        unitPrice: number;
        calories: number;
        customizationDetails?: string;
        specialInstructions?: string;
      }) => ({
        itemType: item.itemType || 'salad',
        saladId: item.saladId || undefined,
        customSaladId: item.customSaladId || undefined,
        name: item.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        calories: Number(item.calories),
        customizationDetails: item.customizationDetails || '',
        specialInstructions: item.specialInstructions || '',
      })),
      subtotal,
      discountPercent,
      discountAmount,
      deliveryFee,
      totalAmount,
      deliveryAddress: String(deliveryAddress).trim(),
      timeSlot,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'Pending',
    });

    await Payment.create({
      user: req.user!._id,
      order: order._id,
      purpose: 'order',
      amount: totalAmount,
      currency: 'INR',
      method: 'cod',
      status: 'pending_cod',
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my (Member order history)
router.get('/my', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await Order.find({ user: req.user!._id }).sort({
      createdAt: -1,
      scheduledDate: -1,
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders (Admin: view all orders)
router.get(
  '/',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, type } = req.query;
      const query: Record<string, unknown> = {};

      if (status && status !== 'all') query.status = status;
      if (type === 'subscription') query.isSubscriptionOrder = true;
      if (type === 'regular') query.isSubscriptionOrder = false;

      const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1, scheduledDate: 1 });

      res.json(orders);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/orders/:id/status (Admin: update order status)
router.patch(
  '/:id/status',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const allowed = [
        'Pending',
        'Preparing',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ];
      if (!allowed.includes(status)) {
        res.status(400).json({ message: 'Invalid order status value.' });
        return;
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        res.status(404).json({ message: 'Order not found.' });
        return;
      }

      order.status = status;
      if (status === 'Delivered' && order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
      await order.save();

      const populated = await Order.findById(order._id).populate(
        'user',
        'name email phone'
      );
      res.json(populated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
