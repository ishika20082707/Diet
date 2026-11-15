import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SaladImage } from '../components/SaladImage';

export function CartPage() {
  const {
    items,
    totalCalories,
    subtotal,
    discountPercent,
    discountAmount,
    deliveryFee,
    grandTotal,
    updateQuantity,
    removeItem,
  } = useCart();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="border-b border-[#E2E8E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
          Order Bag
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#14261C]">
          Your Salad Cart
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-[#E2E8E0] bg-white p-12 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-[#6B7F73]" strokeWidth={1.5} />
          <h2 className="mt-4 text-lg font-semibold text-[#14261C]">
            Your cart is currently empty
          </h2>
          <p className="mt-1 text-sm text-[#52665A]">
            Explore our signature daily menu or craft a custom nutrition bowl.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/menu"
              className="rounded-lg bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#14532D]"
            >
              Browse Salad Menu
            </Link>
            <Link
              to="/builder"
              className="rounded-lg border border-[#D4DFD1] px-5 py-2.5 text-sm font-medium text-[#14261C] hover:bg-[#F1F5F0]"
            >
              Build Custom Bowl
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Items List */}
          <div className="divide-y divide-[#E2E8E0] rounded-xl border border-[#E2E8E0] bg-white lg:col-span-8">
            {items.map((item) => (
              <div
                key={item.cartKey}
                className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-[#F1F5F0]">
                    <SaladImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#14261C]">
                      {item.name}
                    </h2>
                    <p className="mt-0.5 font-mono-num text-xs text-[#52665A]">
                      {item.calories} kcal · ₹{item.unitPrice} each
                    </p>
                    {item.customizationDetails && (
                      <p className="mt-1 text-xs text-[#52665A]">
                        {item.customizationDetails}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="mt-0.5 text-xs text-[#166534]">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="inline-flex items-center rounded-lg border border-[#D4DFD1]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                      className="p-2 text-[#14261C] hover:bg-[#F1F5F0]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono-num min-w-8 text-center text-sm font-medium text-[#14261C]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      className="p-2 text-[#14261C] hover:bg-[#F1F5F0]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="font-mono-num w-20 text-right text-base font-semibold text-[#14261C]">
                    ₹{item.unitPrice * item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.cartKey)}
                    className="rounded p-1.5 text-[#6B7F73] hover:bg-red-50 hover:text-red-700"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Panel */}
          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-[#E2E8E0] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#14261C]">Order Summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-[#52665A]">
                  <dt>Total Calories</dt>
                  <dd className="font-mono-num font-medium text-[#14261C]">
                    {totalCalories} kcal
                  </dd>
                </div>
                <div className="flex justify-between text-[#52665A]">
                  <dt>Subtotal</dt>
                  <dd className="font-mono-num font-medium text-[#14261C]">
                    ₹{subtotal}
                  </dd>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-[#166534]">
                    <dt>Member Plan Discount ({discountPercent}%)</dt>
                    <dd className="font-mono-num font-medium">-₹{discountAmount}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#52665A]">
                  <dt>Delivery Fee</dt>
                  <dd className="font-mono-num font-medium text-[#14261C]">
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-[#E2E8E0] pt-3 text-base font-semibold text-[#14261C]">
                  <dt>Grand Total</dt>
                  <dd className="font-mono-num">₹{grandTotal}</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-[#52665A]">
                Free delivery on Premium plans or orders above ₹799.
              </p>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="mt-6 w-full rounded-lg bg-[#166534] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532D]"
              >
                Proceed to Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
