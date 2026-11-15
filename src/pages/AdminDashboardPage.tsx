import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseApi } from '../services/supabaseApi';
import { Order, Subscription, User } from '../types';
import { AdminLayout } from '../components/AdminLayout';
import { OrderStatusText } from './MemberDashboardPage';

export function AdminDashboardPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabaseApi.getMembers(),
      supabaseApi.getAllOrders(),
      supabaseApi.getAllSubscriptions(),
    ])
      .then(([mData, oData, sData]) => {
        setMembers(mData);
        setOrders(oData);
        setSubscriptions(sData);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeMembersCount = members.filter((m) => m.isActive).length;
  const activeSubsCount = subscriptions.filter((s) => s.status === 'active').length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const totalRevenue =
    subscriptions.reduce((s, sub) => s + sub.amountPaid, 0) +
    orders
      .filter((o) => !o.isSubscriptionOrder && o.status !== 'Cancelled')
      .reduce((s, o) => s + o.totalAmount, 0);

  return (
    <AdminLayout breadcrumb="Dashboard" title="Kitchen Operations Overview">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Active Members</p>
          <p className="font-mono-num mt-2 text-2xl font-semibold text-[#14261C]">
            {loading ? '—' : activeMembersCount}
          </p>
          <p className="mt-1 font-mono-num text-xs text-[#52665A]">
            {members.length} total registered
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Active Subscriptions</p>
          <p className="font-mono-num mt-2 text-2xl font-semibold text-[#14261C]">
            {loading ? '—' : activeSubsCount}
          </p>
          <p className="mt-1 font-mono-num text-xs text-[#52665A]">
            {subscriptions.length} total plans
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Pending Kitchen Orders</p>
          <p className="font-mono-num mt-2 text-2xl font-semibold text-[#14261C]">
            {loading ? '—' : pendingOrdersCount}
          </p>
          <p className="mt-1 font-mono-num text-xs text-[#52665A]">
            {orders.length} total orders
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8E0] bg-white p-5">
          <p className="text-xs font-medium text-[#52665A]">Gross Revenue</p>
          <p className="font-mono-num mt-2 text-2xl font-semibold text-[#14261C]">
            {loading ? '—' : `₹${totalRevenue.toLocaleString('en-IN')}`}
          </p>
          <p className="mt-1 text-xs text-[#166534]">Orders & subscriptions</p>
        </div>
      </div>

      {/* Recent Orders */}
      <section className="mt-8 rounded-xl border border-[#E2E8E0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8E0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#14261C]">Latest Orders</h2>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-[#166534] hover:underline"
          >
            Manage all orders &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
              <tr>
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Scheduled</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E0]">
              {orders.slice(0, 6).map((order) => {
                const customerName =
                  typeof order.user === 'object' && order.user ? order.user.name : 'Member';
                return (
                  <tr key={order._id} className="hover:bg-[#F9FAF8]">
                    <td className="font-mono-num px-6 py-3.5 font-medium text-[#14261C]">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5 text-[#3B4E42]">{customerName}</td>
                    <td className="font-mono-num px-6 py-3.5 text-xs text-[#52665A]">
                      {new Date(order.scheduledDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <OrderStatusText status={order.status} />
                    </td>
                    <td className="font-mono-num px-6 py-3.5 text-right font-medium text-[#14261C]">
                      {order.isSubscriptionOrder ? 'Plan' : `₹${order.totalAmount}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active Subscriptions Table */}
      <section className="mt-8 rounded-xl border border-[#E2E8E0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8E0] px-6 py-4">
          <h2 className="text-base font-semibold text-[#14261C]">
            Member Subscriptions
          </h2>
          <Link
            to="/admin/members"
            className="text-xs font-medium text-[#166534] hover:underline"
          >
            Manage members &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E0]">
              {subscriptions.slice(0, 6).map((sub) => {
                const memberName =
                  typeof sub.user === 'object' && sub.user ? sub.user.name : 'Member';
                return (
                  <tr key={sub._id} className="hover:bg-[#F9FAF8]">
                    <td className="px-6 py-3.5 font-medium text-[#14261C]">
                      {memberName}
                    </td>
                    <td className="px-6 py-3.5 text-[#3B4E42]">{sub.plan?.name}</td>
                    <td className="font-mono-num px-6 py-3.5 text-xs text-[#52665A]">
                      {new Date(sub.startDate).toLocaleDateString('en-IN')} –{' '}
                      {new Date(sub.endDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          sub.status === 'active'
                            ? 'text-[#16A34A]'
                            : sub.status === 'paused'
                            ? 'text-[#D97706]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="font-mono-num px-6 py-3.5 text-right font-medium text-[#14261C]">
                      ₹{sub.amountPaid.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
