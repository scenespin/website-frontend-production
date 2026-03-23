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
  const defaultEndDate = new Date().toISOString().slice(0, 10);
  const defaultStartDate = new Date(Date.now() - (29 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
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
  const [varianceReport, setVarianceReport] = useState(null);
  const [varianceLoading, setVarianceLoading] = useState(false);
  const [varianceError, setVarianceError] = useState('');
  const [periodDashboard, setPeriodDashboard] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState('');
  const [periodFilters, setPeriodFilters] = useState({
    period: 'month',
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });
  const [calibrationLogs, setCalibrationLogs] = useState([]);
  const [calibrationLoading, setCalibrationLoading] = useState(false);
  const [calibrationError, setCalibrationError] = useState('');
  const [calibrationSaving, setCalibrationSaving] = useState(false);
  const [calibrationForm, setCalibrationForm] = useState({
    windowStart: defaultStartDate,
    windowEnd: defaultEndDate,
    proposedCostPerCredit: '0.0096',
    adoptedCostPerCredit: '',
    status: 'proposed',
    rationale: '',
    notes: '',
  });
  const [varianceFilters, setVarianceFilters] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    affiliateId: '',
  });
  const NON_DESTRUCTIVE_NOTE = 'Non-destructive: does not delete past commissions or referral history.';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchVarianceReport();
      fetchPeriodDashboard();
      fetchCalibrationLogs();
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

  async function fetchVarianceReport() {
    setVarianceLoading(true);
    setVarianceError('');
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Authentication required');
      }
      const query = new URLSearchParams();
      if (varianceFilters.startDate) query.set('startDate', varianceFilters.startDate);
      if (varianceFilters.endDate) query.set('endDate', varianceFilters.endDate);
      if (varianceFilters.affiliateId) query.set('affiliateId', varianceFilters.affiliateId);
      const res = await fetch(`/api/admin/revenue/affiliate-cost-model-variance?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load cost model variance');
      }
      setVarianceReport(data);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to load cost model variance:', error);
      setVarianceError(error?.message || 'Failed to load cost model variance');
      setVarianceReport(null);
    } finally {
      setVarianceLoading(false);
    }
  }

  async function fetchPeriodDashboard() {
    setPeriodLoading(true);
    setPeriodError('');
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const query = new URLSearchParams();
      query.set('period', periodFilters.period);
      if (periodFilters.period === 'custom') {
        if (periodFilters.startDate) query.set('startDate', periodFilters.startDate);
        if (periodFilters.endDate) query.set('endDate', periodFilters.endDate);
      }
      const res = await fetch(`/api/admin/revenue/affiliate-period-dashboard?${query.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load period dashboard');
      }
      setPeriodDashboard(data);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to load period dashboard:', error);
      setPeriodError(error?.message || 'Failed to load period dashboard');
      setPeriodDashboard(null);
    } finally {
      setPeriodLoading(false);
    }
  }

  async function fetchCalibrationLogs() {
    setCalibrationLoading(true);
    setCalibrationError('');
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const res = await fetch('/api/admin/revenue/affiliate-cost-model/calibration-logs?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load calibration logs');
      }
      setCalibrationLogs(data.logs || []);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to load calibration logs:', error);
      setCalibrationError(error?.message || 'Failed to load calibration logs');
      setCalibrationLogs([]);
    } finally {
      setCalibrationLoading(false);
    }
  }

  async function saveCalibrationLog() {
    setCalibrationSaving(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const windowStart = new Date(calibrationForm.windowStart).getTime();
      const windowEnd = new Date(calibrationForm.windowEnd).getTime();
      const payload = {
        window_start: windowStart,
        window_end: windowEnd,
        proposed_cost_per_credit_usd: Number(calibrationForm.proposedCostPerCredit),
        adopted_cost_per_credit_usd: calibrationForm.adoptedCostPerCredit ? Number(calibrationForm.adoptedCostPerCredit) : undefined,
        status: calibrationForm.status,
        rationale: calibrationForm.rationale || undefined,
        notes: calibrationForm.notes || undefined,
      };
      const res = await fetch('/api/admin/revenue/affiliate-cost-model/calibration-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save calibration log');
      }
      await Promise.all([fetchCalibrationLogs(), fetchVarianceReport()]);
      setCalibrationForm((prev) => ({
        ...prev,
        rationale: '',
        notes: '',
      }));
    } catch (error) {
      console.error('[Admin Affiliates] Failed to save calibration log:', error);
      alert(error?.message || 'Failed to save calibration log');
    } finally {
      setCalibrationSaving(false);
    }
  }

  function getVarianceHealth(variancePercentVsEstimated) {
    const pct = Number(variancePercentVsEstimated);
    if (!Number.isFinite(pct)) {
      return {
        label: 'NO ACTUAL BASELINE',
        badgeClass: 'badge-ghost',
        hint: 'No provider-billed allocation for this window yet.',
      };
    }
    const absPct = Math.abs(pct);
    if (absPct <= 5) {
      return {
        label: 'GREEN',
        badgeClass: 'badge-success',
        hint: 'Variance within +/-5% of estimate.',
      };
    }
    if (absPct <= 15) {
      return {
        label: 'YELLOW',
        badgeClass: 'badge-warning',
        hint: 'Variance between +/-5% and +/-15%.',
      };
    }
    return {
      label: 'RED',
      badgeClass: 'badge-error',
      hint: 'Variance above +/-15%; recalibrate soon.',
    };
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

  const varianceHealth = getVarianceHealth(varianceReport?.totals?.variancePercentVsEstimated);

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

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="card-title">Global Period Economics</h2>
              <p className="text-sm text-base-content/60">
                One view for money in, provider cost, affiliate liabilities, and profit after affiliate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <label className="form-control">
                <span className="label-text text-xs">Period</span>
                <select
                  className="select select-bordered select-sm"
                  value={periodFilters.period}
                  onChange={(e) => setPeriodFilters((prev) => ({ ...prev, period: e.target.value }))}
                >
                  <option value="day">Day (today)</option>
                  <option value="week">Week (last 7 days)</option>
                  <option value="month">Month (last 30 days)</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              {periodFilters.period === 'custom' && (
                <>
                  <label className="form-control">
                    <span className="label-text text-xs">Start</span>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={periodFilters.startDate}
                      onChange={(e) => setPeriodFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text text-xs">End</span>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={periodFilters.endDate}
                      onChange={(e) => setPeriodFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </label>
                </>
              )}
              <button className="btn btn-primary btn-sm" onClick={fetchPeriodDashboard} disabled={periodLoading}>
                {periodLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {periodError && (
            <div className="alert alert-error mt-4">
              <span>{periodError}</span>
            </div>
          )}

          {!periodError && periodDashboard && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>Net collected: <b>${Number(periodDashboard.revenue?.netCollectedUsd || 0).toFixed(2)}</b></div>
                <div>Provider cost: <b>${Number(periodDashboard.providerCost?.usd || 0).toFixed(2)}</b></div>
                <div>Provider confidence: <b>{periodDashboard.providerCost?.confidence || 'unknown'}</b></div>
                <div>Gross profit: <b>${Number(periodDashboard.economics?.grossProfitUsd || 0).toFixed(2)}</b></div>
                <div>Gross margin: <b>{Number(periodDashboard.economics?.grossMarginPercent || 0).toFixed(2)}%</b></div>
                <div>Profit after affiliate: <b className={Number(periodDashboard.economics?.profitAfterAffiliateUsd || 0) < 0 ? 'text-error' : 'text-success'}>${Number(periodDashboard.economics?.profitAfterAffiliateUsd || 0).toFixed(2)}</b></div>
                <div>Affiliate paid: <b>${Number(periodDashboard.affiliateCommissions?.paidUsd || 0).toFixed(2)}</b></div>
                <div>Affiliate approved: <b>${Number(periodDashboard.affiliateCommissions?.approvedUsd || 0).toFixed(2)}</b></div>
                <div>Affiliate held: <b>${Number(periodDashboard.affiliateCommissions?.heldUsd || 0).toFixed(2)}</b></div>
              </div>
              <div className="text-xs text-base-content/70">
                Retained margin after affiliate: <b>{Number(periodDashboard.economics?.retainedMarginPercentAfterAffiliate || 0).toFixed(2)}%</b>
              </div>
              {(periodDashboard.dataQuality?.notes || []).length > 0 && (
                <div className="text-xs text-base-content/70">
                  {(periodDashboard.dataQuality.notes || []).map((note, idx) => (
                    <div key={`${note}-${idx}`}>- {note}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="card-title">Affiliate Cost Model Calibration</h2>
                <span className={`badge badge-sm ${varianceHealth.badgeClass}`} title={varianceHealth.hint}>
                  {varianceHealth.label}
                </span>
              </div>
              <p className="text-sm text-base-content/60">
                Compare estimated affiliate AI cost vs allocated provider-billed actual by plan and usage band.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <label className="form-control">
                <span className="label-text text-xs">Start</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={varianceFilters.startDate}
                  onChange={(e) => setVarianceFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs">End</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={varianceFilters.endDate}
                  onChange={(e) => setVarianceFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs">Affiliate</span>
                <select
                  className="select select-bordered select-sm"
                  value={varianceFilters.affiliateId}
                  onChange={(e) => setVarianceFilters((prev) => ({ ...prev, affiliateId: e.target.value }))}
                >
                  <option value="">All affiliates</option>
                  {affiliates.map((affiliate) => (
                    <option key={affiliate.affiliate_id} value={affiliate.affiliate_id}>
                      {affiliate.email || affiliate.referral_code || affiliate.affiliate_id}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-primary btn-sm" onClick={fetchVarianceReport} disabled={varianceLoading}>
                {varianceLoading ? 'Loading...' : 'Run Calibration'}
              </button>
            </div>
          </div>

          {varianceError && (
            <div className="alert alert-error mt-4">
              <span>{varianceError}</span>
            </div>
          )}

          {!varianceError && varianceReport && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>Cost model version: <b>{varianceReport.costModelVersion || 'unknown'}</b></div>
                <div>Estimated $/credit: <b>${Number(varianceReport.estimatedCostPerCreditUsd || 0).toFixed(6)}</b></div>
                <div>Provider billed total: <b>${Number(varianceReport.providerBilledTotalCostUsd || 0).toFixed(2)}</b></div>
                <div>Commissions: <b>{Number(varianceReport.totals?.commissions || 0)}</b></div>
                <div>Referred users: <b>{Number(varianceReport.totals?.uniqueUsers || 0)}</b></div>
                <div>Estimated credits: <b>{Number(varianceReport.totals?.estimatedCredits || 0).toFixed(2)}</b></div>
                <div>Estimated cost: <b>${Number(varianceReport.totals?.estimatedCostUsd || 0).toFixed(2)}</b></div>
                <div>Allocated actual: <b>{varianceReport.totals?.actualAllocatedCostUsd == null ? '-' : `$${Number(varianceReport.totals.actualAllocatedCostUsd).toFixed(2)}`}</b></div>
                <div>
                  Variance: <b className={Number(varianceReport.totals?.varianceUsd || 0) >= 0 ? 'text-success' : 'text-error'}>
                    {varianceReport.totals?.varianceUsd == null ? '-' : `$${Number(varianceReport.totals.varianceUsd).toFixed(2)} (${Number(varianceReport.totals?.variancePercentVsEstimated || 0).toFixed(2)}%)`}
                  </b>
                </div>
              </div>
              <div className="text-xs text-base-content/70">
                Thresholds: <b>GREEN</b> {'<='} +/-5%, <b>YELLOW</b> {'<='} +/-15%, <b>RED</b> {'>'} +/-15%.
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Usage Band</th>
                      <th>Commissions</th>
                      <th>Users</th>
                      <th>Est. Credits</th>
                      <th>Est. Cost</th>
                      <th>Allocated Actual</th>
                      <th>Variance</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(varianceReport.rows || []).map((row) => (
                      <tr key={`${row.plan}-${row.usageBand}`}>
                        <td>{row.plan}</td>
                        <td>{row.usageBand}</td>
                        <td>{Number(row.commissions || 0)}</td>
                        <td>{Number(row.uniqueUsers || 0)}</td>
                        <td>{Number(row.estimatedCredits || 0).toFixed(2)}</td>
                        <td>${Number(row.estimatedCostUsd || 0).toFixed(2)}</td>
                        <td>{row.actualAllocatedCostUsd == null ? '-' : `$${Number(row.actualAllocatedCostUsd).toFixed(2)}`}</td>
                        <td className={Number(row.varianceUsd || 0) >= 0 ? 'text-success' : 'text-error'}>
                          {row.varianceUsd == null ? '-' : `$${Number(row.varianceUsd).toFixed(2)} (${Number(row.variancePercentVsEstimated || 0).toFixed(2)}%)`}
                        </td>
                        <td>{row.confidence || 'unknown'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(varianceReport.dataQuality?.notes || []).length > 0 && (
                <div className="text-xs text-base-content/70">
                  {(varianceReport.dataQuality.notes || []).map((note, idx) => (
                    <div key={`${note}-${idx}`}>- {note}</div>
                  ))}
                </div>
              )}

              <div className="divider my-2">Calibration Runbook Log</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <label className="form-control">
                  <span className="label-text text-xs">Window Start</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={calibrationForm.windowStart}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, windowStart: e.target.value }))}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs">Window End</span>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={calibrationForm.windowEnd}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, windowEnd: e.target.value }))}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs">Status</span>
                  <select
                    className="select select-bordered select-sm"
                    value={calibrationForm.status}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="proposed">Proposed</option>
                    <option value="adopted">Adopted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text text-xs">Proposed $/credit</span>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    className="input input-bordered input-sm"
                    value={calibrationForm.proposedCostPerCredit}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, proposedCostPerCredit: e.target.value }))}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs">Adopted $/credit (optional)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    className="input input-bordered input-sm"
                    value={calibrationForm.adoptedCostPerCredit}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, adoptedCostPerCredit: e.target.value }))}
                  />
                </label>
                <label className="form-control md:col-span-3">
                  <span className="label-text text-xs">Rationale</span>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={calibrationForm.rationale}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, rationale: e.target.value }))}
                    placeholder="Why this calibration is proposed/adopted."
                  />
                </label>
                <label className="form-control md:col-span-3">
                  <span className="label-text text-xs">Notes</span>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={calibrationForm.notes}
                    onChange={(e) => setCalibrationForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional runbook notes."
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-primary" onClick={saveCalibrationLog} disabled={calibrationSaving}>
                  {calibrationSaving ? 'Saving...' : 'Save Calibration Log'}
                </button>
                <button className="btn btn-sm btn-outline" onClick={fetchCalibrationLogs} disabled={calibrationLoading}>
                  {calibrationLoading ? 'Loading...' : 'Refresh Logs'}
                </button>
              </div>
              {calibrationError && (
                <div className="alert alert-error">
                  <span>{calibrationError}</span>
                </div>
              )}
              <div className="overflow-x-auto max-h-56">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Window</th>
                      <th>Prev</th>
                      <th>Proposed</th>
                      <th>Adopted</th>
                      <th>Variance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(calibrationLogs || []).map((log) => (
                      <tr key={log.calibration_id}>
                        <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                        <td>{log.status || 'unknown'}</td>
                        <td>{log.window_start ? new Date(log.window_start).toLocaleDateString() : '-'} - {log.window_end ? new Date(log.window_end).toLocaleDateString() : '-'}</td>
                        <td>{Number(log.previous_cost_per_credit_usd || 0).toFixed(6)}</td>
                        <td>{Number(log.proposed_cost_per_credit_usd || 0).toFixed(6)}</td>
                        <td>{log.adopted_cost_per_credit_usd == null ? '-' : Number(log.adopted_cost_per_credit_usd).toFixed(6)}</td>
                        <td>{log.variance_percent_vs_estimated == null ? '-' : `${Number(log.variance_percent_vs_estimated).toFixed(2)}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

                <div className="card bg-base-300">
                  <div className="card-body p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Unit Economics (Affiliate-Referred Users)</div>
                      <div className="text-xs opacity-70">
                        Confidence: <b>{attributionSummary.unit_economics?.summary?.confidence || 'unknown'}</b>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>Net revenue: <b>${Number(attributionSummary.unit_economics?.summary?.net_revenue_usd || 0).toFixed(2)}</b></div>
                      <div>AI cost: <b>${Number(attributionSummary.unit_economics?.summary?.provider_cost_usd || 0).toFixed(2)}</b></div>
                      <div>Margin base: <b>${Number(attributionSummary.unit_economics?.summary?.margin_base_usd || 0).toFixed(2)}</b></div>
                      <div>Affiliate payout: <b>${Number(attributionSummary.unit_economics?.summary?.affiliate_payout_usd || 0).toFixed(2)}</b></div>
                      <div>Profit after affiliate: <b>${Number(attributionSummary.unit_economics?.summary?.profit_after_affiliate_usd || 0).toFixed(2)}</b></div>
                      <div>Retained margin %: <b>{Number(attributionSummary.unit_economics?.summary?.retained_margin_percent_after_affiliate || 0).toFixed(2)}%</b></div>
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      AI cost basis reflects current affiliate margin settlement inputs (estimated per-credit when marked as estimated).
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

                <div>
                  <div className="text-sm font-semibold mb-2">Per-User Profitability (Referred)</div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="table table-zebra table-sm">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Net Revenue</th>
                          <th>AI Cost</th>
                          <th>Margin Base</th>
                          <th>Affiliate Payout</th>
                          <th>Profit After Affiliate</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(attributionSummary.unit_economics?.rows || []).map((row) => (
                          <tr key={`${row.referred_user_id}-${row.referral_id}`}>
                            <td><code>{row.referred_user_id}</code></td>
                            <td>${Number(row.net_revenue_usd || 0).toFixed(2)}</td>
                            <td>${Number(row.provider_cost_usd || 0).toFixed(2)}</td>
                            <td>${Number(row.margin_base_usd || 0).toFixed(2)}</td>
                            <td>${Number(row.affiliate_payout_usd || 0).toFixed(2)}</td>
                            <td className={Number(row.profit_after_affiliate_usd || 0) < 0 ? 'text-error' : 'text-success'}>
                              ${Number(row.profit_after_affiliate_usd || 0).toFixed(2)}
                            </td>
                            <td>{row.confidence || 'unknown'}</td>
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

