import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface IOrderItem {
  itemType: 'salad' | 'custom';
  saladId?: mongoose.Types.ObjectId;
  customSaladId?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  customizationDetails?: string;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId | null;
  isSubscriptionOrder: boolean;
  scheduledDate: Date;
  items: IOrderItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  timeSlot: string;
  paymentMethod: 'cod' | 'subscription';
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    itemType: {
      type: String,
      enum: ['salad', 'custom'],
      required: true,
    },
    saladId: {
      type: Schema.Types.ObjectId,
      ref: 'Salad',
    },
    customSaladId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomSalad',
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    customizationDetails: {
      type: String,
      default: '',
    },
    specialInstructions: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    isSubscriptionOrder: {
      type: Boolean,
      default: false,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => v.length > 0, 'Order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'subscription'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
