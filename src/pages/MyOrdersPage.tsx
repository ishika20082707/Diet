import { useEffect, useMemo, useState } from 'react';
import { supabaseApi } from '../services/supabaseApi';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { MemberLayout } from '../components/MemberLayout';
import { OrderStatusText } from './MemberDashboardPage';

export function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'regular' | 'subscription'>('all');

  useEffect(() => {
    if (!user) return;
    supabaseApi
      .getMyOrders(user._id)
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === 'regular') return orders.filter((o) => !o.isSubscriptionOrder);
    if (filter === 'subscription') return orders.filter((o) => o.isSubscriptionOrder);
    return orders;
  }, [orders, filter]);

  return (
    <MemberLayout breadcrumb="My Orders" title="Order History">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg bg-[#EEF2EC] p-1">
          {(['all', 'regular', 'subscription'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-white text-[#14261C] shadow-xs'
                  : 'text-[#52665A] hover:text-[#14261C]'
              }`}
            >
              {tab === 'all'
                ? 'All Orders'
                : tab === 'regular'
                ? 'À La Carte'
                : 'Subscription Days'}
            </button>
          ))}
        </div>
        <span className="font-mono-num text-xs text-[#52665A]">
          {filtered.length} record(s)
        </span>
      </div>

      <div className="rounded-xl border border-[#E2E8E0] bg-white">
        {loading ? (
          <div className="p-8 text-sm text-[#52665A]">Loading order history...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#52665A]">
            No orders found in this category.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8E0]">
            {filtered.map((order) => (
              <div key={order._id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#52665A]">
                    <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                      {order.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {new Date(order.scheduledDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{order.timeSlot}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{order.paymentMethod}</span>
                  </div>
                  <OrderStatusText status={order.status} />
                </div>

                <ul className="mt-3 space-y-1 text-sm text-[#3B4E42]">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-4">
                      <div>
                        <span className="font-medium text-[#14261C]">
                          {item.name} &times; {item.quantity}
                        </span>
                        {item.customizationDetails && (
                          <p className="text-xs text-[#52665A]">
                            {item.customizationDetails}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-xs text-[#166534]">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <span className="font-mono-num text-xs text-[#52665A]">
                        {item.calories * item.quantity} kcal
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8E0] pt-3 text-xs text-[#52665A]">
                  <span>Deliver to: {order.deliveryAddress}</span>
                  <span className="font-mono-num text-sm font-semibold text-[#14261C]">
                    {order.isSubscriptionOrder
                      ? 'Covered by Plan'
                      : `Total: ₹${order.totalAmount}${
                          order.discountAmount > 0
                            ? ` (Saved ₹${order.discountAmount})`
                            : ''
                        }`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
