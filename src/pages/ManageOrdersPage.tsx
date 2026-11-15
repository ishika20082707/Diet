import { useCallback, useEffect, useState } from 'react';
import { supabaseApi } from '../services/supabaseApi';
import { Order, OrderStatus } from '../types';
import { AdminLayout } from '../components/AdminLayout';
import { OrderStatusText } from './MemberDashboardPage';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'subscription'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    supabaseApi
      .getAllOrders({ status: statusFilter, type: typeFilter })
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const data = await supabaseApi.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout breadcrumb="Manage Orders" title="Kitchen Order Queue">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg bg-[#EEF2EC] p-1">
          {(['all', 'regular', 'subscription'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-white text-[#14261C] shadow-xs'
                  : 'text-[#52665A]'
              }`}
            >
              {t === 'all' ? 'All Orders' : t === 'regular' ? 'À La Carte' : 'Subscriptions'}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-xs font-medium text-[#14261C] focus:border-[#166534] focus:outline-none"
          aria-label="Filter orders by status"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[#E2E8E0] bg-white">
        {loading ? (
          <div className="p-8 text-sm text-[#52665A]">Loading kitchen orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#52665A]">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Member & Slot</th>
                  <th className="px-5 py-3">Bowls</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Current</th>
                  <th className="px-5 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E0]">
                {orders.map((order) => {
                  const member = typeof order.user === 'object' ? order.user : null;
                  return (
                    <tr key={order._id} className="hover:bg-[#F9FAF8]">
                      <td className="px-5 py-3.5">
                        <p className="font-mono-num font-medium text-[#14261C]">
                          {order.orderNumber}
                        </p>
                        <p className="font-mono-num text-xs text-[#52665A]">
                          {new Date(order.scheduledDate).toLocaleDateString('en-IN')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#14261C]">
                          {member?.name || 'Member'}
                        </p>
                        <p className="text-xs text-[#52665A]">{order.timeSlot}</p>
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-xs text-[#3B4E42]">
                        {order.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                      </td>
                      <td className="font-mono-num px-5 py-3.5 font-medium text-[#14261C]">
                        {order.isSubscriptionOrder ? 'Plan' : `₹${order.totalAmount}`}
                      </td>
                      <td className="px-5 py-3.5">
                        <OrderStatusText status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          disabled={updatingId === order._id}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value as OrderStatus)
                          }
                          aria-label={`Update status for ${order.orderNumber}`}
                          className="rounded-lg border border-[#D4DFD1] bg-white px-2.5 py-1.5 text-xs font-medium text-[#14261C] focus:border-[#166534] focus:outline-none disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
