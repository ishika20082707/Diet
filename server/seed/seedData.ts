import { Plan } from '../models/Plan.ts';
import { Salad } from '../models/Salad.ts';
import { Ingredient } from '../models/Ingredient.ts';
import { User } from '../models/User.ts';
import { Subscription } from '../models/Subscription.ts';
import { Order } from '../models/Order.ts';
import { Payment } from '../models/Payment.ts';

export async function seedDatabase(forceReset = false): Promise<void> {
  if (forceReset) {
    await Promise.all([
      Plan.deleteMany({}),
      Salad.deleteMany({}),
      Ingredient.deleteMany({}),
      User.deleteMany({}),
      Subscription.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
    ]);
  }

  const existingPlans = await Plan.countDocuments();
  if (existingPlans > 0) {
    return;
  }

  const plans = await Plan.insertMany([
    {
      name: 'Basic',
      slug: 'basic',
      targetAudience: 'For weekday wellness routines',
      saladsPerDay: 1,
      daysPerMonth: 20,
      monthlyPrice: 2999,
      discountPercent: 10,
      freeDelivery: false,
      deliveryFee: 35,
      description:
        'Twenty fresh weekday bowls per month with a flat 10% member discount on every extra menu or custom order.',
      features: [
        '1 fresh salad bowl per day',
        '20 delivery days per month (Mon–Fri)',
        '10% member discount on all extra orders',
        'Flexible pause & resume anytime',
      ],
      isActive: true,
    },
    {
      name: 'Standard',
      slug: 'standard',
      targetAudience: 'For consistent daily nutrition',
      saladsPerDay: 1,
      daysPerMonth: 26,
      monthlyPrice: 3899,
      discountPercent: 15,
      freeDelivery: false,
      deliveryFee: 25,
      description:
        'Six-day weekly meal cadence built for busy professionals seeking sustained energy and clean macros.',
      features: [
        '1 fresh salad bowl per day',
        '26 delivery days per month (Mon–Sat)',
        '15% member discount on all extra orders',
        'Priority morning or lunch delivery slots',
      ],
      isActive: true,
    },
    {
      name: 'Premium',
      slug: 'premium',
      targetAudience: 'For full-day athletic & weight goals',
      saladsPerDay: 2,
      daysPerMonth: 26,
      monthlyPrice: 6999,
      discountPercent: 25,
      freeDelivery: true,
      deliveryFee: 0,
      description:
        'Lunch and dinner macro-balanced bowls delivered free for 26 days, with our deepest 25% member discount.',
      features: [
        '2 fresh salad bowls per day (Lunch & Dinner)',
        '26 delivery days per month',
        '25% member discount on all extra orders',
        'Free priority delivery on every order',
      ],
      isActive: true,
    },
  ]);

  const basicPlan = plans.find((p) => p.slug === 'basic')!;
  const standardPlan = plans.find((p) => p.slug === 'standard')!;
  const premiumPlan = plans.find((p) => p.slug === 'premium')!;

  const salads = await Salad.insertMany([
    {
      name: 'Mediterranean Quinoa & Chickpea Bowl',
      description:
        'Tri-color organic quinoa, crisp romaine, roasted paprika chickpeas, kalamata olives, Persian cucumber, cherry tomatoes, and cold-pressed lemon olive oil.',
      price: 249,
      calories: 410,
      proteinGrams: 18,
      carbsGrams: 46,
      fatGrams: 15,
      dietaryType: 'vegan',
      tags: ['Vegan', 'High Fiber', 'Gluten-Free'],
      ingredientsSummary: ['Quinoa', 'Romaine', 'Roasted Chickpeas', 'Olives', 'Lemon Olive Oil'],
      imageUrl: '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg',
      isAvailable: true,
      featured: true,
    },
    {
      name: 'Tuscan Kale & Herb Chicken Protein Bowl',
      description:
        'Massaged baby Tuscan kale, rosemary-grilled chicken breast, sliced Hass avocado, toasted almonds, heirloom tomatoes, and Greek yogurt dill dressing.',
      price: 319,
      calories: 465,
      proteinGrams: 38,
      carbsGrams: 22,
      fatGrams: 24,
      dietaryType: 'non-veg',
      tags: ['High Protein', 'Low Carb'],
      ingredientsSummary: ['Baby Kale', 'Grilled Chicken', 'Avocado', 'Almonds', 'Yogurt Dressing'],
      imageUrl: '/src/assets/images/salad_grilled_chicken_kale_1794716401880.jpg',
      isAvailable: true,
      featured: true,
    },
    {
      name: 'Charred Herb Paneer & Baby Spinach Harvest',
      description:
        'Tender baby spinach, spiced seared malai paneer cubes, roasted pumpkin seeds, crisp English cucumber, cherry tomatoes, and cooling mint yogurt drizzle.',
      price: 279,
      calories: 440,
      proteinGrams: 24,
      carbsGrams: 24,
      fatGrams: 26,
      dietaryType: 'veg',
      tags: ['Veg', 'High Protein', 'Calcium Rich'],
      ingredientsSummary: ['Baby Spinach', 'Herb Paneer', 'Pumpkin Seeds', 'Cucumber', 'Mint Yogurt'],
      imageUrl: '/src/assets/images/salad_paneer_spinach_1794716402501.jpg',
      isAvailable: true,
      featured: true,
    },
    {
      name: 'Sesame Crispy Tofu & Garden Crunch',
      description:
        'Herb-crusted baked tofu, crisp mixed greens, shredded purple cabbage, shelled edamame, toasted sesame seeds, radish, and aged citrus balsamic.',
      price: 259,
      calories: 385,
      proteinGrams: 22,
      carbsGrams: 34,
      fatGrams: 16,
      dietaryType: 'vegan',
      tags: ['Vegan', 'Plant Protein', 'Dairy-Free'],
      ingredientsSummary: ['Crispy Tofu', 'Mixed Greens', 'Edamame', 'Red Cabbage', 'Balsamic'],
      imageUrl: '/src/assets/images/salad_tofu_sesame_greens_1794716403491.jpg',
      isAvailable: true,
      featured: true,
    },
    {
      name: 'Avocado Tofu & Spinach Detox Bowl',
      description:
        'Organic baby spinach, sprouted quinoa, herb-roasted tofu, ribboned cucumber, pumpkin seeds, and fresh lemon dill vinaigrette.',
      price: 269,
      calories: 360,
      proteinGrams: 19,
      carbsGrams: 29,
      fatGrams: 18,
      dietaryType: 'vegan',
      tags: ['Vegan', 'Detox', 'Light'],
      ingredientsSummary: ['Baby Spinach', 'Quinoa', 'Herb Tofu', 'Avocado', 'Lemon Vinaigrette'],
      imageUrl: '/src/assets/images/hero_diet_salad_1794716401699.jpg',
      isAvailable: true,
      featured: false,
    },
    {
      name: 'Greek Olive & Pasture Egg Power Greens',
      description:
        'Crisp romaine lettuce, soft-boiled pasture eggs, crumbled feta, kalamata olives, sunflower seeds, cherry tomatoes, and extra virgin olive oil.',
      price: 265,
      calories: 420,
      proteinGrams: 25,
      carbsGrams: 18,
      fatGrams: 26,
      dietaryType: 'non-veg',
      tags: ['Keto Friendly', 'High Protein'],
      ingredientsSummary: ['Lettuce', 'Boiled Egg', 'Olives', 'Cherry Tomato', 'Olive Oil'],
      imageUrl: '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg',
      isAvailable: true,
      featured: false,
    },
  ]);

  await Ingredient.insertMany([
    // Bases
    { name: 'Crisp Romaine Lettuce', category: 'base', price: 80, calories: 25, proteinGrams: 2, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Organic Baby Spinach', category: 'base', price: 95, calories: 30, proteinGrams: 3, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Massaged Tuscan Kale', category: 'base', price: 105, calories: 40, proteinGrams: 4, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Tri-Color Quinoa', category: 'base', price: 120, calories: 165, proteinGrams: 6, isVeg: true, isVegan: true, isAvailable: true },

    // Proteins
    { name: 'Herb-Grilled Paneer', category: 'protein', price: 85, calories: 185, proteinGrams: 14, isVeg: true, isVegan: false, isAvailable: true },
    { name: 'Crispy Baked Tofu', category: 'protein', price: 75, calories: 140, proteinGrams: 15, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Rosemary Grilled Chicken', category: 'protein', price: 110, calories: 195, proteinGrams: 28, isVeg: false, isVegan: false, isAvailable: true },
    { name: 'Roasted Spiced Chickpeas', category: 'protein', price: 55, calories: 135, proteinGrams: 7, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Pasture Boiled Egg (2x)', category: 'protein', price: 60, calories: 155, proteinGrams: 13, isVeg: false, isVegan: false, isAvailable: true },

    // Toppings
    { name: 'English Cucumber', category: 'topping', price: 25, calories: 15, proteinGrams: 1, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Cherry Tomatoes', category: 'topping', price: 30, calories: 20, proteinGrams: 1, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Kalamata Olives', category: 'topping', price: 45, calories: 55, proteinGrams: 0, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Toasted Almonds & Walnuts', category: 'topping', price: 55, calories: 95, proteinGrams: 4, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Roasted Pumpkin & Chia Seeds', category: 'topping', price: 40, calories: 75, proteinGrams: 4, isVeg: true, isVegan: true, isAvailable: true },

    // Dressings
    { name: 'Cold-Pressed Olive Oil & Herbs', category: 'dressing', price: 25, calories: 90, proteinGrams: 0, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Zesty Lemon Vinaigrette', category: 'dressing', price: 20, calories: 60, proteinGrams: 0, isVeg: true, isVegan: true, isAvailable: true },
    { name: 'Greek Yogurt Mint Dressing', category: 'dressing', price: 30, calories: 55, proteinGrams: 3, isVeg: true, isVegan: false, isAvailable: true },
    { name: 'Aged Balsamic Reduction', category: 'dressing', price: 30, calories: 45, proteinGrams: 0, isVeg: true, isVegan: true, isAvailable: true },
  ]);

  // Seed sample Admin & Member accounts
  const admin = await User.create({
    name: 'Aarav Sharma',
    email: 'admin@verdantbowl.com',
    password: 'password123',
    phone: '+91 98765 00001',
    address: 'Verdant Kitchen HQ, Indiranagar, Bengaluru 560038',
    role: 'admin',
    plan: null,
    isActive: true,
  });

  const member1 = await User.create({
    name: 'Ananya Nair',
    email: 'member@verdantbowl.com',
    password: 'password123',
    phone: '+91 98201 44510',
    address: '402 Palm Grove Residency, Koramangala 4th Block, Bengaluru 560034',
    role: 'member',
    plan: standardPlan._id,
    isActive: true,
  });

  const member2 = await User.create({
    name: 'Rohan Verma',
    email: 'rohan@verdantbowl.com',
    password: 'password123',
    phone: '+91 98112 77823',
    address: '18 Maple Enclave, HSR Layout Sector 2, Bengaluru 560102',
    role: 'member',
    plan: premiumPlan._id,
    isActive: true,
  });

  const member3 = await User.create({
    name: 'Meera Krishnan',
    email: 'meera@verdantbowl.com',
    password: 'password123',
    phone: '+91 99004 33190',
    address: '72 Cedar Park, Jayanagar 3rd Block, Bengaluru 560011',
    role: 'member',
    plan: basicPlan._id,
    isActive: true,
  });

  // Create active subscription + sample scheduled orders for member1
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + standardPlan.daysPerMonth - 1);

  const sub1 = await Subscription.create({
    user: member1._id,
    plan: standardPlan._id,
    status: 'active',
    paymentMethod: 'cod',
    startDate,
    endDate,
    totalDays: standardPlan.daysPerMonth,
    saladsPerDay: standardPlan.saladsPerDay,
    amountPaid: standardPlan.monthlyPrice,
    deliveryAddress: member1.address,
    timeSlot: 'Lunch (12:00 PM - 2:00 PM)',
    preferredSaladId: salads[0]._id,
  });

  await Payment.create({
    user: member1._id,
    subscription: sub1._id,
    purpose: 'subscription',
    amount: standardPlan.monthlyPrice,
    currency: 'INR',
    method: 'cod',
    status: 'pending_cod',
  });

  // Generate first 5 days of subscription orders + 2 regular orders for rich dashboard state
  const sampleOrders = [];
  for (let i = 0; i < 5; i++) {
    const sched = new Date(startDate);
    sched.setDate(sched.getDate() + i);
    const chosenSalad = salads[i % salads.length];
    sampleOrders.push({
      orderNumber: `VB-SUB-${1001 + i}`,
      user: member1._id,
      subscription: sub1._id,
      isSubscriptionOrder: true,
      scheduledDate: sched,
      items: [
        {
          itemType: 'salad' as const,
          saladId: chosenSalad._id,
          name: chosenSalad.name,
          quantity: 1,
          unitPrice: 0,
          calories: chosenSalad.calories,
          customizationDetails: 'Monthly Plan Daily Bowl',
        },
      ],
      subtotal: 0,
      discountPercent: 0,
      discountAmount: 0,
      deliveryFee: 0,
      totalAmount: 0,
      deliveryAddress: member1.address,
      timeSlot: 'Lunch (12:00 PM - 2:00 PM)',
      paymentMethod: 'subscription' as const,
      paymentStatus: 'paid' as const,
      status: i === 0 ? ('Delivered' as const) : i === 1 ? ('Preparing' as const) : ('Pending' as const),
    });
  }

  sampleOrders.push(
    {
      orderNumber: 'VB-2041',
      user: member2._id,
      subscription: null,
      isSubscriptionOrder: false,
      scheduledDate: new Date(),
      items: [
        {
          itemType: 'salad' as const,
          saladId: salads[1]._id,
          name: salads[1].name,
          quantity: 2,
          unitPrice: salads[1].price,
          calories: salads[1].calories,
        },
      ],
      subtotal: salads[1].price * 2,
      discountPercent: 25,
      discountAmount: Math.round(salads[1].price * 2 * 0.25),
      deliveryFee: 0,
      totalAmount: salads[1].price * 2 - Math.round(salads[1].price * 2 * 0.25),
      deliveryAddress: member2.address,
      timeSlot: 'Dinner (6:30 PM - 8:30 PM)',
      paymentMethod: 'cod' as const,
      paymentStatus: 'pending' as const,
      status: 'Out for Delivery' as const,
    },
    {
      orderNumber: 'VB-2042',
      user: member3._id,
      subscription: null,
      isSubscriptionOrder: false,
      scheduledDate: new Date(),
      items: [
        {
          itemType: 'salad' as const,
          saladId: salads[2]._id,
          name: salads[2].name,
          quantity: 1,
          unitPrice: salads[2].price,
          calories: salads[2].calories,
        },
      ],
      subtotal: salads[2].price,
      discountPercent: 10,
      discountAmount: Math.round(salads[2].price * 0.1),
      deliveryFee: 35,
      totalAmount: salads[2].price - Math.round(salads[2].price * 0.1) + 35,
      deliveryAddress: member3.address,
      timeSlot: 'Morning (7:30 AM - 9:30 AM)',
      paymentMethod: 'cod' as const,
      paymentStatus: 'pending' as const,
      status: 'Pending' as const,
    }
  );

  await Order.insertMany(sampleOrders);

  console.log(
    `Database seeded: ${plans.length} plans, ${salads.length} salads, 18 ingredients, admin (${admin.email}), and 3 members.`
  );
}
