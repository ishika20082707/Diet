import { supabase } from '../lib/supabase';
import { api } from '../api/client';
import {
  CustomSalad,
  Ingredient,
  IngredientCategory,
  Order,
  OrderItem,
  OrderStatus,
  Plan,
  Salad,
  Subscription,
  User,
} from '../types';

function formatSupabaseError(err: unknown): Error {
  if (typeof err === 'object' && err !== null) {
    const e = err as { code?: string; message?: string; details?: string };
    if (e.code === 'PGRST205' || e.message?.includes('schema cache')) {
      return new Error(
        'Supabase tables are not initialized yet. Run supabase_schema.sql in your Supabase SQL Editor and refresh.'
      );
    }
    if (e.message) return new Error(e.message);
  }
  return err instanceof Error ? err : new Error('Supabase request failed.');
}

function mapPlan(row: any): Plan {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    targetAudience: row.target_audience,
    saladsPerDay: row.salads_per_day,
    daysPerMonth: row.days_per_month,
    monthlyPrice: row.monthly_price,
    discountPercent: row.discount_percent,
    freeDelivery: row.free_delivery,
    deliveryFee: row.delivery_fee,
    description: row.description,
    features: row.features || [],
    isActive: row.is_active,
  };
}

function mapSalad(row: any): Salad {
  return {
    _id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    calories: row.calories,
    proteinGrams: row.protein_grams,
    carbsGrams: row.carbs_grams,
    fatGrams: row.fat_grams,
    dietaryType: row.dietary_type,
    tags: row.tags || [],
    ingredientsSummary: row.ingredients_summary || [],
    imageUrl: row.image_url,
    isAvailable: row.is_available,
    featured: row.featured,
  };
}

function mapIngredient(row: any): Ingredient {
  return {
    _id: row.id,
    name: row.name,
    category: row.category as IngredientCategory,
    price: row.price,
    calories: row.calories,
    proteinGrams: row.protein_grams,
    isVeg: row.is_veg,
    isVegan: row.is_vegan,
    isAvailable: row.is_available,
  };
}

function mapUser(row: any): User {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    role: row.role,
    plan: row.plan ? mapPlan(row.plan) : null,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapSubscription(row: any): Subscription {
  return {
    _id: row.id,
    user:
      typeof row.user === 'object' && row.user
        ? mapUser(row.user)
        : row.user_id,
    plan: row.plan ? mapPlan(row.plan) : ({} as Plan),
    status: row.status,
    paymentMethod: 'cod',
    startDate: row.start_date,
    endDate: row.end_date,
    pausedAt: row.paused_at || null,
    totalDays: row.total_days,
    saladsPerDay: row.salads_per_day,
    amountPaid: row.amount_paid,
    deliveryAddress: row.delivery_address,
    timeSlot: row.time_slot,
    preferredSaladId: row.preferred_salad ? mapSalad(row.preferred_salad) : null,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any): Order {
  return {
    _id: row.id,
    orderNumber: row.order_number,
    user:
      typeof row.user === 'object' && row.user
        ? mapUser(row.user)
        : row.user_id,
    subscription: row.subscription_id || null,
    isSubscriptionOrder: row.is_subscription_order,
    scheduledDate: row.scheduled_date,
    items: (row.items || []) as OrderItem[],
    subtotal: row.subtotal,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount,
    deliveryFee: row.delivery_fee,
    totalAmount: row.total_amount,
    deliveryAddress: row.delivery_address,
    timeSlot: row.time_slot,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
  };
}

const SAFE_USER_SELECT =
  'id, name, email, phone, address, role, plan_id, is_active, created_at, plan:plans(*)';

export const supabaseApi = {
  // ---------------- AUTH & JWT ----------------
  async login(email: string, password: string): Promise<{
    token: string;
    user: User;
    activeSubscription: Subscription | null;
  }> {
    const { data: rpcUser, error } = await supabase.rpc('login_user', {
      p_email: email,
      p_password: password,
    });
    if (error) throw formatSupabaseError(error);

    const { data: userRow, error: fetchErr } = await supabase
      .from('users')
      .select(SAFE_USER_SELECT)
      .eq('id', rpcUser.id)
      .single();
    if (fetchErr) throw formatSupabaseError(fetchErr);

    const user = mapUser(userRow);
    const activeSubscription = await this.getActiveSubscription(user._id);

    const { data: jwtRes } = await api.post<{ token: string }>('/auth/jwt-sign', {
      userId: user._id,
      role: user.role,
    });

    return { token: jwtRes.token, user, activeSubscription };
  },

  async register(payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    planId?: string;
  }): Promise<{ token: string; user: User }> {
    const { data: rpcUser, error } = await supabase.rpc('register_user', {
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone,
      p_address: payload.address,
      p_password: payload.password,
      p_plan_id: payload.planId || null,
    });
    if (error) throw formatSupabaseError(error);

    const { data: userRow, error: fetchErr } = await supabase
      .from('users')
      .select(SAFE_USER_SELECT)
      .eq('id', rpcUser.id)
      .single();
    if (fetchErr) throw formatSupabaseError(fetchErr);

    const user = mapUser(userRow);
    const { data: jwtRes } = await api.post<{ token: string }>('/auth/jwt-sign', {
      userId: user._id,
      role: user.role,
    });

    return { token: jwtRes.token, user };
  },

  async verifyAndLoadProfile(token: string): Promise<{
    user: User;
    activeSubscription: Subscription | null;
  }> {
    const { data: verified } = await api.get<{ valid: boolean; id: string }>(
      '/auth/jwt-verify',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { data: userRow, error } = await supabase
      .from('users')
      .select(SAFE_USER_SELECT)
      .eq('id', verified.id)
      .single();
    if (error) throw formatSupabaseError(error);

    const user = mapUser(userRow);
    if (!user.isActive) {
      throw new Error('Your membership account has been deactivated.');
    }

    const activeSubscription = await this.getActiveSubscription(user._id);
    return { user, activeSubscription };
  },

  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*), preferred_salad:salads(*)')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw formatSupabaseError(error);
    return data ? mapSubscription(data) : null;
  },

  // ---------------- PLANS ----------------
  async getPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true });
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapPlan);
  },

  // ---------------- SALADS ----------------
  async getSalads(availableOnly = false): Promise<Salad[]> {
    let query = supabase
      .from('salads')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (availableOnly) query = query.eq('is_available', true);
    const { data, error } = await query;
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapSalad);
  },

  async createSalad(payload: {
    name: string;
    description: string;
    price: number;
    calories: number;
    proteinGrams: number;
    dietaryType: 'veg' | 'vegan' | 'non-veg';
    imageUrl: string;
    featured: boolean;
  }): Promise<Salad> {
    const { data, error } = await supabase
      .from('salads')
      .insert({
        name: payload.name.trim(),
        description: payload.description.trim(),
        price: payload.price,
        calories: payload.calories,
        protein_grams: payload.proteinGrams,
        dietary_type: payload.dietaryType,
        image_url: payload.imageUrl,
        featured: payload.featured,
        is_available: true,
      })
      .select('*')
      .single();
    if (error) throw formatSupabaseError(error);
    return mapSalad(data);
  },

  async updateSalad(
    id: string,
    payload: {
      name: string;
      description: string;
      price: number;
      calories: number;
      proteinGrams: number;
      dietaryType: 'veg' | 'vegan' | 'non-veg';
      imageUrl: string;
      featured: boolean;
    }
  ): Promise<Salad> {
    const { data, error } = await supabase
      .from('salads')
      .update({
        name: payload.name.trim(),
        description: payload.description.trim(),
        price: payload.price,
        calories: payload.calories,
        protein_grams: payload.proteinGrams,
        dietary_type: payload.dietaryType,
        image_url: payload.imageUrl,
        featured: payload.featured,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw formatSupabaseError(error);
    return mapSalad(data);
  },

  async deleteSalad(id: string): Promise<void> {
    const { error } = await supabase.from('salads').delete().eq('id', id);
    if (error) throw formatSupabaseError(error);
  },

  // ---------------- INGREDIENTS ----------------
  async getIngredients(availableOnly = false): Promise<Ingredient[]> {
    let query = supabase
      .from('ingredients')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (availableOnly) query = query.eq('is_available', true);
    const { data, error } = await query;
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapIngredient);
  },

  async createIngredient(payload: {
    name: string;
    category: IngredientCategory;
    price: number;
    calories: number;
    proteinGrams: number;
    isVegan: boolean;
    isVeg: boolean;
  }): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('ingredients')
      .insert({
        name: payload.name.trim(),
        category: payload.category,
        price: payload.price,
        calories: payload.calories,
        protein_grams: payload.proteinGrams,
        is_vegan: payload.isVegan,
        is_veg: payload.isVeg,
        is_available: true,
      })
      .select('*')
      .single();
    if (error) throw formatSupabaseError(error);
    return mapIngredient(data);
  },

  async updateIngredient(
    id: string,
    payload: {
      name: string;
      category: IngredientCategory;
      price: number;
      calories: number;
      proteinGrams: number;
      isVegan: boolean;
      isVeg: boolean;
    }
  ): Promise<Ingredient> {
    const { data, error } = await supabase
      .from('ingredients')
      .update({
        name: payload.name.trim(),
        category: payload.category,
        price: payload.price,
        calories: payload.calories,
        protein_grams: payload.proteinGrams,
        is_vegan: payload.isVegan,
        is_veg: payload.isVeg,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw formatSupabaseError(error);
    return mapIngredient(data);
  },

  async deleteIngredient(id: string): Promise<void> {
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) throw formatSupabaseError(error);
  },

  // ---------------- CUSTOM SALADS (FAVORITES) ----------------
  async getCustomSalads(userId: string): Promise<CustomSalad[]> {
    const [favRes, ingList] = await Promise.all([
      supabase
        .from('custom_salads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      this.getIngredients(false),
    ]);
    if (favRes.error) throw formatSupabaseError(favRes.error);

    const ingMap = new Map(ingList.map((i) => [i._id, i]));
    return (favRes.data || []).map((row) => ({
      _id: row.id,
      name: row.name,
      base: ingMap.get(row.base_id)!,
      proteins: (row.protein_ids || [])
        .map((id: string) => ingMap.get(id))
        .filter(Boolean) as Ingredient[],
      toppings: (row.topping_ids || [])
        .map((id: string) => ingMap.get(id))
        .filter(Boolean) as Ingredient[],
      dressing: ingMap.get(row.dressing_id)!,
      specialInstructions: row.special_instructions || '',
      totalPrice: row.total_price,
      totalCalories: row.total_calories,
      isFavorite: row.is_favorite,
      createdAt: row.created_at,
    }));
  },

  async saveCustomSalad(
    userId: string,
    payload: {
      name: string;
      baseId: string;
      proteinIds: string[];
      toppingIds: string[];
      dressingId: string;
      specialInstructions: string;
    }
  ): Promise<CustomSalad> {
    const allIngredients = await this.getIngredients(false);
    const ingMap = new Map(allIngredients.map((i) => [i._id, i]));
    const base = ingMap.get(payload.baseId);
    const dressing = ingMap.get(payload.dressingId);
    if (!base || !dressing) {
      throw new Error('Invalid base or dressing selected.');
    }
    const proteins = payload.proteinIds
      .map((id) => ingMap.get(id))
      .filter(Boolean) as Ingredient[];
    const toppings = payload.toppingIds
      .map((id) => ingMap.get(id))
      .filter(Boolean) as Ingredient[];

    const selected = [base, dressing, ...proteins, ...toppings];
    const totalPrice = selected.reduce((s, i) => s + i.price, 0);
    const totalCalories = selected.reduce((s, i) => s + i.calories, 0);

    const { data, error } = await supabase
      .from('custom_salads')
      .insert({
        user_id: userId,
        name: payload.name.trim(),
        base_id: payload.baseId,
        protein_ids: payload.proteinIds,
        topping_ids: payload.toppingIds,
        dressing_id: payload.dressingId,
        special_instructions: payload.specialInstructions.trim(),
        total_price: totalPrice,
        total_calories: totalCalories,
        is_favorite: true,
      })
      .select('*')
      .single();
    if (error) throw formatSupabaseError(error);

    return {
      _id: data.id,
      name: data.name,
      base,
      proteins,
      toppings,
      dressing,
      specialInstructions: data.special_instructions,
      totalPrice: data.total_price,
      totalCalories: data.total_calories,
      isFavorite: data.is_favorite,
      createdAt: data.created_at,
    };
  },

  async deleteCustomSalad(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_salads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw formatSupabaseError(error);
  },

  // ---------------- MEMBERS (ADMIN) ----------------
  async getMembers(filters?: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    planId?: string;
  }): Promise<User[]> {
    let query = supabase
      .from('users')
      .select(SAFE_USER_SELECT)
      .eq('role', 'member')
      .order('created_at', { ascending: false });

    if (filters?.status === 'active') query = query.eq('is_active', true);
    if (filters?.status === 'inactive') query = query.eq('is_active', false);
    if (filters?.planId) query = query.eq('plan_id', filters.planId);

    const { data, error } = await query;
    if (error) throw formatSupabaseError(error);

    let list = (data || []).map(mapUser);
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async addMember(payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    planId: string | null;
  }): Promise<User> {
    const { data: rpcUser, error } = await supabase.rpc('admin_create_member', {
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone,
      p_address: payload.address,
      p_password: payload.password,
      p_plan_id: payload.planId || null,
    });
    if (error) throw formatSupabaseError(error);

    const { data: userRow, error: fetchErr } = await supabase
      .from('users')
      .select(SAFE_USER_SELECT)
      .eq('id', rpcUser.id)
      .single();
    if (fetchErr) throw formatSupabaseError(fetchErr);
    return mapUser(userRow);
  },

  async deactivateMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) throw formatSupabaseError(error);

    await supabase
      .from('subscriptions')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('user_id', memberId)
      .eq('status', 'active');
  },

  async reactivateMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) throw formatSupabaseError(error);
  },

  // ---------------- ORDERS (COD ONLY) ----------------
  async createCodOrder(
    user: User,
    payload: {
      items: OrderItem[];
      deliveryAddress: string;
      timeSlot: string;
    }
  ): Promise<Order> {
    const activeSub = await this.getActiveSubscription(user._id);
    const activePlan =
      activeSub?.status === 'active' ? activeSub.plan : user.plan;

    const discountPercent = activePlan ? activePlan.discountPercent : 0;
    const freeDelivery = Boolean(activePlan?.freeDelivery);

    const subtotal = payload.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0
    );
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const deliveryFee = freeDelivery || afterDiscount >= 799 ? 0 : 35;
    const totalAmount = afterDiscount + deliveryFee;

    const orderNumber = `VB-${Math.floor(1000 + Math.random() * 9000)}${Date.now()
      .toString()
      .slice(-3)}`;

    const { data: orderRow, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user._id,
        subscription_id: null,
        is_subscription_order: false,
        scheduled_date: new Date().toISOString().slice(0, 10),
        items: payload.items,
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        delivery_address: payload.deliveryAddress.trim(),
        time_slot: payload.timeSlot,
        payment_method: 'cod',
        payment_status: 'pending',
        status: 'Pending',
      })
      .select('*')
      .single();

    if (error) throw formatSupabaseError(error);

    await supabase.from('payments').insert({
      user_id: user._id,
      order_id: orderRow.id,
      purpose: 'order',
      amount: totalAmount,
      currency: 'INR',
      method: 'cod',
      status: 'pending_cod',
    });

    return mapOrder(orderRow);
  },

  async getMyOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('scheduled_date', { ascending: false });
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapOrder);
  },

  async getAllOrders(filters?: {
    status?: string;
    type?: 'all' | 'regular' | 'subscription';
  }): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*, user:users(id, name, email, phone, address, role, is_active, created_at)')
      .order('created_at', { ascending: false })
      .order('scheduled_date', { ascending: true });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.type === 'subscription') {
      query = query.eq('is_subscription_order', true);
    }
    if (filters?.type === 'regular') {
      query = query.eq('is_subscription_order', false);
    }

    const { data, error } = await query;
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapOrder);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Delivered') {
      updates.payment_status = 'paid';
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select('*, user:users(id, name, email, phone, address, role, is_active, created_at)')
      .single();
    if (error) throw formatSupabaseError(error);

    if (status === 'Delivered') {
      await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('order_id', orderId);
    }

    return mapOrder(data);
  },

  // ---------------- SUBSCRIPTIONS (COD ONLY) ----------------
  async getMySubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*), preferred_salad:salads(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapSubscription);
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        '*, plan:plans(*), user:users(id, name, email, phone, address, role, is_active, created_at)'
      )
      .order('created_at', { ascending: false });
    if (error) throw formatSupabaseError(error);
    return (data || []).map(mapSubscription);
  },

  async _generateSubscriptionDailyOrders(params: {
    userId: string;
    subscriptionId: string;
    plan: Plan;
    startDate: Date;
    daysToGenerate: number;
    deliveryAddress: string;
    timeSlot: string;
    preferredSaladId?: string | null;
  }) {
    const salads = await this.getSalads(true);
    if (salads.length === 0) return;

    const preferred = params.preferredSaladId
      ? salads.find((s) => s._id === params.preferredSaladId)
      : null;

    const stamp = Date.now().toString().slice(-4);
    const rows = [];

    for (let i = 0; i < params.daysToGenerate; i++) {
      const sched = new Date(params.startDate);
      sched.setDate(sched.getDate() + i);
      const chosen = preferred || salads[i % salads.length];
      const rand = Math.floor(100 + Math.random() * 900);

      rows.push({
        order_number: `VB-SUB-${stamp}${i + 1}-${rand}`,
        user_id: params.userId,
        subscription_id: params.subscriptionId,
        is_subscription_order: true,
        scheduled_date: sched.toISOString().slice(0, 10),
        items: [
          {
            itemType: 'salad',
            saladId: chosen._id,
            name: chosen.name,
            quantity: params.plan.saladsPerDay,
            unitPrice: 0,
            calories: chosen.calories,
            customizationDetails: `${params.plan.name} Plan · Day ${i + 1} (${params.plan.saladsPerDay} bowl${params.plan.saladsPerDay > 1 ? 's' : ''}/day)`,
          },
        ],
        subtotal: 0,
        discount_percent: 0,
        discount_amount: 0,
        delivery_fee: 0,
        total_amount: 0,
        delivery_address: params.deliveryAddress,
        time_slot: params.timeSlot,
        payment_method: 'subscription',
        payment_status: 'pending',
        status: 'Pending',
      });
    }

    const { error } = await supabase.from('orders').insert(rows);
    if (error) throw formatSupabaseError(error);
  },

  async createCodSubscription(
    user: User,
    payload: {
      plan: Plan;
      deliveryAddress: string;
      timeSlot: string;
      preferredSaladId: string | null;
    }
  ): Promise<Subscription> {
    const existing = await this.getActiveSubscription(user._id);
    if (existing) {
      throw new Error(
        'You already have an active or paused subscription. Cancel it before starting a new plan.'
      );
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + payload.plan.daysPerMonth - 1);

    const { data: subRow, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user._id,
        plan_id: payload.plan._id,
        status: 'active',
        payment_method: 'cod',
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        total_days: payload.plan.daysPerMonth,
        salads_per_day: payload.plan.saladsPerDay,
        amount_paid: payload.plan.monthlyPrice,
        delivery_address: payload.deliveryAddress.trim(),
        time_slot: payload.timeSlot,
        preferred_salad_id: payload.preferredSaladId || null,
      })
      .select('*, plan:plans(*), preferred_salad:salads(*)')
      .single();

    if (error) throw formatSupabaseError(error);

    await supabase
      .from('users')
      .update({ plan_id: payload.plan._id })
      .eq('id', user._id);

    await supabase.from('payments').insert({
      user_id: user._id,
      subscription_id: subRow.id,
      purpose: 'subscription',
      amount: payload.plan.monthlyPrice,
      currency: 'INR',
      method: 'cod',
      status: 'pending_cod',
    });

    await this._generateSubscriptionDailyOrders({
      userId: user._id,
      subscriptionId: subRow.id,
      plan: payload.plan,
      startDate: start,
      daysToGenerate: payload.plan.daysPerMonth,
      deliveryAddress: payload.deliveryAddress.trim(),
      timeSlot: payload.timeSlot,
      preferredSaladId: payload.preferredSaladId,
    });

    return mapSubscription(subRow);
  },

  async pauseSubscription(subId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'paused', paused_at: new Date().toISOString() })
      .eq('id', subId)
      .eq('user_id', userId);
    if (error) throw formatSupabaseError(error);

    const todayStr = new Date().toISOString().slice(0, 10);
    await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('subscription_id', subId)
      .eq('status', 'Pending')
      .gt('scheduled_date', todayStr);
  },

  async resumeSubscription(subId: string, userId: string): Promise<void> {
    const { data: subRow, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('id', subId)
      .eq('user_id', userId)
      .single();
    if (error) throw formatSupabaseError(error);

    const sub = mapSubscription(subRow);
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subId)
      .neq('status', 'Cancelled');

    const remainingDays = Math.max(0, sub.totalDays - (count || 0));
    const resumeStart = new Date();
    resumeStart.setDate(resumeStart.getDate() + 1);
    resumeStart.setHours(0, 0, 0, 0);

    const newEnd = new Date(resumeStart);
    newEnd.setDate(newEnd.getDate() + Math.max(0, remainingDays - 1));

    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_at: null,
        end_date:
          remainingDays > 0 ? newEnd.toISOString().slice(0, 10) : sub.endDate,
      })
      .eq('id', subId);

    if (remainingDays > 0) {
      await this._generateSubscriptionDailyOrders({
        userId,
        subscriptionId: subId,
        plan: sub.plan,
        startDate: resumeStart,
        daysToGenerate: remainingDays,
        deliveryAddress: sub.deliveryAddress,
        timeSlot: sub.timeSlot,
        preferredSaladId: sub.preferredSaladId?._id || null,
      });
    }
  },

  async cancelSubscription(subId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', subId)
      .eq('user_id', userId);
    if (error) throw formatSupabaseError(error);

    await supabase.from('users').update({ plan_id: null }).eq('id', userId);
    await supabase
      .from('orders')
      .update({ status: 'Cancelled' })
      .eq('subscription_id', subId)
      .eq('status', 'Pending');
  },
};
