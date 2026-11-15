import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomSalad extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  base: mongoose.Types.ObjectId;
  proteins: mongoose.Types.ObjectId[];
  toppings: mongoose.Types.ObjectId[];
  dressing: mongoose.Types.ObjectId;
  specialInstructions: string;
  totalPrice: number;
  totalCalories: number;
  isFavorite: boolean;
  createdAt: Date;
}

const customSaladSchema = new Schema<ICustomSalad>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Custom salad name is required'],
      trim: true,
    },
    base: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    proteins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    toppings: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      },
    ],
    dressing: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    specialInstructions: {
      type: String,
      default: '',
      trim: true,
      maxlength: 250,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCalories: {
      type: Number,
      required: true,
      min: 0,
    },
    isFavorite: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const CustomSalad = mongoose.model<ICustomSalad>(
  'CustomSalad',
  customSaladSchema
);
