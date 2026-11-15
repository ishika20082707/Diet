import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Ingredient, IngredientCategory, Salad } from '../types';
import { AdminLayout } from '../components/AdminLayout';
import { ConfirmModal } from '../components/ConfirmModal';

const IMAGE_PRESETS = [
  {
    label: 'Mediterranean Quinoa',
    url: '/src/assets/images/salad_mediterranean_quinoa_1794716401769.jpg',
  },
  {
    label: 'Chicken & Kale',
    url: '/src/assets/images/salad_grilled_chicken_kale_1794716401880.jpg',
  },
  {
    label: 'Paneer & Spinach',
    url: '/src/assets/images/salad_paneer_spinach_1794716402501.jpg',
  },
  {
    label: 'Tofu & Greens',
    url: '/src/assets/images/salad_tofu_sesame_greens_1794716403491.jpg',
  },
  {
    label: 'Avocado Detox',
    url: '/src/assets/images/hero_diet_salad_1794716401699.jpg',
  },
];

export function ManageMenuPage() {
  const [tab, setTab] = useState<'salads' | 'ingredients'>('salads');
  const [salads, setSalads] = useState<Salad[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Salad form state
  const [editingSaladId, setEditingSaladId] = useState<string | null>(null);
  const [showSaladForm, setShowSaladForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sPrice, setSPrice] = useState('249');
  const [sCalories, setSCalories] = useState('400');
  const [sProtein, setSProtein] = useState('20');
  const [sDiet, setSDiet] = useState<'veg' | 'vegan' | 'non-veg'>('veg');
  const [sImage, setSImage] = useState(IMAGE_PRESETS[0].url);
  const [sFeatured, setSFeatured] = useState(false);

  // Ingredient form state
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [showIngForm, setShowIngForm] = useState(false);
  const [iName, setIName] = useState('');
  const [iCategory, setICategory] = useState<IngredientCategory>('base');
  const [iPrice, setIPrice] = useState('50');
  const [iCalories, setICalories] = useState('80');
  const [iProtein, setIProtein] = useState('4');
  const [iVegan, setIVegan] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'salad' | 'ingredient';
    id: string;
    name: string;
  } | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([supabaseApi.getSalads(false), supabaseApi.getIngredients(false)])
      .then(([sData, iData]) => {
        setSalads(sData);
        setIngredients(iData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load menu.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetSaladForm = () => {
    setEditingSaladId(null);
    setSName('');
    setSDesc('');
    setSPrice('249');
    setSCalories('400');
    setSProtein('20');
    setSDiet('veg');
    setSImage(IMAGE_PRESETS[0].url);
    setSFeatured(false);
    setShowSaladForm(false);
  };

  const openEditSalad = (salad: Salad) => {
    setEditingSaladId(salad._id);
    setSName(salad.name);
    setSDesc(salad.description);
    setSPrice(String(salad.price));
    setSCalories(String(salad.calories));
    setSProtein(String(salad.proteinGrams));
    setSDiet(salad.dietaryType);
    setSImage(salad.imageUrl);
    setSFeatured(salad.featured);
    setShowSaladForm(true);
  };

  const handleSaveSalad = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: sName,
        description: sDesc,
        price: Number(sPrice),
        calories: Number(sCalories),
        proteinGrams: Number(sProtein),
        dietaryType: sDiet,
        imageUrl: sImage,
        featured: sFeatured,
      };
      if (editingSaladId) {
        await supabaseApi.updateSalad(editingSaladId, payload);
      } else {
        await supabaseApi.createSalad(payload);
      }
      resetSaladForm();
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save salad.');
    }
  };

  const resetIngForm = () => {
    setEditingIngId(null);
    setIName('');
    setICategory('base');
    setIPrice('50');
    setICalories('80');
    setIProtein('4');
    setIVegan(true);
    setShowIngForm(false);
  };

  const openEditIng = (ing: Ingredient) => {
    setEditingIngId(ing._id);
    setIName(ing.name);
    setICategory(ing.category);
    setIPrice(String(ing.price));
    setICalories(String(ing.calories));
    setIProtein(String(ing.proteinGrams));
    setIVegan(ing.isVegan);
    setShowIngForm(true);
  };

  const handleSaveIng = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: iName,
        category: iCategory,
        price: Number(iPrice),
        calories: Number(iCalories),
        proteinGrams: Number(iProtein),
        isVegan: iVegan,
        isVeg: true,
      };
      if (editingIngId) {
        await supabaseApi.updateIngredient(editingIngId, payload);
      } else {
        await supabaseApi.createIngredient(payload);
      }
      resetIngForm();
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ingredient.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'salad') {
      await supabaseApi.deleteSalad(deleteTarget.id);
    } else {
      await supabaseApi.deleteIngredient(deleteTarget.id);
    }
    setDeleteTarget(null);
    loadAll();
  };

  return (
    <AdminLayout
      breadcrumb="Manage Menu"
      title="Salads & Builder Ingredients"
      action={
        <button
          type="button"
          onClick={() => {
            if (tab === 'salads') {
              resetSaladForm();
              setShowSaladForm(true);
            } else {
              resetIngForm();
              setShowIngForm(true);
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532D] whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          {tab === 'salads' ? 'Add Salad' : 'Add Ingredient'}
        </button>
      }
    >
      <div className="mb-6 inline-flex rounded-lg bg-[#EEF2EC] p-1">
        <button
          type="button"
          onClick={() => setTab('salads')}
          className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
            tab === 'salads' ? 'bg-white text-[#14261C] shadow-xs' : 'text-[#52665A]'
          }`}
        >
          Signature Salads ({salads.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('ingredients')}
          className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
            tab === 'ingredients'
              ? 'bg-white text-[#14261C] shadow-xs'
              : 'text-[#52665A]'
          }`}
        >
          Builder Ingredients ({ingredients.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Salad Form */}
      {tab === 'salads' && showSaladForm && (
        <form
          onSubmit={handleSaveSalad}
          className="mb-8 rounded-xl border border-[#E2E8E0] bg-white p-6"
        >
          <h2 className="text-base font-semibold text-[#14261C]">
            {editingSaladId ? 'Edit Salad Item' : 'Add New Salad'}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Name</label>
              <input
                type="text"
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Price (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={sPrice}
                onChange={(e) => setSPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Calories</label>
              <input
                type="number"
                required
                min={0}
                value={sCalories}
                onChange={(e) => setSCalories(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Protein (g)
              </label>
              <input
                type="number"
                required
                min={0}
                value={sProtein}
                onChange={(e) => setSProtein(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Dietary Type
              </label>
              <select
                value={sDiet}
                onChange={(e) =>
                  setSDiet(e.target.value as 'veg' | 'vegan' | 'non-veg')
                }
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm"
              >
                <option value="veg">Veg</option>
                <option value="vegan">Vegan</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Bowl Image
              </label>
              <select
                value={sImage}
                onChange={(e) => setSImage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm"
              >
                {IMAGE_PRESETS.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-[#3B4E42]">
                Description
              </label>
              <textarea
                rows={2}
                required
                value={sDesc}
                onChange={(e) => setSDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#3B4E42]">
            <input
              type="checkbox"
              checked={sFeatured}
              onChange={(e) => setSFeatured(e.target.checked)}
            />
            Show in homepage featured collection
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetSaladForm}
              className="rounded-lg border border-[#D4DFD1] px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#166534] px-5 py-2 text-sm font-semibold text-white"
            >
              {editingSaladId ? 'Update Salad' : 'Save Salad'}
            </button>
          </div>
        </form>
      )}

      {/* Ingredient Form */}
      {tab === 'ingredients' && showIngForm && (
        <form
          onSubmit={handleSaveIng}
          className="mb-8 rounded-xl border border-[#E2E8E0] bg-white p-6"
        >
          <h2 className="text-base font-semibold text-[#14261C]">
            {editingIngId ? 'Edit Builder Ingredient' : 'Add Builder Ingredient'}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Name</label>
              <input
                type="text"
                required
                value={iName}
                onChange={(e) => setIName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Category
              </label>
              <select
                value={iCategory}
                onChange={(e) =>
                  setICategory(e.target.value as IngredientCategory)
                }
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm"
              >
                <option value="base">Base</option>
                <option value="protein">Protein</option>
                <option value="topping">Topping</option>
                <option value="dressing">Dressing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Price (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={iPrice}
                onChange={(e) => setIPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">Calories</label>
              <input
                type="number"
                required
                min={0}
                value={iCalories}
                onChange={(e) => setICalories(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Protein (g)
              </label>
              <input
                type="number"
                required
                min={0}
                value={iProtein}
                onChange={(e) => setIProtein(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#3B4E42]">
            <input
              type="checkbox"
              checked={iVegan}
              onChange={(e) => setIVegan(e.target.checked)}
            />
            Plant-based (Vegan)
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetIngForm}
              className="rounded-lg border border-[#D4DFD1] px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#166534] px-5 py-2 text-sm font-semibold text-white"
            >
              {editingIngId ? 'Update Ingredient' : 'Save Ingredient'}
            </button>
          </div>
        </form>
      )}

      {/* Tables */}
      {loading ? (
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-8 text-sm text-[#52665A]">
          Loading menu items...
        </div>
      ) : tab === 'salads' ? (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8E0] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
              <tr>
                <th className="px-5 py-3">Salad</th>
                <th className="px-5 py-3">Dietary</th>
                <th className="px-5 py-3">Calories</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E0]">
              {salads.map((salad) => (
                <tr key={salad._id} className="hover:bg-[#F9FAF8]">
                  <td className="px-5 py-3.5 font-medium text-[#14261C]">
                    {salad.name}
                  </td>
                  <td className="px-5 py-3.5 capitalize text-[#52665A]">
                    {salad.dietaryType}
                  </td>
                  <td className="font-mono-num px-5 py-3.5 text-[#3B4E42]">
                    {salad.calories} kcal
                  </td>
                  <td className="font-mono-num px-5 py-3.5 font-medium text-[#14261C]">
                    ₹{salad.price}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditSalad(salad)}
                        className="rounded-lg border border-[#D4DFD1] p-1.5 text-[#3B4E42] hover:bg-[#F1F5F0]"
                        aria-label={`Edit ${salad.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'salad',
                            id: salad._id,
                            name: salad.name,
                          })
                        }
                        className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${salad.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8E0] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
              <tr>
                <th className="px-5 py-3">Ingredient</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Calories</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E0]">
              {ingredients.map((ing) => (
                <tr key={ing._id} className="hover:bg-[#F9FAF8]">
                  <td className="px-5 py-3.5 font-medium text-[#14261C]">{ing.name}</td>
                  <td className="px-5 py-3.5 capitalize text-[#52665A]">
                    {ing.category}
                  </td>
                  <td className="font-mono-num px-5 py-3.5 text-[#3B4E42]">
                    {ing.calories} kcal
                  </td>
                  <td className="font-mono-num px-5 py-3.5 font-medium text-[#14261C]">
                    ₹{ing.price}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditIng(ing)}
                        className="rounded-lg border border-[#D4DFD1] p-1.5 text-[#3B4E42] hover:bg-[#F1F5F0]"
                        aria-label={`Edit ${ing.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'ingredient',
                            id: ing._id,
                            name: ing.name,
                          })
                        }
                        className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${ing.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message="This permanently removes the item from the kitchen catalog."
        confirmLabel="Delete Item"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
