import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle2 } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const TIME_SLOTS = [
  'Morning (7:30 AM - 9:30 AM)',
  'Lunch (12:00 PM - 2:00 PM)',
  'Dinner (6:30 PM - 8:30 PM)',
];

export function CheckoutPage() {
  const { user } = useAuth();
  const {
    items,
    subtotal,
    discountPercent,
    discountAmount,
    deliveryFee,
    grandTotal,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user?.address && !deliveryAddress) setDeliveryAddress(user.address);
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
  }, [user, deliveryAddress, contactPhone]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!contactPhone.trim()) {
      setError('Phone number is required for Cash on Delivery verification.');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Delivery address is required.');
      return;
    }

    if (!user) return;
    setSubmitting(true);
    try {
      const data = await supabaseApi.createCodOrder(user, {
        items: items.map((i) => ({
          itemType: i.itemType,
          saladId: i.saladId,
          customSaladId: i.customSaladId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          calories: i.calories,
          customizationDetails: i.customizationDetails,
          specialInstructions: i.specialInstructions,
        })),
        deliveryAddress,
        timeSlot,
      });

      setConfirmedOrder(data);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-8">
          <div className="flex items-center gap-3 text-[#166534]">
            <CheckCircle2 className="h-7 w-7" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
              Order Confirmed
            </p>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-[#14261C]">
            Order #{confirmedOrder.orderNumber} Placed
          </h1>
          <p className="mt-2 text-sm text-[#52665A]">
            Our kitchen will prepare your fresh bowls for the{' '}
            <strong className="text-[#14261C]">{confirmedOrder.timeSlot}</strong> slot.
          </p>

          <dl className="mt-6 space-y-2.5 border-y border-[#E2E8E0] py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#52665A]">Delivery Address</dt>
              <dd className="max-w-xs text-right font-medium text-[#14261C]">
                {confirmedOrder.deliveryAddress}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#52665A]">Payment Method</dt>
              <dd className="font-medium text-[#14261C]">Cash on Delivery</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#52665A]">Amount Payable on Delivery</dt>
              <dd className="font-mono-num font-semibold text-[#14261C]">
                ₹{confirmedOrder.totalAmount}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/member/orders"
              className="rounded-lg bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#14532D]"
            >
              Track Order in My Orders
            </Link>
            <Link
              to="/menu"
              className="rounded-lg border border-[#D4DFD1] px-5 py-2.5 text-sm font-medium text-[#14261C] hover:bg-[#F1F5F0]"
            >
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-base font-medium text-[#14261C]">
          Your cart is empty. Add salads before checking out.
        </p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="mt-4 rounded-lg bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="border-b border-[#E2E8E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#166534]">
          Cash on Delivery Checkout
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#14261C]">
          Delivery Verification & Time Slot
        </h1>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <form
          onSubmit={handleCheckout}
          className="space-y-6 rounded-xl border border-[#E2E8E0] bg-white p-6 lg:col-span-7"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[#14261C]">
                Recipient Name
              </label>
              <input
                type="text"
                readOnly
                value={user?.name || ''}
                className="mt-1.5 w-full rounded-lg border border-[#E2E8E0] bg-[#F9FAF8] px-3.5 py-2.5 text-sm text-[#52665A]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#14261C]">
                Contact Phone (for COD rider)
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1.5 w-full rounded-lg border border-[#D4DFD1] px-3.5 py-2.5 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#14261C]">
              Delivery Address
            </label>
            <textarea
              rows={3}
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="House/flat number, street, locality, landmark"
              className="mt-2 w-full rounded-lg border border-[#D4DFD1] px-3.5 py-2.5 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#14261C]">
              Preferred Delivery Time Slot
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    timeSlot === slot
                      ? 'border-[#166534] bg-[#F1F5F0] text-[#166534]'
                      : 'border-[#E2E8E0] text-[#3B4E42] hover:bg-[#F9FAF8]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#D4DFD1] bg-[#F9FAF8] p-4">
            <div className="flex items-center gap-2.5">
              <Banknote className="h-5 w-5 text-[#166534]" />
              <p className="text-sm font-semibold text-[#14261C]">
                Payment Terms: Cash on Delivery Only
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#52665A]">
              Pay{' '}
              <strong className="font-mono-num text-[#14261C]">
                ₹{grandTotal}
              </strong>{' '}
              in cash when your chilled salad bowl arrives. Free delivery applies
              automatically to Premium plans and orders of ₹799 or more.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#166534] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#14532D] disabled:opacity-50"
          >
            {submitting
              ? 'Confirming COD Order...'
              : `Confirm Cash on Delivery Order (₹${grandTotal})`}
          </button>
        </form>

        {/* Order Review */}
        <aside className="rounded-xl border border-[#E2E8E0] bg-white p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold text-[#14261C]">Items in Order</h2>
          <ul className="mt-4 divide-y divide-[#E2E8E0]">
            {items.map((item) => (
              <li key={item.cartKey} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-[#14261C]">
                    {item.name} &times; {item.quantity}
                  </p>
                  {item.customizationDetails && (
                    <p className="text-xs text-[#52665A]">{item.customizationDetails}</p>
                  )}
                </div>
                <span className="font-mono-num font-medium text-[#14261C]">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[#E2E8E0] pt-4 text-sm">
            <div className="flex justify-between text-[#52665A]">
              <dt>Subtotal</dt>
              <dd className="font-mono-num">₹{subtotal}</dd>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[#166534]">
                <dt>Member Discount ({discountPercent}%)</dt>
                <dd className="font-mono-num">-₹{discountAmount}</dd>
              </div>
            )}
            <div className="flex justify-between text-[#52665A]">
              <dt>Delivery Fee</dt>
              <dd className="font-mono-num">
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[#E2E8E0] pt-3 text-base font-semibold text-[#14261C]">
              <dt>Payable on Delivery</dt>
              <dd className="font-mono-num">₹{grandTotal}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
