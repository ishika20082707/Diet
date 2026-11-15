import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  slug: 'basic' | 'standard' | 'premium';
  targetAudience: string;
  saladsPerDay: number;
  daysPerMonth: number;
  monthlyPrice: number;
  discountPercent: number;
  freeDelivery: boolean;
  deliveryFee: number;
  description: string;
  features: string[];
  isActive: boolean;
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['basic', 'standard', 'premium'],
    },
    targetAudience: {
      type: String,
      required: true,
    },
    saladsPerDay: {
      type: Number,
      required: true,
      min: 1,
    },
    daysPerMonth: {
      type: Number,
      required: true,
      min: 1,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    freeDelivery: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      default: 40,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
