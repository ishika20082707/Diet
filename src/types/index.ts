export interface Plan {
  _id: string;
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

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'member';
  plan: Plan | null;
  isActive: boolean;
  createdAt: string;
}

export interface Salad {
  _id: string;
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

export type IngredientCategory = 'base' | 'protein' | 'topping' | 'dressing';

export interface Ingredient {
  _id: string;
  name: string;
  category: IngredientCategory;
  price: number;
  calories: number;
  proteinGrams: number;
  isVeg: boolean;
  isVegan: boolean;
  isAvailable: boolean;
}

export interface CustomSalad {
  _id: string;
  name: string;
  base: Ingredient;
  proteins: Ingredient[];
  toppings: Ingredient[];
  dressing: Ingredient;
  specialInstructions: string;
  totalPrice: number;
  totalCalories: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  user: User | string;
  plan: Plan;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  paymentMethod: 'cod';
  startDate: string;
  endDate: string;
  pausedAt: string | null;
  totalDays: number;
  saladsPerDay: number;
  amountPaid: number;
  deliveryAddress: string;
  timeSlot: string;
  preferredSaladId?: Salad | null;
  createdAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  itemType: 'salad' | 'custom';
  saladId?: string;
  customSaladId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  customizationDetails?: string;
  specialInstructions?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User | string;
  subscription: string | null;
  isSubscriptionOrder: boolean;
  scheduledDate: string;
  items: OrderItem[];
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
  createdAt: string;
}

export interface CartItem {
  cartKey: string;
  itemType: 'salad' | 'custom';
  saladId?: string;
  customSaladId?: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  calories: number;
  quantity: number;
  customizationDetails?: string;
  specialInstructions?: string;
}
