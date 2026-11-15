import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  paymentMethod: 'cod';
  startDate: Date;
  endDate: Date;
  pausedAt: Date | null;
  totalDays: number;
  saladsPerDay: number;
  amountPaid: number;
  deliveryAddress: string;
  timeSlot: string;
  preferredSaladId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active',
    },
    paymentMethod: {
      type: String,
      enum: ['cod'],
      default: 'cod',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    saladsPerDay: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    preferredSaladId: {
      type: Schema.Types.ObjectId,
      ref: 'Salad',
      default: null,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>(
  'Subscription',
  subscriptionSchema
);
