'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

/**
 * Admin Affiliate Dashboard
 * 
 * Comprehensive dashboard for managing affiliates, viewing stats, and processing payouts
 */
export default function AdminAffiliateDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState({ code: '', max_uses: 1, expires_at: '', notes: '' });
  const [splitModalAffiliate, setSplitModalAffiliate] = useState(null);
  const [splitForm, setSplitForm] = useState({ total: 30, payout: 30, discount: 0, commissionType: 'first_payment_only' });
  const [splitSaving, setSplitSaving] = useState(false);
  const [attributionModalAffiliate, setAttributionModalAffiliate] = useState(null);
  const [attributionLoading, setAttributionLoading] = useState(false);
  const [attributionSummary, setAttributionSummary] = useState(null);
  const [attributionError, setAttributionError] = useState('');
  const NON_DESTRUCTIVE_NOTE = 'Non-destructive: does not delete past commissions or referral history.';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, statusFilter]);

  async function fetchDashboardData() {
    setLoading(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.error('[Admin Affiliates] No auth token');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch all admin data in parallel
      const [overviewRes, affiliatesRes, topPerformersRes, pendingPayoutsRes, inviteCodesRes] = await Promise.all([
        fetch('/api/admin/affiliates/overview', { headers }),
        fetch(`/api/admin/affiliates?status=${statusFilter === 'all' ? '' : statusFilter}`, { headers }),
        fetch('/api/admin/affiliates/top-performers?limit=10', { headers }),
        fetch('/api/admin/affiliates/payouts/pending', { headers }),
        fetch('/api/admin/affiliates/invite-codes?limit=100', { headers }),
      ]);

      const overviewData = await overviewRes.json();
      const affiliatesData = await affiliatesRes.json();
      const topPerformersData = await topPerformersRes.json();
      const pendingPayoutsData = await pendingPayoutsRes.json();
      const inviteCodesData = await inviteCodesRes.json();

      setOverview(overviewData);
      setAffiliates(affiliatesData.affiliates || []);
      setTopPerformers(topPerformersData.top_performers || []);
      setPendingPayouts(pendingPayoutsData.payouts || []);
      setInviteCodes(inviteCodesData.codes || []);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveAffiliate(affiliate) {
    const confirmed = window.confirm(
      `Approve affiliate ${affiliate?.email || affiliate?.affiliate_id}?\n\n${NON_DESTRUCTIVE_NOTE}`
    );
    if (!confirmed) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      const res = await fetch(`/api/admin/affiliates/id/${affiliate.affiliate_id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to approve affiliate');
      }
      fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to approve:', error);
      alert(error?.message || 'Failed to approve affiliate');
    }
  }

  function openSplitModal(affiliate) {
    const totalRaw = affiliate.affiliate_percentage_budget ?? affiliate.commission_rate ?? 0.3;
    const payoutRaw = affiliate.affiliate_payout_rate ?? affiliate.commission_rate ?? totalRaw;
    const discountRaw = affiliate.referral_discount_rate ?? Math.max(0, totalRaw - payoutRaw);
    const commissionTypeRaw = affiliate.commission_type === 'recurring' ? 'recurring' : 'first_payment_only';

    setSplitForm({
      total: Number((totalRaw * 100).toFixed(2)),
      payout: Number((payoutRaw * 100).toFixed(2)),
      discount: Number((discountRaw * 100).toFixed(2)),
      commissionType: commissionTypeRaw,
    });
    setSplitModalAffiliate(affiliate);
  }

  function updateSplitPayout(nextPayout) {
    const payout = Math.max(0, Math.min(Number(nextPayout) || 0, splitForm.total));
    setSplitForm(prev => ({
      ...prev,
      payout,
      discount: Number((prev.total - payout).toFixed(2)),
    }));
  }

  function updateSplitDiscount(nextDiscount) {
    const discount = Math.max(0, Math.min(Number(nextDiscount) || 0, splitForm.total));
    setSplitForm(prev => ({
      ...prev,
      discount,
      payout: Number((prev.total - discount).toFixed(2)),
    }));
  }

  function updateSplitTotal(nextTotal) {
    const total = Math.max(0, Number(nextTotal) || 0);
    setSplitForm(prev => {
      const payout = Math.min(prev.payout, total);
      return {
        ...prev,
        total: Number(total.toFixed(2)),
        payout: Number(payout.toFixed(2)),
        discount: Number((total - payout).toFixed(2)),
      };
    });
  }

  async function saveSplitConfig() {
    if (!splitModalAffiliate) return;
    setSplitSaving(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const payload = {
        total_affiliate_percentage: splitForm.total / 100,
        affiliate_payout_percentage: splitForm.payout / 100,
        referral_discount_percentage: splitForm.discount / 100,
      };

      const res = await fetch(`/api/admin/affiliates/id/${splitModalAffiliate.affiliate_id}/split-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to save split config');
      }

      const commissionTypeRes = await fetch(`/api/admin/affiliates/id/${splitModalAffiliate.affiliate_id}/commission-rate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          commission_rate: splitForm.payout / 100,
          commission_type: splitForm.commissionType,
        }),
      });

      if (!commissionTypeRes.ok) {
        const error = await commissionTypeRes.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to save commission type');
      }

      setSplitModalAffiliate(null);
      await fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to save split config:', error);
      alert(error?.message || 'Failed to save split config');
    } finally {
      setSplitSaving(false);
    }
  }

  async function openAttributionModal(affiliate) {
    setAttributionModalAffiliate(affiliate);
    setAttributionSummary(null);
    setAttributionError('');
    setAttributionLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Authentication required');
      }
      const res = await fetch(`/api/admin/affiliates/id/${affiliate.affiliate_id}/attribution-summary?limit=25`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load attribution summary');
      }
      setAttributionSummary(data);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to load attribution summary:', error);
      setAttributionError(error?.message || 'Failed to load attribution summary');
    } finally {
      setAttributionLoading(false);
    }
  }

  async function suspendAffiliate(affiliate) {
    const confirmed = window.confirm(
      `Suspend affiliate ${affiliate?.email || affiliate?.affiliate_id}?\n\n${NON_DESTRUCTIVE_NOTE}`
    );
    if (!confirmed) return;

    const reason = prompt('Enter suspension reason (required):');
    if (!reason) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      const res = await fetch(`/api/admin/affiliates/id/${affiliate.affiliate_id}/suspend`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to suspend affiliate');
      }
      fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to suspend:', error);
      alert(error?.message || 'Failed to suspend affiliate');
    }
  }

  async function reactivateAffiliate(affiliate) {
    const confirmed = window.confirm(
      `Reactivate affiliate ${affiliate?.email || affiliate?.affiliate_id}?\n\n${NON_DESTRUCTIVE_NOTE}`
    );
    if (!confirmed) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const res = await fetch(`/api/admin/affiliates/id/${affiliate.affiliate_id}/unsuspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to reactivate affiliate');
      }
      fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to reactivate:', error);
      alert(error?.message || 'Failed to reactivate affiliate');
    }
  }

  const filteredAffiliates = affiliates.filter(affiliate =>
    searchQuery ? 
      affiliate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.name?.toLowerCase().includes(searchQuery.toLowerCase())
    : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="alert alert-error">
        <AlertTriangle className="w-5 h-5" />
        <span>Failed to load affiliate data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Affiliate Program</h1>
          <p className="text-base-content/40 mt-1">Manage affiliates, payouts, and performance</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-outline btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/40">Total Affiliates</p>
                <p className="text-3xl font-bold mt-1">{overview.total_affiliates}</p>
                <p className="text-sm text-success mt-1">
                  {overview.active_affiliates} active
                </p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/40">Total Referrals</p>
                <p className="text-3xl font-bold mt-1">{overview.total_referrals}</p>
                <p className="text-sm text-base-content/40 mt-1">sign-ups tracked</p>
              </div>
              <UserCheck className="w-8 h-8 text-success opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/40">Commissions Paid</p>
                <p className="text-3xl font-bold mt-1">
                  ${(overview.total_commissions_paid || 0).toFixed(2)}
                </p>
                <p className="text-sm text-base-content/40 mt-1">all-time</p>
              </div>
              <DollarSign className="w-8 h-8 text-success opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/40">Pending Payouts</p>
                <p className="text-3xl font-bold mt-1">
                  ${(overview.pending_payouts || 0).toFixed(2)}
                </p>
                <p className="text-sm text-warning mt-1">
                  {pendingPayouts.length} requests
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Performers
          </h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Affiliate</th>
                  <th>Email</th>
                  <th>Referrals</th>
                  <th>Commissions</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.slice(0, 5).map((performer, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{performer.user_id || 'N/A'}</td>
                    <td>{performer.email || 'N/A'}</td>
                    <td>{performer.referrals || 0}</td>
                    <td className="font-bold text-success">
                      ${(performer.commissions || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Affiliates List */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">All Affiliates</h2>
            <div className="flex gap-2">
              {/* Search */}
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="input input-bordered input-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="btn btn-square btn-sm">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <select
                className="select select-bordered select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Referral Code</th>
                  <th>Status</th>
                  <th>Split</th>
                  <th>Referrals</th>
                  <th>Commissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.affiliate_id}>
                    <td>{affiliate.email}</td>
                    <td>
                      <code className="badge badge-sm">{affiliate.referral_code}</code>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${
                        affiliate.status === 'active' ? 'badge-success' :
                        affiliate.status === 'pending' ? 'badge-warning' :
                        affiliate.status === 'suspended' ? 'badge-error' :
                        'badge-ghost'
                      }`}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs">
                        <div>Budget: {(((affiliate.affiliate_percentage_budget ?? affiliate.commission_rate ?? 0) * 100).toFixed(1))}%</div>
                        <div>Affiliate: {(((affiliate.affiliate_payout_rate ?? affiliate.commission_rate ?? 0) * 100).toFixed(1))}%</div>
                        <div>User: {(((affiliate.referral_discount_rate ?? 0) * 100).toFixed(1))}%</div>
                        <div>Type: {affiliate.commission_type === 'recurring' ? 'Recurring' : 'First payment only'}</div>
                      </div>
                    </td>
                    <td>{affiliate.total_signups || 0}</td>
                    <td>${(affiliate.total_commissions_earned || 0).toFixed(2)}</td>
                    <td>
                      <div className="flex gap-1">
                        {affiliate.status === 'pending' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => approveAffiliate(affiliate)}
                          >
                            Approve
                          </button>
                        )}
                        {affiliate.status === 'active' && (
                          <button
                            className="btn btn-xs btn-warning"
                            onClick={() => suspendAffiliate(affiliate)}
                          >
                            Suspend
                          </button>
                        )}
                        {affiliate.status === 'suspended' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => reactivateAffiliate(affiliate)}
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => openSplitModal(affiliate)}
                          title="Edit payout/discount split"
                        >
                          Split
                        </button>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => openAttributionModal(affiliate)}
                          title="View attribution summary"
                        >
                          Attribution
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAffiliates.length === 0 && (
            <div className="text-center py-8 text-base-content/50">
              No affiliates found
            </div>
          )}
        </div>
      </div>

      {/* Pending Payouts */}
      {pendingPayouts.length > 0 && (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Pending Payouts ({pendingPayouts.length})
            </h2>
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Affiliate</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayouts.map((payout) => (
                    <tr key={payout.payout_id}>
                      <td>{payout.affiliate_email}</td>
                      <td className="font-bold">${payout.amount.toFixed(2)}</td>
                      <td>
                        <span className="badge badge-warning">{payout.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-xs btn-primary">
                          Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invite Codes Management */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title flex items-center gap-2">
              <Users className="w-5 h-5" />
              Invite Codes
            </h2>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowInviteModal(true)}
            >
              Generate Code
            </button>
          </div>

          {showInviteModal && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Generate Invite Code</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Code (leave empty for auto-generate)</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="WRYDA-XXXXXX"
                      value={newInviteCode.code}
                      onChange={(e) => setNewInviteCode({ ...newInviteCode, code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Max Uses</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      value={newInviteCode.max_uses}
                      onChange={(e) => setNewInviteCode({ ...newInviteCode, max_uses: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Expires At (optional, YYYY-MM-DD)</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={newInviteCode.expires_at}
                      onChange={(e) => setNewInviteCode({ ...newInviteCode, expires_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Notes (optional)</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full"
                      value={newInviteCode.notes}
                      onChange={(e) => setNewInviteCode({ ...newInviteCode, notes: e.target.value })}
                      placeholder="e.g., For YouTube partner X"
                    />
                  </div>
                </div>
                <div className="modal-action">
                  <button 
                    className="btn"
                    onClick={() => {
                      setShowInviteModal(false);
                      setNewInviteCode({ code: '', max_uses: 1, expires_at: '', notes: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        const token = await getToken({ template: 'wryda-backend' });
                        const expiresAt = newInviteCode.expires_at 
                          ? new Date(newInviteCode.expires_at).getTime() 
                          : undefined;

                        const res = await fetch('/api/admin/affiliates/invite-codes', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            code: newInviteCode.code || undefined,
                            max_uses: newInviteCode.max_uses,
                            expires_at: expiresAt,
                            notes: newInviteCode.notes || undefined,
                          }),
                        });

                        if (res.ok) {
                          setShowInviteModal(false);
                          setNewInviteCode({ code: '', max_uses: 1, expires_at: '', notes: '' });
                          fetchDashboardData();
                        } else {
                          const error = await res.json();
                          alert(`Error: ${error.error}`);
                        }
                      } catch (error) {
                        console.error('Error creating invite code:', error);
                        alert('Failed to create invite code');
                      }
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Uses</th>
                  <th>Max Uses</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inviteCodes.map((code) => (
                  <tr key={code.code}>
                    <td className="font-mono font-semibold">{code.code}</td>
                    <td>{code.current_uses || 0}</td>
                    <td>{code.max_uses}</td>
                    <td>
                      {code.expires_at 
                        ? new Date(code.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <span className={`badge ${code.is_active ? 'badge-success' : 'badge-error'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">{code.notes || '-'}</td>
                    <td>
                      {code.is_active && (
                        <button
                          className="btn btn-xs btn-error"
                          onClick={async () => {
                            if (confirm(`Deactivate invite code ${code.code}?`)) {
                              try {
                                const token = await getToken({ template: 'wryda-backend' });
                                const res = await fetch(`/api/admin/affiliates/invite-codes/${code.code}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });

                                if (res.ok) {
                                  fetchDashboardData();
                                } else {
                                  alert('Failed to deactivate code');
                                }
                              } catch (error) {
                                console.error('Error deactivating invite code:', error);
                                alert('Failed to deactivate code');
                              }
                            }
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inviteCodes.length === 0 && (
            <div className="text-center py-8 text-base-content/50">
              No invite codes yet. Generate one to get started.
            </div>
          )}
        </div>
      </div>

      {splitModalAffiliate && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Affiliate Split Configuration</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Configure how the affiliate percentage budget is split between affiliate payout and user discount.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Total Affiliate Percentage Budget</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="input input-bordered w-full"
                  value={splitForm.total}
                  onChange={(e) => updateSplitTotal(e.target.value)}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Affiliate Payout %</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={splitForm.total}
                  step="0.1"
                  className="range range-primary"
                  value={splitForm.payout}
                  onChange={(e) => updateSplitPayout(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max={splitForm.total}
                  step="0.1"
                  className="input input-bordered w-full mt-2"
                  value={splitForm.payout}
                  onChange={(e) => updateSplitPayout(e.target.value)}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">User Discount %</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={splitForm.total}
                  step="0.1"
                  className="range range-secondary"
                  value={splitForm.discount}
                  onChange={(e) => updateSplitDiscount(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max={splitForm.total}
                  step="0.1"
                  className="input input-bordered w-full mt-2"
                  value={splitForm.discount}
                  onChange={(e) => updateSplitDiscount(e.target.value)}
                />
              </div>

              <div className="text-sm bg-base-300 rounded p-3">
                <div>Total budget: <b>{splitForm.total.toFixed(2)}%</b></div>
                <div>Affiliate payout: <b>{splitForm.payout.toFixed(2)}%</b></div>
                <div>User discount: <b>{splitForm.discount.toFixed(2)}%</b></div>
                <div>Check: <b>{(splitForm.payout + splitForm.discount).toFixed(2)}%</b></div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Commission Type</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={splitForm.commissionType}
                  onChange={(e) => setSplitForm(prev => ({ ...prev, commissionType: e.target.value }))}
                >
                  <option value="first_payment_only">First payment only (default)</option>
                  <option value="recurring">Recurring (renewals included)</option>
                </select>
                <p className="text-xs text-base-content/60 mt-2">
                  Controls whether the affiliate earns once or on each successful renewal.
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setSplitModalAffiliate(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveSplitConfig} disabled={splitSaving}>
                {splitSaving ? 'Saving...' : 'Save Split'}
              </button>
            </div>
          </div>
        </div>
      )}

      {attributionModalAffiliate && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-2">Attribution Summary</h3>
            <p className="text-sm text-base-content/60 mb-4">
              {attributionModalAffiliate.email} ({attributionModalAffiliate.referral_code})
            </p>

            {attributionLoading && (
              <div className="py-8 text-center">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}

            {!attributionLoading && attributionError && (
              <div className="alert alert-error">
                <span>{attributionError}</span>
              </div>
            )}

            {!attributionLoading && !attributionError && attributionSummary && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="card bg-base-300">
                    <div className="card-body p-3">
                      <div className="text-xs opacity-70">Manual Code</div>
                      <div className="text-xl font-bold">{attributionSummary.attribution?.by_source?.manual_code || 0}</div>
                    </div>
                  </div>
                  <div className="card bg-base-300">
                    <div className="card-body p-3">
                      <div className="text-xs opacity-70">Query Param</div>
                      <div className="text-xl font-bold">{attributionSummary.attribution?.by_source?.query_param || 0}</div>
                    </div>
                  </div>
                  <div className="card bg-base-300">
                    <div className="card-body p-3">
                      <div className="text-xs opacity-70">Cookie</div>
                      <div className="text-xl font-bold">{attributionSummary.attribution?.by_source?.cookie || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-300">
                  <div className="card-body p-3">
                    <div className="text-sm font-semibold mb-2">Funnel</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>Clicked: <b>{attributionSummary.funnel?.clicked || 0}</b></div>
                      <div>Signed up: <b>{attributionSummary.funnel?.signed_up || 0}</b></div>
                      <div>Converted: <b>{attributionSummary.funnel?.converted || 0}</b></div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Recent Attributions</div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="table table-zebra table-sm">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Source</th>
                          <th>Code</th>
                          <th>Captured</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(attributionSummary.attribution?.recent_attributions || []).map((row) => (
                          <tr key={`${row.user_id}-${row.captured_at}`}>
                            <td>{row.email || row.user_id}</td>
                            <td>{row.source}</td>
                            <td><code>{row.referral_code_used}</code></td>
                            <td>{row.captured_at ? new Date(row.captured_at).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setAttributionModalAffiliate(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

