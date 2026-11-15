import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseApi } from '../services/supabaseApi';
import { CustomSalad, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { MemberLayout } from '../components/MemberLayout';

export function MemberDashboardPage() {
  const { user, activeSubscription } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<CustomSalad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabaseApi.getMyOrders(user._id),
      supabaseApi.getCustomSalads(user._id),
    ])
      .then(([ordersData, favData]) => {
        setOrders(ordersData);
        setFavorites(favData);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const currentPlan = activeSubscription?.plan || user?.plan || null;

  return (
    <MemberLayout breadcrumb="Overview" title={`Welcome, ${user?.name || 'Member'}`}>
      {/* Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Membership Plan</p>
          <p className="mt-2 font-display text-2xl font-semibold text-[#14261C]">
            {currentPlan ? currentPlan.name : 'No Plan'}
          </p>
          <p className="mt-1 text-xs text-[#166534]">
            {currentPlan
              ? `${currentPlan.discountPercent}% discount on extra orders`
              : 'Subscribe to unlock member discounts'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Subscription Status</p>
          <p className="mt-2 font-display text-2xl font-semibold capitalize text-[#14261C]">
            {activeSubscription ? activeSubscription.status : 'Inactive'}
          </p>
          <p className="mt-1 font-mono-num text-xs text-[#52665A]">
            {activeSubscription
              ? `Ends ${new Date(activeSubscription.endDate).toLocaleDateString('en-IN')}`
              : 'Start a 20 or 26-day plan'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Total Orders & Saved</p>
          <p className="font-mono-num mt-2 text-2xl font-semibold text-[#14261C]">
            {orders.length} orders
          </p>
          <p className="mt-1 font-mono-num text-xs text-[#52665A]">
            {favorites.length} favorite custom bowl(s)
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/menu"
          className="rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532D]"
        >
          Order from Daily Menu
        </Link>
        <Link
          to="/builder"
          className="rounded-lg border border-[#D4DFD1] bg-white px-4 py-2 text-sm font-medium text-[#14261C] hover:bg-[#F1F5F0]"
        >
          Customize a Salad
        </Link>
        {!activeSubscription && (
          <Link
            to="/plans"
            className="rounded-lg border border-[#D4DFD1] bg-white px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#F1F5F0]"
          >
            Choose Monthly Plan
          </Link>
        )}
      </div>

      {/* Recent Orders Table */}
      <section className="mt-8 rounded-xl border border-[#E2E8E0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8E0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#14261C]">
            Recent Deliveries & Orders
          </h2>
          <Link
            to="/member/orders"
            className="text-xs font-medium text-[#166534] hover:underline"
          >
            View all orders &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#52665A]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#52665A]">
            You have no orders yet. Place your first bowl order from the menu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
                <tr>
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-6 py-3">Scheduled Date</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E0]">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order._id} className="hover:bg-[#F9FAF8]">
                    <td className="font-mono-num px-6 py-3.5 font-medium text-[#14261C]">
                      {order.orderNumber}
                    </td>
                    <td className="font-mono-num px-6 py-3.5 text-xs text-[#52665A]">
                      {new Date(order.scheduledDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5 text-[#3B4E42]">
                      {order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-6 py-3.5">
                      <OrderStatusText status={order.status} />
                    </td>
                    <td className="font-mono-num px-6 py-3.5 text-right font-medium text-[#14261C]">
                      {order.isSubscriptionOrder ? 'Plan Covered' : `₹${order.totalAmount}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MemberLayout>
  );
}

export function OrderStatusText({ status }: { status: string }) {
  const color =
    status === 'Delivered'
      ? 'text-[#16A34A]'
      : status === 'Cancelled'
      ? 'text-[#DC2626]'
      : status === 'Out for Delivery'
      ? 'text-[#166534]'
      : 'text-[#D97706]';

  return <span className={`text-xs font-semibold ${color}`}>{status}</span>;
}
