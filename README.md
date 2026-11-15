# Verdant Bowl — Diet Salad & Membership Application

Full-stack web application for a Diet Salad business featuring monthly wellness memberships, automated daily order generation, an interactive custom salad builder, Cash on Delivery (COD) checkout, custom JWT sessions, and role-based Member and Admin portals connected directly to Supabase.

## Tech Stack
- **Frontend**: React 19 (Vite) + Tailwind CSS v4 + React Router + Axios + Context API + `@supabase/supabase-js`
- **Database**: Supabase (PostgreSQL + `pgcrypto` password hashing + Row Level Security)
- **Backend (JWT & Static/Dev Server)**: Node.js + Express.js (`server.ts`)
- **Authentication**: Custom JWT (`JWT_SECRET`) + `pgcrypto` bcrypt verification (`admin` and `member` roles)
- **Payments**: Cash on Delivery (COD) only

## Key Structure
```text
├── supabase_schema.sql            # Complete SQL schema, RPC auth functions, RLS policies & seed data
├── server.ts                      # Express + Vite server entry point (port 3000, JWT sign/verify)
├── server/
│   ├── middleware/auth.ts         # Custom JWT helpers
│   ├── routes/auth.ts             # /api/auth/jwt-sign & /api/auth/jwt-verify
│   └── ...                        # Express API modules
└── src/
    ├── lib/supabase.ts            # Supabase client initialization
    ├── services/supabaseApi.ts    # Typed Supabase CRUD, COD checkout, subscriptions & daily order generation
    ├── api/client.ts              # Axios client with Bearer token interceptor
    ├── context/
    │   ├── AuthContext.tsx        # JWT-backed Supabase session context
    │   └── CartContext.tsx
    ├── components/                # Navbar, Footer, Layouts, Modals, ProtectedRoute, SaladImage
    └── pages/                     # 14 pages (Menu, Plans, Builder, Cart, Checkout, Member & Admin portals)
```

## Supabase Setup & Run Steps
1. **Create Supabase Tables & Seed Data**:
   Open your Supabase project dashboard → **SQL Editor**, paste the entire contents of `supabase_schema.sql`, and click **Run**.
   This creates all 8 tables (`plans`, `users`, `salads`, `ingredients`, `custom_salads`, `subscriptions`, `orders`, `payments`), `pgcrypto` RPC auth functions (`register_user`, `login_user`, `admin_create_member`), RLS policies, and initial demo data.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `JWT_SECRET`.
4. **Run in development**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.
5. **Build & run for production**:
   ```bash
   npm run build
   npm start
   ```

## Seeded Demo Credentials
- **Admin**: `admin@verdantbowl.com` / `password123`
- **Member**: `member@verdantbowl.com` / `password123`

