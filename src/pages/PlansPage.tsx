import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banknote, Check, Sparkles } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Plan, Salad } from '../types';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = [
  'Morning (7:30 AM - 9:30 AM)',
  'Lunch (12:00 PM - 2:00 PM)',
  'Dinner (6:30 PM - 8:30 PM)',
];

export function PlansPage() {
  const { user, activeSubscription, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [salads, setSalads] = useState<Salad[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [preferredSaladId, setPreferredSaladId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    Promise.all([supabaseApi.getPlans(), supabaseApi.getSalads(true)])
      .then(([plansData, saladsData]) => {
        setPlans(plansData);
        setSalads(saladsData);

        const paramId = searchParams.get('selected');
        const initial =
          plansData.find((p) => p._id === paramId) ||
          plansData.find((p) => p.slug === 'standard') ||
          plansData[0] ||
          null;
        setSelectedPlan(initial);
        if (saladsData[0]) setPreferredSaladId(saladsData[0]._id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load plans.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (user?.address && !deliveryAddress) {
      setDeliveryAddress(user.address);
    }
  }, [user, deliveryAddress]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/login', { state: { from: '/plans' } });
      return;
    }

    if (!selectedPlan) {
      setError('Please choose a membership plan.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      await supabaseApi.createCodSubscription(user, {
        plan: selectedPlan,
        deliveryAddress,
        timeSlot,
        preferredSaladId: preferredSaladId || null,
      });

      await refreshProfile();
      setSuccessMessage(
        `${selectedPlan.name} Cash on Delivery membership activated! ${selectedPlan.daysPerMonth} daily salad orders have been scheduled.`
      );
      setTimeout(() => navigate('/member/subscription'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
          Monthly Wellness Memberships
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#14261C] sm:text-4xl [text-wrap:balance]">
          Choose a daily salad cadence that fits your schedule
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#52665A]">
          Every plan auto-schedules your daily fresh bowls, unlocks member-only order
          discounts, and lets you pause or resume anytime with Cash on Delivery billing.
        </p>
      </div>

      {activeSubscription && (
        <div className="mt-6 rounded-xl border border-[#166534]/30 bg-[#F1F5F0] p-4 text-sm text-[#14261C]">
          You currently have a <strong>{activeSubscription.status}</strong>{' '}
          <strong>{activeSubscription.plan?.name}</strong> subscription.{' '}
          <button
            type="button"
            onClick={() => navigate('/member/subscription')}
            className="font-semibold text-[#166534] underline"
          >
            Manage your subscription &rarr;
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-xl border border-[#E2E8E0] bg-[#F1F5F0]"
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Plans Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:col-span-8">
            {plans.map((plan) => {
              const isSelected = selectedPlan?._id === plan._id;
              return (
                <div
                  key={plan._id}
                  onClick={() => setSelectedPlan(plan)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedPlan(plan);
                  }}
                  className={`flex cursor-pointer flex-col rounded-xl border p-6 transition-colors ${
                    isSelected
                      ? 'border-[#166534] bg-white ring-1 ring-[#166534]'
                      : 'border-[#E2E8E0] bg-white hover:border-[#A7C4AE]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-[#14261C]">
                      {plan.name}
                    </h2>
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#166534] text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#52665A]">{plan.targetAudience}</p>

                  <div className="mt-5 border-b border-[#E2E8E0] pb-4">
                    <span className="font-mono-num text-3xl font-semibold text-[#14261C]">
                      ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="ml-1 text-xs text-[#52665A]">/ month</span>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm text-[#3B4E42]">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Cash on Delivery Subscription Panel */}
          <form
            onSubmit={handleSubscribe}
            className="rounded-xl border border-[#E2E8E0] bg-white p-6 lg:col-span-4"
          >
            <h3 className="text-lg font-semibold text-[#14261C]">
              Activate {selectedPlan?.name} Plan
            </h3>
            <p className="mt-1 text-xs text-[#52665A]">
              Auto-generates {selectedPlan?.daysPerMonth} daily orders starting today.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
                {successMessage}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Apartment, street, landmark, postal code"
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Daily Delivery Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3B4E42]">
                  Preferred Default Bowl
                </label>
                <select
                  value={preferredSaladId}
                  onChange={(e) => setPreferredSaladId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                >
                  <option value="">Rotate chef&apos;s daily selection</option>
                  {salads.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.calories} kcal)
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-[#D4DFD1] bg-[#F9FAF8] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#14261C]">
                  <Banknote className="h-4 w-4 text-[#166534]" />
                  Cash on Delivery Only
                </div>
                <p className="mt-1 text-xs text-[#52665A]">
                  Pay directly in cash upon your first scheduled doorstep delivery. No
                  online payment required.
                </p>
              </div>
            </div>

            {selectedPlan && (
              <div className="mt-6 border-t border-[#E2E8E0] pt-4 text-sm">
                <div className="flex justify-between text-[#52665A]">
                  <span>Plan Total ({selectedPlan.daysPerMonth} days)</span>
                  <span className="font-mono-num font-semibold text-[#14261C]">
                    ₹{selectedPlan.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-[#166534]">
                  <span>Extra Order Member Discount</span>
                  <span className="font-mono-num">{selectedPlan.discountPercent}% off</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedPlan || Boolean(activeSubscription)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {!user
                ? 'Sign In to Subscribe'
                : submitting
                ? 'Scheduling Plan...'
                : 'Confirm COD Subscription'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
