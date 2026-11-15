import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabaseApi } from '../services/supabaseApi';
import { useAuth } from '../context/AuthContext';
import { Plan } from '../types';

export function LoginRegisterPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [plans, setPlans] = useState<Plan[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabaseApi
      .getPlans()
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const user = await login(email, password);
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate(user.role === 'admin' ? '/admin' : '/member');
        }
      } else {
        await register({
          name,
          email,
          phone,
          address,
          password,
          planId: planId || undefined,
        });
        navigate(redirectTo || '/member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'member' | 'admin') => {
    setMode('login');
    setError('');
    if (role === 'admin') {
      setEmail('admin@verdantbowl.com');
      setPassword('password123');
    } else {
      setEmail('member@verdantbowl.com');
      setPassword('password123');
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <div className="rounded-xl border border-[#E2E8E0] bg-white p-8">
        <div className="grid grid-cols-2 rounded-lg bg-[#EEF2EC] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#14261C] shadow-xs'
                : 'text-[#52665A]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-[#14261C] shadow-xs'
                : 'text-[#52665A]'
            }`}
          >
            Create Account
          </button>
        </div>

        <h1 className="mt-6 font-display text-2xl font-semibold text-[#14261C]">
          {mode === 'login' ? 'Welcome back' : 'Join Verdant Bowl'}
        </h1>
        <p className="mt-1 text-sm text-[#52665A]">
          {mode === 'login'
            ? 'Access your daily salad deliveries, saved bowls, and member pricing.'
            : 'Register as a member to order bowls and manage subscriptions.'}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Nair"
                className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#3B4E42]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment, street, locality"
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Preferred Plan Tier (Optional)
                </label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                >
                  <option value="">Decide later</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.discountPercent}% order discount)
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#3B4E42]">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14532D] disabled:opacity-50"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Member Account'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-6 border-t border-[#E2E8E0] pt-5">
          <p className="text-xs font-medium text-[#52665A]">
            Seeded Demo Accounts (click to autofill):
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('member')}
              className="rounded-lg border border-[#D4DFD1] px-3 py-2 text-xs font-medium text-[#14261C] hover:bg-[#F1F5F0]"
            >
              Demo Member
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="rounded-lg border border-[#D4DFD1] px-3 py-2 text-xs font-medium text-[#14261C] hover:bg-[#F1F5F0]"
            >
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
