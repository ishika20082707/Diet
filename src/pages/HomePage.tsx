import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Plan, Salad } from '../types';
import { useCart } from '../context/CartContext';
import { SaladImage } from '../components/SaladImage';

export function HomePage() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([supabaseApi.getSalads(true), supabaseApi.getPlans()])
      .then(([saladsData, plansData]) => {
        if (!active) return;
        setSalads(saladsData.filter((s) => s.featured).slice(0, 3));
        setPlans(plansData);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleQuickAdd = (salad: Salad) => {
    addItem({
      cartKey: `salad:${salad._id}`,
      itemType: 'salad',
      saladId: salad._id,
      name: salad.name,
      imageUrl: salad.imageUrl,
      unitPrice: salad.price,
      calories: salad.calories,
    });
    setAddedId(salad._id);
    setTimeout(() => setAddedId(null), 1400);
  };

  return (
    <div>
      {/* Section 1: Storefront Hero */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
              Daily Chilled Kitchen · Bengaluru
            </p>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[1.12] text-[#14261C] sm:text-5xl [text-wrap:balance]">
              Macro-balanced diet bowls crafted fresh every morning.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#4A5E52]">
              Subscribe to a monthly wellness cadence or build your own bowl with
              organic greens, lean proteins, and cold-pressed dressings—delivered
              to your door on schedule.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-lg bg-[#166534] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532D] whitespace-nowrap"
              >
                Explore Daily Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/builder"
                className="inline-flex items-center rounded-lg border border-[#D4DFD1] bg-white px-5 py-3 text-sm font-medium text-[#14261C] transition-colors hover:bg-[#F1F5F0] whitespace-nowrap"
              >
                Build Custom Bowl
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#E2E8E0] pt-6">
              <div>
                <p className="font-mono-num text-xl font-semibold text-[#14261C]">
                  360–465
                </p>
                <p className="mt-0.5 text-xs text-[#52665A]">kcal per bowl</p>
              </div>
              <div>
                <p className="font-mono-num text-xl font-semibold text-[#14261C]">
                  Up to 25%
                </p>
                <p className="mt-0.5 text-xs text-[#52665A]">member savings</p>
              </div>
              <div>
                <p className="font-mono-num text-xl font-semibold text-[#14261C]">
                  20–26 Days
                </p>
                <p className="mt-0.5 text-xs text-[#52665A]">monthly cadences</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] overflow-hidden rounded-2xl border border-[#E2E8E0] bg-[#F1F5F0]">
              <SaladImage
                src="/src/assets/images/hero_diet_salad_1794716401699.jpg"
                alt="Fresh green diet salad bowl with baby spinach, quinoa, grilled herb tofu, avocado, and pumpkin seeds"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Featured Bowls */}
      <section className="border-t border-[#E2E8E0] bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
                Featured Kitchen Menu
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#14261C]">
                Signature Nutrition Bowls
              </h2>
            </div>
            <Link
              to="/menu"
              className="text-sm font-medium text-[#166534] hover:underline whitespace-nowrap"
            >
              View full menu &rarr;
            </Link>
          </div>

          {error ? (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              {error}
            </div>
          ) : loading ? (
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-96 animate-pulse rounded-xl border border-[#E2E8E0] bg-[#F1F5F0]"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {salads.map((salad) => (
                <article
                  key={salad._id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-[#E2E8E0] bg-[#F9FAF8] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F5F0]">
                    <SaladImage
                      src={salad.imageUrl}
                      alt={salad.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs text-[#52665A]">
                      <span className="font-medium capitalize text-[#166534]">
                        {salad.dietaryType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{salad.calories} kcal</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{salad.proteinGrams}g protein</span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold text-[#14261C]">
                      {salad.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#52665A]">
                      {salad.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-[#E2E8E0] pt-4">
                      <span className="font-mono-num text-lg font-semibold text-[#14261C]">
                        ₹{salad.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(salad)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#14532D] whitespace-nowrap"
                      >
                        {addedId === salad._id ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Added
                          </>
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Membership Plans */}
      <section className="border-t border-[#E2E8E0] bg-[#F9FAF8] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
              Monthly Subscriptions
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#14261C] [text-wrap:balance]">
              Consistent nutrition with built-in member discounts
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#52665A]">
              Automate your daily bowl deliveries, pause whenever you travel, and
              unlock member pricing on every extra order.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`flex flex-col rounded-xl border p-7 ${
                  plan.slug === 'standard'
                    ? 'border-[#166534] bg-white'
                    : 'border-[#E2E8E0] bg-white'
                }`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl font-semibold text-[#14261C]">
                    {plan.name}
                  </h3>
                  <span className="font-mono-num text-xs font-medium text-[#166534]">
                    {plan.discountPercent}% Off Orders
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#52665A]">{plan.targetAudience}</p>

                <div className="mt-5 flex items-baseline gap-1.5 border-b border-[#E2E8E0] pb-5">
                  <span className="font-mono-num text-3xl font-semibold text-[#14261C]">
                    ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#52665A]">
                    / {plan.daysPerMonth} delivery days
                  </span>
                </div>

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#52665A]">Daily Allocation</dt>
                    <dd className="font-mono-num font-medium text-[#14261C]">
                      {plan.saladsPerDay} bowl{plan.saladsPerDay > 1 ? 's' : ''}/day
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#52665A]">Monthly Schedule</dt>
                    <dd className="font-mono-num font-medium text-[#14261C]">
                      {plan.daysPerMonth} days/mo
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#52665A]">Delivery</dt>
                    <dd className="font-medium text-[#14261C]">
                      {plan.freeDelivery ? 'Free priority delivery' : `₹${plan.deliveryFee} flat`}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => navigate(`/plans?selected=${plan._id}`)}
                  className={`mt-7 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.slug === 'standard'
                      ? 'bg-[#166534] text-white hover:bg-[#14532D]'
                      : 'border border-[#D4DFD1] bg-[#F9FAF8] text-[#14261C] hover:bg-[#F1F5F0]'
                  }`}
                >
                  Choose {plan.name} Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
