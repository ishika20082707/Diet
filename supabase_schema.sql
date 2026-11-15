-- ============================================================================
-- Verdant Bowl — Diet Salad & Membership Schema for Supabase (PostgreSQL)
-- Cash on Delivery (COD) Only · Custom JWT + pgcrypto Password Hashing
-- Run this entire script in your Supabase SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug IN ('basic', 'standard', 'premium')),
  target_audience text NOT NULL,
  salads_per_day integer NOT NULL CHECK (salads_per_day >= 1),
  days_per_month integer NOT NULL CHECK (days_per_month >= 1),
  monthly_price integer NOT NULL CHECK (monthly_price >= 0),
  discount_percent integer NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  free_delivery boolean NOT NULL DEFAULT false,
  delivery_fee integer NOT NULL DEFAULT 35,
  description text NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. USERS (ADMIN & MEMBERS)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. SIGNATURE SALADS
CREATE TABLE IF NOT EXISTS public.salads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  calories integer NOT NULL CHECK (calories >= 0),
  protein_grams integer NOT NULL DEFAULT 18 CHECK (protein_grams >= 0),
  carbs_grams integer NOT NULL DEFAULT 32 CHECK (carbs_grams >= 0),
  fat_grams integer NOT NULL DEFAULT 14 CHECK (fat_grams >= 0),
  dietary_type text NOT NULL CHECK (dietary_type IN ('veg', 'vegan', 'non-veg')),
  tags text[] NOT NULL DEFAULT '{}',
  ingredients_summary text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. SALAD BUILDER INGREDIENTS
CREATE TABLE IF NOT EXISTS public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('base', 'protein', 'topping', 'dressing')),
  price integer NOT NULL CHECK (price >= 0),
  calories integer NOT NULL CHECK (calories >= 0),
  protein_grams integer NOT NULL DEFAULT 0 CHECK (protein_grams >= 0),
  is_veg boolean NOT NULL DEFAULT true,
  is_vegan boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. SAVED FAVORITE CUSTOM SALADS
CREATE TABLE IF NOT EXISTS public.custom_salads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_id uuid NOT NULL REFERENCES public.ingredients(id),
  protein_ids uuid[] NOT NULL DEFAULT '{}',
  topping_ids uuid[] NOT NULL DEFAULT '{}',
  dressing_id uuid NOT NULL REFERENCES public.ingredients(id),
  special_instructions text NOT NULL DEFAULT '',
  total_price integer NOT NULL CHECK (total_price >= 0),
  total_calories integer NOT NULL CHECK (total_calories >= 0),
  is_favorite boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. MONTHLY SUBSCRIPTIONS (COD ONLY)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method = 'cod'),
  start_date date NOT NULL,
  end_date date NOT NULL,
  paused_at timestamptz,
  total_days integer NOT NULL,
  salads_per_day integer NOT NULL,
  amount_paid integer NOT NULL,
  delivery_address text NOT NULL,
  time_slot text NOT NULL,
  preferred_salad_id uuid REFERENCES public.salads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. ORDERS (REGULAR COD & SUBSCRIPTION DAILY BOWLS)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  is_subscription_order boolean NOT NULL DEFAULT false,
  scheduled_date date NOT NULL DEFAULT current_date,
  items jsonb NOT NULL,
  subtotal integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_amount integer NOT NULL DEFAULT 0,
  delivery_fee integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,
  delivery_address text NOT NULL,
  time_slot text NOT NULL,
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'subscription')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. CASH ON DELIVERY PAYMENTS LEDGER
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  purpose text NOT NULL CHECK (purpose IN ('order', 'subscription')),
  amount integer NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  method text NOT NULL DEFAULT 'cod' CHECK (method = 'cod'),
  status text NOT NULL DEFAULT 'pending_cod' CHECK (status IN ('pending_cod', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- AUTHENTICATION RPC FUNCTIONS (BCRYPT PASSWORD HASHING VIA PGCRYPTO)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_user(
  p_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_password text,
  p_plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  IF length(trim(p_password)) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE email = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'An account with this email already exists.';
  END IF;

  INSERT INTO public.users (name, email, password_hash, phone, address, role, plan_id, is_active)
  VALUES (
    trim(p_name),
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    trim(p_phone),
    trim(p_address),
    'member',
    p_plan_id,
    true
  )
  RETURNING * INTO v_user;

  RETURN jsonb_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'email', v_user.email,
    'phone', v_user.phone,
    'address', v_user.address,
    'role', v_user.role,
    'plan_id', v_user.plan_id,
    'is_active', v_user.is_active,
    'created_at', v_user.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.login_user(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM public.users
  WHERE email = lower(trim(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid email or password.';
  END IF;

  IF v_user.is_active = false THEN
    RAISE EXCEPTION 'This membership account has been deactivated. Please contact admin.';
  END IF;

  IF v_user.password_hash <> crypt(p_password, v_user.password_hash) THEN
    RAISE EXCEPTION 'Invalid email or password.';
  END IF;

  RETURN jsonb_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'email', v_user.email,
    'phone', v_user.phone,
    'address', v_user.address,
    'role', v_user.role,
    'plan_id', v_user.plan_id,
    'is_active', v_user.is_active,
    'created_at', v_user.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_member(
  p_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_password text,
  p_plan_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.register_user(p_name, p_email, p_phone, p_address, p_password, p_plan_id);
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY & ACCESS POLICIES
-- ============================================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_salads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow API access to plans" ON public.plans;
CREATE POLICY "Allow API access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to users" ON public.users;
CREATE POLICY "Allow API access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to salads" ON public.salads;
CREATE POLICY "Allow API access to salads" ON public.salads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to ingredients" ON public.ingredients;
CREATE POLICY "Allow API access to ingredients" ON public.ingredients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to custom_salads" ON public.custom_salads;
CREATE POLICY "Allow API access to custom_salads" ON public.custom_salads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to subscriptions" ON public.subscriptions;
CREATE POLICY "Allow API access to subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to orders" ON public.orders;
CREATE POLICY "Allow API access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow API access to payments" ON public.payments;
CREATE POLICY "Allow API access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.register_user(text, text, text, text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_user(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_member(text, text, text, text, text, uuid) TO anon, authenticated;

-- ============================================================================
-- SEED SAMPLE PLANS, SALADS, INGREDIENTS, USERS & ORDERS
-- ============================================================================

INSERT INTO public.plans (name, slug, target_audience, salads_per_day, days_per_month, monthly_price, discount_percent, free_delivery, delivery_fee, description, features)
VALUES
  (
    'Basic', 'basic', 'For weekday wellness routines', 1, 20, 2999, 10, false, 35,
    'Twenty fresh weekday bowls per month with a flat 10% member discount on every extra menu or custom order.',
    ARRAY['1 fresh salad bowl per day', '20 delivery days per month (Mon–Fri)', '10% member discount on all extra orders', 'Flexible pause & resume anytime']
  ),
  (
    'Standard', 'standard', 'For consistent daily nutrition', 1, 26, 3899, 15, false, 25,
    'Six-day weekly meal cadence built for busy professionals seeking sustained energy and clean macros.',
    ARRAY['1 fresh salad bowl per day', '26 delivery days per month (Mon–Sat)', '15% member discount on all extra orders', 'Priority morning or lunch delivery slots']
  ),
  (
    'Premium', 'premium', 'For full-day athletic & weight goals', 2, 26, 6999, 25, true, 0,
    'Lunch and dinner macro-balanced bowls delivered free for 26 days, with our deepest 25% member discount.',
    ARRAY['2 fresh salad bowls per day (Lunch & Dinner)', '26 delivery days per month', '25% member discount on all extra orders', 'Free priority delivery on every order']
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.salads (name, description, price, calories, protein_grams, carbs_grams, fat_grams, dietary_type, tags, ingredients_summary, image_url, is_available, featured)
SELECT * FROM (VALUES
  (
    'Mediterranean Quinoa & Chickpea Bowl',
    'Tri-color organic quinoa, crisp romaine, roasted paprika chickpeas, kalamata olives, Persian cucumber, cherry tomatoes, and cold-pressed lemon olive oil.',
    249, 410, 18, 46, 15, 'vegan',
    ARRAY['Vegan', 'High Fiber', 'Gluten-Free'],
    ARRAY['Quinoa', 'Romaine', 'Roasted Chickpeas', 'Olives', 'Lemon Olive Oil'],
    '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg', true, true
  ),
  (
    'Tuscan Kale & Herb Chicken Protein Bowl',
    'Massaged baby Tuscan kale, rosemary-grilled chicken breast, sliced Hass avocado, toasted almonds, heirloom tomatoes, and Greek yogurt dill dressing.',
    319, 465, 38, 22, 24, 'non-veg',
    ARRAY['High Protein', 'Low Carb'],
    ARRAY['Baby Kale', 'Grilled Chicken', 'Avocado', 'Almonds', 'Yogurt Dressing'],
    '/src/assets/images/salad_grilled_chicken_kale_1794716401880.jpg', true, true
  ),
  (
    'Charred Herb Paneer & Baby Spinach Harvest',
    'Tender baby spinach, spiced seared malai paneer cubes, roasted pumpkin seeds, crisp English cucumber, cherry tomatoes, and cooling mint yogurt drizzle.',
    279, 440, 24, 24, 26, 'veg',
    ARRAY['Veg', 'High Protein', 'Calcium Rich'],
    ARRAY['Baby Spinach', 'Herb Paneer', 'Pumpkin Seeds', 'Cucumber', 'Mint Yogurt'],
    '/src/assets/images/salad_paneer_spinach_1794716402501.jpg', true, true
  ),
  (
    'Sesame Crispy Tofu & Garden Crunch',
    'Herb-crusted baked tofu, crisp mixed greens, shredded purple cabbage, shelled edamame, toasted sesame seeds, radish, and aged citrus balsamic.',
    259, 385, 22, 34, 16, 'vegan',
    ARRAY['Vegan', 'Plant Protein', 'Dairy-Free'],
    ARRAY['Crispy Tofu', 'Mixed Greens', 'Edamame', 'Red Cabbage', 'Balsamic'],
    '/src/assets/images/salad_tofu_sesame_greens_1794716403491.jpg', true, true
  ),
  (
    'Avocado Tofu & Spinach Detox Bowl',
    'Organic baby spinach, sprouted quinoa, herb-roasted tofu, ribboned cucumber, pumpkin seeds, and fresh lemon dill vinaigrette.',
    269, 360, 19, 29, 18, 'vegan',
    ARRAY['Vegan', 'Detox', 'Light'],
    ARRAY['Baby Spinach', 'Quinoa', 'Herb Tofu', 'Avocado', 'Lemon Vinaigrette'],
    '/src/assets/images/hero_diet_salad_1794716401699.jpg', true, false
  ),
  (
    'Greek Olive & Pasture Egg Power Greens',
    'Crisp romaine lettuce, soft-boiled pasture eggs, crumbled feta, kalamata olives, sunflower seeds, cherry tomatoes, and extra virgin olive oil.',
    265, 420, 25, 18, 26, 'non-veg',
    ARRAY['Keto Friendly', 'High Protein'],
    ARRAY['Lettuce', 'Boiled Egg', 'Olives', 'Cherry Tomato', 'Olive Oil'],
    '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg', true, false
  )
) AS v(name, description, price, calories, protein_grams, carbs_grams, fat_grams, dietary_type, tags, ingredients_summary, image_url, is_available, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.salads LIMIT 1);

INSERT INTO public.ingredients (name, category, price, calories, protein_grams, is_veg, is_vegan, is_available)
SELECT * FROM (VALUES
  ('Crisp Romaine Lettuce', 'base', 80, 25, 2, true, true, true),
  ('Organic Baby Spinach', 'base', 95, 30, 3, true, true, true),
  ('Massaged Tuscan Kale', 'base', 105, 40, 4, true, true, true),
  ('Tri-Color Quinoa', 'base', 120, 165, 6, true, true, true),
  ('Herb-Grilled Paneer', 'protein', 85, 185, 14, true, false, true),
  ('Crispy Baked Tofu', 'protein', 75, 140, 15, true, true, true),
  ('Rosemary Grilled Chicken', 'protein', 110, 195, 28, false, false, true),
  ('Roasted Spiced Chickpeas', 'protein', 55, 135, 7, true, true, true),
  ('Pasture Boiled Egg (2x)', 'protein', 60, 155, 13, false, false, true),
  ('English Cucumber', 'topping', 25, 15, 1, true, true, true),
  ('Cherry Tomatoes', 'topping', 30, 20, 1, true, true, true),
  ('Kalamata Olives', 'topping', 45, 55, 0, true, true, true),
  ('Toasted Almonds & Walnuts', 'topping', 55, 95, 4, true, true, true),
  ('Roasted Pumpkin & Chia Seeds', 'topping', 40, 75, 4, true, true, true),
  ('Cold-Pressed Olive Oil & Herbs', 'dressing', 25, 90, 0, true, true, true),
  ('Zesty Lemon Vinaigrette', 'dressing', 20, 60, 0, true, true, true),
  ('Greek Yogurt Mint Dressing', 'dressing', 30, 55, 3, true, false, true),
  ('Aged Balsamic Reduction', 'dressing', 30, 45, 0, true, true, true)
) AS v(name, category, price, calories, protein_grams, is_veg, is_vegan, is_available)
WHERE NOT EXISTS (SELECT 1 FROM public.ingredients LIMIT 1);

-- Seed Demo Admin & Members (Password for all: password123)
DO $$
DECLARE
  v_basic_id uuid;
  v_standard_id uuid;
  v_premium_id uuid;
  v_member1_id uuid;
  v_member2_id uuid;
  v_salad1_id uuid;
  v_salad2_id uuid;
  v_sub1_id uuid;
BEGIN
  SELECT id INTO v_basic_id FROM public.plans WHERE slug = 'basic' LIMIT 1;
  SELECT id INTO v_standard_id FROM public.plans WHERE slug = 'standard' LIMIT 1;
  SELECT id INTO v_premium_id FROM public.plans WHERE slug = 'premium' LIMIT 1;
  SELECT id INTO v_salad1_id FROM public.salads LIMIT 1;
  SELECT id INTO v_salad2_id FROM public.salads OFFSET 1 LIMIT 1;

  INSERT INTO public.users (name, email, password_hash, phone, address, role, plan_id, is_active)
  VALUES
    ('Shalini Sharma', 'admin@verdantbowl.com', crypt('password123', gen_salt('bf')), '+91 98765 00001', 'Verdant Kitchen HQ, Indiranagar, Bengaluru 560038', 'admin', NULL, true),
    ('Ananya Nair', 'member@verdantbowl.com', crypt('password123', gen_salt('bf')), '+91 98201 44510', '402 Palm Grove Residency, Koramangala 4th Block, Bengaluru 560034', 'member', v_standard_id, true),
    ('Rohan Verma', 'rohan@verdantbowl.com', crypt('password123', gen_salt('bf')), '+91 98112 77823', '18 Maple Enclave, HSR Layout Sector 2, Bengaluru 560102', 'member', v_premium_id, true),
    ('Meera Krishnan', 'meera@verdantbowl.com', crypt('password123', gen_salt('bf')), '+91 99004 33190', '72 Cedar Park, Jayanagar 3rd Block, Bengaluru 560011', 'member', v_basic_id, true)
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_member1_id FROM public.users WHERE email = 'member@verdantbowl.com';
  SELECT id INTO v_member2_id FROM public.users WHERE email = 'rohan@verdantbowl.com';

  IF v_member1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = v_member1_id) THEN
    INSERT INTO public.subscriptions (
      user_id, plan_id, status, payment_method, start_date, end_date,
      total_days, salads_per_day, amount_paid, delivery_address, time_slot, preferred_salad_id
    )
    VALUES (
      v_member1_id, v_standard_id, 'active', 'cod', current_date, current_date + 25,
      26, 1, 3899, '402 Palm Grove Residency, Koramangala 4th Block, Bengaluru 560034',
      'Lunch (12:00 PM - 2:00 PM)', v_salad1_id
    )
    RETURNING id INTO v_sub1_id;

    INSERT INTO public.payments (user_id, subscription_id, purpose, amount, currency, method, status)
    VALUES (v_member1_id, v_sub1_id, 'subscription', 3899, 'INR', 'cod', 'pending_cod');

    FOR i IN 0..4 LOOP
      INSERT INTO public.orders (
        order_number, user_id, subscription_id, is_subscription_order, scheduled_date,
        items, subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
        delivery_address, time_slot, payment_method, payment_status, status
      )
      VALUES (
        'VB-SUB-' || (1001 + i)::text,
        v_member1_id, v_sub1_id, true, current_date + i,
        jsonb_build_array(jsonb_build_object(
          'itemType', 'salad',
          'saladId', v_salad1_id,
          'name', 'Mediterranean Quinoa & Chickpea Bowl',
          'quantity', 1,
          'unitPrice', 0,
          'calories', 410,
          'customizationDetails', 'Monthly Plan Daily Bowl'
        )),
        0, 0, 0, 0, 0,
        '402 Palm Grove Residency, Koramangala 4th Block, Bengaluru 560034',
        'Lunch (12:00 PM - 2:00 PM)', 'subscription', 'pending',
        CASE WHEN i = 0 THEN 'Delivered' WHEN i = 1 THEN 'Preparing' ELSE 'Pending' END
      )
      ON CONFLICT (order_number) DO NOTHING;
    END LOOP;
  END IF;

  IF v_member2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = 'VB-2041') THEN
    INSERT INTO public.orders (
      order_number, user_id, subscription_id, is_subscription_order, scheduled_date,
      items, subtotal, discount_percent, discount_amount, delivery_fee, total_amount,
      delivery_address, time_slot, payment_method, payment_status, status
    )
    VALUES (
      'VB-2041', v_member2_id, NULL, false, current_date,
      jsonb_build_array(jsonb_build_object(
        'itemType', 'salad',
        'saladId', v_salad2_id,
        'name', 'Tuscan Kale & Herb Chicken Protein Bowl',
        'quantity', 2,
        'unitPrice', 319,
        'calories', 465
      )),
      638, 25, 160, 0, 478,
      '18 Maple Enclave, HSR Layout Sector 2, Bengaluru 560102',
      'Dinner (6:30 PM - 8:30 PM)', 'cod', 'pending', 'Out for Delivery'
    )
    ON CONFLICT (order_number) DO NOTHING;
  END IF;
END $$;
