import mongoose, { Document, Schema } from 'mongoose';

export interface ISalad extends Document {
  name: string;
  description: string;
  price: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  dietaryType: 'veg' | 'vegan' | 'non-veg';
  tags: string[];
  ingredientsSummary: string[];
  imageUrl: string;
  isAvailable: boolean;
  featured: boolean;
}

const saladSchema = new Schema<ISalad>(
  {
    name: {
      type: String,
      required: [true, 'Salad name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: 0,
    },
    proteinGrams: {
      type: Number,
      default: 18,
      min: 0,
    },
    carbsGrams: {
      type: Number,
      default: 32,
      min: 0,
    },
    fatGrams: {
      type: Number,
      default: 14,
      min: 0,
    },
    dietaryType: {
      type: String,
      enum: ['veg', 'vegan', 'non-veg'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    ingredientsSummary: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Salad = mongoose.model<ISalad>('Salad', saladSchema);
