import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Salad } from '../types';
import { useCart } from '../context/CartContext';
import { SaladImage } from '../components/SaladImage';

export function MenuPage() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'vegan' | 'veg' | 'non-veg'>('all');
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    supabaseApi
      .getSalads(true)
      .then((data) => setSalads(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load menu.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredSalads = useMemo(() => {
    return salads.filter((salad) => {
      const matchesDiet = dietFilter === 'all' || salad.dietaryType === dietFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        salad.name.toLowerCase().includes(q) ||
        salad.description.toLowerCase().includes(q) ||
        salad.ingredientsSummary.some((i) => i.toLowerCase().includes(q));
      return matchesDiet && matchesSearch;
    });
  }, [salads, dietFilter, search]);

  const handleAdd = (salad: Salad) => {
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
    setTimeout(() => setAddedId(null), 1300);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col justify-between gap-6 border-b border-[#E2E8E0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
            Fresh Kitchen Menu
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#14261C] sm:text-4xl">
            Daily Diet Salads
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#52665A]">
            Every bowl lists verified calories and macronutrients. Looking for exact
            customizations?{' '}
            <Link to="/builder" className="font-medium text-[#166534] underline">
              Open the Salad Builder
            </Link>
            .
          </p>
        </div>

        {/* Interactive filter controls + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7F73]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bowls or ingredients..."
              className="w-full rounded-lg border border-[#D4DFD1] bg-white py-2 pl-9 pr-3 text-sm text-[#14261C] placeholder:text-[#6B7F73] focus:border-[#166534] focus:outline-none sm:w-60"
            />
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-lg bg-[#EEF2EC] p-1"
            role="group"
            aria-label="Dietary filter"
          >
            {(['all', 'vegan', 'veg', 'non-veg'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDietFilter(type)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  dietFilter === type
                    ? 'bg-white text-[#14261C] shadow-xs'
                    : 'text-[#52665A] hover:text-[#14261C]'
                }`}
              >
                {type === 'all' ? 'All' : type === 'non-veg' ? 'High Protein' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {error}
        </div>
      ) : loading ? (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 animate-pulse rounded-xl border border-[#E2E8E0] bg-[#F1F5F0]"
            />
          ))}
        </div>
      ) : filteredSalads.length === 0 ? (
        <div className="mt-12 rounded-xl border border-[#E2E8E0] bg-white p-12 text-center">
          <p className="text-base font-medium text-[#14261C]">
            No salads match your current filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setDietFilter('all');
              setSearch('');
            }}
            className="mt-4 rounded-lg border border-[#D4DFD1] px-4 py-2 text-sm font-medium text-[#14261C] hover:bg-[#F1F5F0]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSalads.map((salad) => (
            <article
              key={salad._id}
              className="flex flex-col overflow-hidden rounded-xl border border-[#E2E8E0] bg-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F5F0]">
                <SaladImage
                  src={salad.imageUrl}
                  alt={salad.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2 text-xs text-[#52665A]">
                  <span className="font-semibold capitalize text-[#166534]">
                    {salad.dietaryType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{salad.calories} kcal</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{salad.proteinGrams}g P</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{salad.carbsGrams}g C</span>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-[#14261C]">
                  {salad.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#52665A]">
                  {salad.description}
                </p>

                {salad.ingredientsSummary.length > 0 && (
                  <p className="mt-3 text-xs text-[#6B7F73]">
                    {salad.ingredientsSummary.join(' · ')}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-[#E2E8E0] pt-4">
                  <span className="font-mono-num text-lg font-semibold text-[#14261C]">
                    ₹{salad.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdd(salad)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#14532D] whitespace-nowrap"
                  >
                    {addedId === salad._id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Added to Cart
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
  );
}
