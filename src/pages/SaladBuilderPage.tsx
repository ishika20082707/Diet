import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Check, Heart, Plus, Trash2 } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { CustomSalad, Ingredient } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function SaladBuilderPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [favorites, setFavorites] = useState<CustomSalad[]>([]);
  const [loading, setLoading] = useState(true);

  const [baseId, setBaseId] = useState('');
  const [proteinIds, setProteinIds] = useState<string[]>([]);
  const [toppingIds, setToppingIds] = useState<string[]>([]);
  const [dressingId, setDressingId] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [bowlName, setBowlName] = useState('');

  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [savingFav, setSavingFav] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabaseApi
      .getIngredients(true)
      .then((data) => {
        setIngredients(data);
        const firstBase = data.find((i) => i.category === 'base');
        const firstDressing = data.find((i) => i.category === 'dressing');
        if (firstBase) setBaseId(firstBase._id);
        if (firstDressing) setDressingId(firstDressing._id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load ingredients.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    supabaseApi
      .getCustomSalads(user._id)
      .then((data) => setFavorites(data))
      .catch(() => {});
  }, [user]);

  const grouped = useMemo(() => {
    return {
      bases: ingredients.filter((i) => i.category === 'base'),
      proteins: ingredients.filter((i) => i.category === 'protein'),
      toppings: ingredients.filter((i) => i.category === 'topping'),
      dressings: ingredients.filter((i) => i.category === 'dressing'),
    };
  }, [ingredients]);

  const selectedItems = useMemo(() => {
    const base = grouped.bases.find((i) => i._id === baseId);
    const dressing = grouped.dressings.find((i) => i._id === dressingId);
    const proteins = grouped.proteins.filter((i) => proteinIds.includes(i._id));
    const toppings = grouped.toppings.filter((i) => toppingIds.includes(i._id));
    const all = [base, ...proteins, ...toppings, dressing].filter(
      Boolean
    ) as Ingredient[];

    const totalPrice = all.reduce((s, i) => s + i.price, 0);
    const totalCalories = all.reduce((s, i) => s + i.calories, 0);
    const totalProtein = all.reduce((s, i) => s + i.proteinGrams, 0);

    return { base, dressing, proteins, toppings, all, totalPrice, totalCalories, totalProtein };
  }, [grouped, baseId, proteinIds, toppingIds, dressingId]);

  const toggleMulti = (id: string, list: string[], setter: (val: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const buildSummaryText = () => {
    const parts: string[] = [];
    if (selectedItems.base) parts.push(selectedItems.base.name);
    if (selectedItems.proteins.length)
      parts.push(selectedItems.proteins.map((p) => p.name).join(', '));
    if (selectedItems.toppings.length)
      parts.push(selectedItems.toppings.map((t) => t.name).join(', '));
    if (selectedItems.dressing) parts.push(selectedItems.dressing.name);
    return parts.join(' + ');
  };

  const handleAddToCart = () => {
    if (!selectedItems.base || !selectedItems.dressing) {
      setError('Please pick at least one base and one dressing.');
      return;
    }
    setError('');
    const displayName = bowlName.trim() || `Custom ${selectedItems.base.name} Bowl`;
    const details = buildSummaryText();
    addItem({
      cartKey: `custom:${baseId}:${proteinIds.sort().join(',')}:${toppingIds
        .sort()
        .join(',')}:${dressingId}:${specialInstructions.trim()}`,
      itemType: 'custom',
      name: displayName,
      unitPrice: selectedItems.totalPrice,
      calories: selectedItems.totalCalories,
      customizationDetails: details,
      specialInstructions: specialInstructions.trim(),
    });
    setFeedback('Custom bowl added to cart.');
    setTimeout(() => setFeedback(''), 2000);
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/builder' } });
      return;
    }
    if (!selectedItems.base || !selectedItems.dressing) {
      setError('Please pick a base and dressing before saving.');
      return;
    }

    setSavingFav(true);
    setError('');
    try {
      const name =
        bowlName.trim() || `My ${selectedItems.base.name.split(' ')[0]} Power Bowl`;
      const data = await supabaseApi.saveCustomSalad(user._id, {
        name,
        baseId,
        proteinIds,
        toppingIds,
        dressingId,
        specialInstructions,
      });
      setFavorites((prev) => [data, ...prev]);
      setBowlName('');
      setFeedback(`Saved "${data.name}" to your favorites.`);
      setTimeout(() => setFeedback(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save custom bowl.');
    } finally {
      setSavingFav(false);
    }
  };

  const applyFavorite = (fav: CustomSalad) => {
    if (fav.base) setBaseId(fav.base._id);
    if (fav.dressing) setDressingId(fav.dressing._id);
    setProteinIds(fav.proteins.map((p) => p._id));
    setToppingIds(fav.toppings.map((t) => t._id));
    setSpecialInstructions(fav.specialInstructions || '');
    setBowlName(fav.name);
    setFeedback(`Loaded "${fav.name}" into builder.`);
    setTimeout(() => setFeedback(''), 2000);
  };

  const deleteFavorite = async (id: string) => {
    if (!user) return;
    try {
      await supabaseApi.deleteCustomSalad(id, user._id);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove favorite.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="border-b border-[#E2E8E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
          Interactive Bowl Configurator
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#14261C] sm:text-4xl">
          Build Your Custom Diet Salad
        </h1>
        <p className="mt-2 text-sm text-[#52665A]">
          Select your greens, lean proteins, crunchy toppings, and dressing with live
          calorie and price calculation.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 h-96 animate-pulse rounded-xl bg-[#F1F5F0]" />
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Builder Steps */}
          <div className="space-y-10 lg:col-span-8">
            {/* Step 1: Base */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-[#14261C]">
                  01. Choose a Base
                </h2>
                <span className="text-xs text-[#52665A]">Required · Pick 1</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.bases.map((item) => {
                  const selected = baseId === item._id;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setBaseId(item._id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#166534] bg-[#F1F5F0]'
                          : 'border-[#E2E8E0] bg-white hover:border-[#A7C4AE]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#14261C]">
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono-num text-xs text-[#52665A]">
                          {item.calories} kcal · {item.proteinGrams}g protein
                        </p>
                      </div>
                      <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                        ₹{item.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Proteins */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-[#14261C]">
                  02. Add Proteins
                </h2>
                <span className="text-xs text-[#52665A]">Optional · Multi-select</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.proteins.map((item) => {
                  const selected = proteinIds.includes(item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => toggleMulti(item._id, proteinIds, setProteinIds)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#166534] bg-[#F1F5F0]'
                          : 'border-[#E2E8E0] bg-white hover:border-[#A7C4AE]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#14261C]">
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono-num text-xs text-[#52665A]">
                          {item.calories} kcal · {item.proteinGrams}g protein ·{' '}
                          {item.isVegan ? 'Vegan' : item.isVeg ? 'Veg' : 'Non-Veg'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                          +₹{item.price}
                        </span>
                        {selected && <Check className="h-4 w-4 text-[#166534]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Toppings */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-[#14261C]">
                  03. Pick Fresh Toppings
                </h2>
                <span className="text-xs text-[#52665A]">Optional · Multi-select</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.toppings.map((item) => {
                  const selected = toppingIds.includes(item._id);
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => toggleMulti(item._id, toppingIds, setToppingIds)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#166534] bg-[#F1F5F0]'
                          : 'border-[#E2E8E0] bg-white hover:border-[#A7C4AE]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#14261C]">
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono-num text-xs text-[#52665A]">
                          {item.calories} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                          +₹{item.price}
                        </span>
                        {selected && <Check className="h-4 w-4 text-[#166534]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Dressing */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-[#14261C]">
                  04. Select Cold-Pressed Dressing
                </h2>
                <span className="text-xs text-[#52665A]">Required · Pick 1</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {grouped.dressings.map((item) => {
                  const selected = dressingId === item._id;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setDressingId(item._id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#166534] bg-[#F1F5F0]'
                          : 'border-[#E2E8E0] bg-white hover:border-[#A7C4AE]'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#14261C]">
                          {item.name}
                        </p>
                        <p className="mt-0.5 font-mono-num text-xs text-[#52665A]">
                          {item.calories} kcal · {item.isVegan ? 'Vegan' : 'Veg'}
                        </p>
                      </div>
                      <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                        +₹{item.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 5: Special Instructions */}
            <section>
              <h2 className="text-lg font-semibold text-[#14261C]">
                05. Kitchen Notes & Naming
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#3B4E42]">
                    Custom Bowl Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={bowlName}
                    onChange={(e) => setBowlName(e.target.value)}
                    placeholder="e.g. Post-Workout Paneer Mix"
                    className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3B4E42]">
                    Special Kitchen Instructions
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. No onion, dressing on the side"
                    className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sticky Live Calculator & Saved Favorites */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-24 rounded-xl border border-[#E2E8E0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#14261C]">
                Live Bowl Summary
              </h2>

              <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-[#F1F5F0] p-4">
                <div>
                  <p className="text-xs text-[#52665A]">Price</p>
                  <p className="font-mono-num mt-0.5 text-lg font-semibold text-[#14261C]">
                    ₹{selectedItems.totalPrice}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#52665A]">Calories</p>
                  <p className="font-mono-num mt-0.5 text-lg font-semibold text-[#14261C]">
                    {selectedItems.totalCalories}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#52665A]">Protein</p>
                  <p className="font-mono-num mt-0.5 text-lg font-semibold text-[#14261C]">
                    {selectedItems.totalProtein}g
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2 border-b border-[#E2E8E0] pb-4 text-sm">
                {selectedItems.all.map((ing) => (
                  <div key={ing._id} className="flex justify-between text-[#3B4E42]">
                    <span>{ing.name}</span>
                    <span className="font-mono-num text-xs text-[#52665A]">
                      ₹{ing.price} · {ing.calories} kcal
                    </span>
                  </div>
                ))}
                {specialInstructions.trim() && (
                  <p className="pt-2 text-xs text-[#52665A]">
                    Note: {specialInstructions.trim()}
                  </p>
                )}
              </div>

              {error && (
                <p className="mt-4 text-xs font-medium text-red-700">{error}</p>
              )}
              {feedback && (
                <p className="mt-4 text-xs font-medium text-[#166534]">{feedback}</p>
              )}

              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532D]"
                >
                  <Plus className="h-4 w-4" />
                  Add Custom Bowl to Cart
                </button>
                <button
                  type="button"
                  disabled={savingFav}
                  onClick={handleSaveFavorite}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D4DFD1] bg-white px-4 py-2.5 text-sm font-medium text-[#14261C] transition-colors hover:bg-[#F1F5F0] disabled:opacity-50"
                >
                  <Bookmark className="h-4 w-4 text-[#166534]" />
                  {savingFav ? 'Saving...' : 'Save as Favorite Bowl'}
                </button>
              </div>

              {/* Saved Favorites List */}
              {user && (
                <div className="mt-6 border-t border-[#E2E8E0] pt-5">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[#166534]" />
                    <h3 className="text-sm font-semibold text-[#14261C]">
                      Saved Favorites ({favorites.length})
                    </h3>
                  </div>
                  {favorites.length === 0 ? (
                    <p className="mt-2 text-xs text-[#52665A]">
                      Save a custom mix above to reorder it in one click.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {favorites.map((fav) => (
                        <li
                          key={fav._id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8E0] px-3 py-2 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => applyFavorite(fav)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate font-medium text-[#14261C] hover:text-[#166534]">
                              {fav.name}
                            </p>
                            <p className="font-mono-num text-[#52665A]">
                              ₹{fav.totalPrice} · {fav.totalCalories} kcal
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFavorite(fav._id)}
                            aria-label={`Remove ${fav.name}`}
                            className="rounded p-1 text-[#6B7F73] hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
