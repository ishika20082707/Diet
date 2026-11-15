import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PauseCircle, PlayCircle, XCircle } from 'lucide-react';
import { supabaseApi } from '../services/supabaseApi';
import { Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { MemberLayout } from '../components/MemberLayout';
import { ConfirmModal } from '../components/ConfirmModal';

export function MySubscriptionPage() {
  const { user, refreshProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  const loadSubscriptions = useCallback(() => {
    if (!user) return;
    setLoading(true);
    supabaseApi
      .getMySubscriptions(user._id)
      .then((data) => setSubscriptions(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subscriptions.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handlePause = async (id: string) => {
    if (!user) return;
    setActionLoading(true);
    setError('');
    try {
      await supabaseApi.pauseSubscription(id, user._id);
      await refreshProfile();
      loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (id: string) => {
    if (!user) return;
    setActionLoading(true);
    setError('');
    try {
      await supabaseApi.resumeSubscription(id, user._id);
      await refreshProfile();
      loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !user) return;
    setActionLoading(true);
    setError('');
    try {
      await supabaseApi.cancelSubscription(cancelTarget._id, user._id);
      await refreshProfile();
      setCancelTarget(null);
      loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MemberLayout breadcrumb="My Subscription" title="Monthly Subscriptions">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-8 text-sm text-[#52665A]">
          Loading subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8E0] bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-[#14261C]">
            No active monthly subscription
          </h2>
          <p className="mt-1 text-sm text-[#52665A]">
            Choose Basic, Standard, or Premium to automate daily salad deliveries.
          </p>
          <Link
            to="/plans"
            className="mt-5 inline-block rounded-lg bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#14532D]"
          >
            Browse Membership Plans
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              className="rounded-xl border border-[#E2E8E0] bg-white p-6"
            >
              <div className="flex flex-col justify-between gap-4 border-b border-[#E2E8E0] pb-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-semibold text-[#14261C]">
                      {sub.plan?.name} Plan
                    </h2>
                    <span
                      className={`text-xs font-semibold uppercase ${
                        sub.status === 'active'
                          ? 'text-[#16A34A]'
                          : sub.status === 'paused'
                          ? 'text-[#D97706]'
                          : 'text-[#DC2626]'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#52665A]">
                    {sub.saladsPerDay} salad(s)/day · {sub.totalDays} delivery days ·
                    Cash on Delivery
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {sub.status === 'active' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePause(sub._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <PauseCircle className="h-4 w-4" />
                      Pause Plan
                    </button>
                  )}
                  {sub.status === 'paused' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleResume(sub._id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#14532D] disabled:opacity-50"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Resume Plan
                    </button>
                  )}
                  {(sub.status === 'active' || sub.status === 'paused') && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setCancelTarget(sub)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-[#52665A]">Start Date</dt>
                  <dd className="font-mono-num mt-1 font-medium text-[#14261C]">
                    {new Date(sub.startDate).toLocaleDateString('en-IN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#52665A]">End Date</dt>
                  <dd className="font-mono-num mt-1 font-medium text-[#14261C]">
                    {new Date(sub.endDate).toLocaleDateString('en-IN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#52665A]">Delivery Slot</dt>
                  <dd className="mt-1 font-medium text-[#14261C]">{sub.timeSlot}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#52665A]">Plan Amount</dt>
                  <dd className="font-mono-num mt-1 font-semibold text-[#14261C]">
                    ₹{sub.amountPaid.toLocaleString('en-IN')}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-[#52665A]">
                Delivery Address: <span className="text-[#14261C]">{sub.deliveryAddress}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel Monthly Subscription?"
        message="Cancelling stops all remaining pending daily deliveries and removes your active member order discount."
        confirmLabel="Cancel Subscription"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </MemberLayout>
  );
}
