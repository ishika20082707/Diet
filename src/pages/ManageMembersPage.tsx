import { useCallback, useEffect, useState } from 'react';
import { Plus, RotateCcw, Search, UserMinus } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Plan, User } from '../types';
import { AdminLayout } from '../components/AdminLayout';
import { ConfirmModal } from '../components/ConfirmModal';

export function ManageMembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState('');

  // Add member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Soft delete confirmation modal state
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMembers = useCallback(() => {
    setLoading(true);
    supabaseApi
      .getMembers({ search, status: statusFilter, planId })
      .then((data) => setMembers(data))
      .finally(() => setLoading(false));
  }, [search, statusFilter, planId]);

  useEffect(() => {
    supabaseApi.getPlans().then((data) => setPlans(data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(), 200);
    return () => clearTimeout(timer);
  }, [loadMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (name.trim().length < 2) {
      setFormError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (phone.trim().length < 7) {
      setFormError('Please enter a valid phone number.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await supabaseApi.addMember({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        password,
        planId: planId || null,
      });
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPassword('');
      setPlanId('');
      setShowAddForm(false);
      loadMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      await supabaseApi.deactivateMember(removeTarget._id);
      setRemoveTarget(null);
      loadMembers();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (memberId: string) => {
    await supabaseApi.reactivateMember(memberId);
    loadMembers();
  };

  return (
    <AdminLayout
      breadcrumb="Manage Members"
      title="Member Directory"
      action={
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532D] whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Close Form' : 'Add Member'}
        </button>
      }
    >
      {/* Add Member Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          className="mb-8 rounded-xl border border-[#E2E8E0] bg-white p-6"
        >
          <h2 className="text-base font-semibold text-[#14261C]">
            Add New Member
          </h2>
          {formError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              {formError}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Menon"
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 11223"
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Temporary Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Assigned Plan
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              >
                <option value="">No plan assigned</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.discountPercent}% discount)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#3B4E42]">
                Delivery Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, street, locality"
                className="mt-1 w-full rounded-lg border border-[#D4DFD1] px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-[#D4DFD1] px-4 py-2 text-sm font-medium text-[#14261C] hover:bg-[#F1F5F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#166534] px-5 py-2 text-sm font-semibold text-white hover:bg-[#14532D] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create Member'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7F73]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full rounded-lg border border-[#D4DFD1] bg-white py-2 pl-9 pr-3 text-sm text-[#14261C] focus:border-[#166534] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-[#D4DFD1] bg-white px-3 py-2 text-xs font-medium text-[#14261C] focus:border-[#166534] focus:outline-none"
            aria-label="Filter by plan"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg bg-[#EEF2EC] p-1">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-[#14261C] shadow-xs'
                    : 'text-[#52665A]'
                }`}
              >
                {st === 'inactive' ? 'Deactivated' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-[#E2E8E0] bg-white">
        {loading ? (
          <div className="p-8 text-sm text-[#52665A]">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#52665A]">
            No members match your search or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E2E8E0] bg-[#F9FAF8] text-xs font-medium text-[#52665A]">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E0]">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-[#F9FAF8]">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#14261C]">{member.name}</p>
                      <p className="text-xs text-[#52665A]">{member.email}</p>
                    </td>
                    <td className="font-mono-num px-5 py-3.5 text-xs text-[#3B4E42]">
                      {member.phone}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-[#14261C]">
                      {member.plan ? member.plan.name : 'None'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold ${
                          member.isActive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {member.isActive ? (
                        <button
                          type="button"
                          onClick={() => setRemoveTarget(member)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReactivate(member._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#D4DFD1] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#F1F5F0]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(removeTarget)}
        title={`Deactivate ${removeTarget?.name}?`}
        message="This soft-deletes the member (isActive = false), prevents login, and pauses any active daily salad subscription. You can reactivate them anytime."
        confirmLabel="Deactivate Member"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setRemoveTarget(null)}
      />
    </AdminLayout>
  );
}
