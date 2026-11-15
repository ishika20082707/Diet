import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId | null;
  subscription: mongoose.Types.ObjectId | null;
  purpose: 'order' | 'subscription';
  amount: number;
  currency: string;
  method: 'cod';
  status: 'pending_cod' | 'paid' | 'cancelled';
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    purpose: {
      type: String,
      enum: ['order', 'subscription'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    method: {
      type: String,
      enum: ['cod'],
      default: 'cod',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_cod', 'paid', 'cancelled'],
      default: 'pending_cod',
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
