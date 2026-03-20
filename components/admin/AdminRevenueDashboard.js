'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Zap,
  Activity,
  Target
} from 'lucide-react';

/**
 * Admin Revenue Dashboard
 * 
 * Real-time revenue tracking and financial metrics
 * Displays: signups, revenue, costs, conversion rates, free tier burn
 */
export default function AdminRevenueDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [burnRate, setBurnRate] = useState(null);
  const [upgradeStats, setUpgradeStats] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [lastReconciliationRefreshAt, setLastReconciliationRefreshAt] = useState(null);
  const [ingestMessage, setIngestMessage] = useState('');
  const [ingestError, setIngestError] = useState('');
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        setError('Authentication required');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch all revenue data in parallel
      const [metricsRes, funnelRes, burnRateRes, upgradeStatsRes, reconciliationRes] = await Promise.all([
        fetch('/api/admin/revenue/metrics', { headers }),
        fetch('/api/admin/revenue/conversion-funnel', { headers }),
        fetch('/api/admin/revenue/free-tier-burn', { headers }),
        fetch('/api/admin/revenue/upgrade-stats', { headers }),
        fetch('/api/admin/revenue/reconciliation', { headers }),
      ]);

      if (!metricsRes.ok) throw new Error('Failed to fetch metrics');
      if (!funnelRes.ok) throw new Error('Failed to fetch funnel');
      if (!burnRateRes.ok) throw new Error('Failed to fetch burn rate');
      if (!upgradeStatsRes.ok) throw new Error('Failed to fetch upgrade stats');

      const metricsData = await metricsRes.json();
      const funnelData = await funnelRes.json();
      const burnRateData = await burnRateRes.json();
      const upgradeStatsData = await upgradeStatsRes.json();
      const reconciliationData = reconciliationRes.ok ? await reconciliationRes.json() : null;

      setMetrics(metricsData);
      setFunnel(funnelData);
      setBurnRate(burnRateData);
      setUpgradeStats(upgradeStatsData);
      setReconciliation(reconciliationData);
      setLastReconciliationRefreshAt(new Date());
    } catch (err) {
      console.error('[Admin Revenue] Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  async function runLiveProviderIngest() {
    setIngesting(true);
    setIngestError('');
    setIngestMessage('');
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const now = new Date();
      const start = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const res = await fetch('/api/admin/revenue/provider-costs/ingest/live', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: now.toISOString(),
          providers: ['openai', 'elevenlabs'],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Live ingest failed');
      setIngestMessage(`Ingest completed. Events: ${data.ingested || 0}`);
      await fetchDashboardData();
    } catch (e) {
      setIngestError(e.message || 'Ingest failed');
    } finally {
      setIngesting(false);
    }
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  function formatPercent(value) {
    return `${(value || 0).toFixed(2)}%`;
  }

  function formatTimestamp(dateValue) {
    if (!dateValue) return 'Never';
    return dateValue.toLocaleString();
  }

  function getReconciliationBadgeState() {
    if (!reconciliation) {
      return {
        label: 'Reconciliation unknown',
        className: 'badge badge-ghost',
      };
    }
    const needsAttention = Boolean(
      reconciliation.mismatches?.hasRevenueMismatch ||
      reconciliation.mismatches?.hasMissingInputs
    );
    if (needsAttention) {
      return {
        label: 'Reconciliation attention needed',
        className: 'badge badge-warning',
      };
    }
    return {
      label: 'Reconciliation healthy',
      className: 'badge badge-success',
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertTriangle className="w-5 h-5" />
        <span>Failed to load revenue data: {error}</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="alert alert-warning">
        <AlertTriangle className="w-5 h-5" />
        <span>No revenue data available</span>
      </div>
    );
  }

  const reconciliationBadge = getReconciliationBadgeState();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Revenue Tracking</h1>
          <p className="text-base-content/40 mt-1">Real-time financial metrics and conversion tracking</p>
          <div className="mt-2">
            <span className={reconciliationBadge.className}>{reconciliationBadge.label}</span>
          </div>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-outline btn-sm gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Today's Performance */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Today&apos;s Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Signups Today */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Signups Today</p>
                  <p className="text-3xl font-bold mt-1">{metrics.today.signups}</p>
                  <p className="text-sm text-base-content/50 mt-1">
                    Yesterday: {metrics.yesterday.signups}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Revenue Today */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Revenue Today</p>
                  <p className="text-3xl font-bold mt-1 text-success">
                    {formatCurrency(metrics.today.revenue)}
                  </p>
                  <p className="text-sm text-base-content/50 mt-1">
                    Yesterday: {formatCurrency(metrics.yesterday.revenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Costs Today */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Costs Today</p>
                  <p className="text-3xl font-bold mt-1 text-warning">
                    {formatCurrency(metrics.today.totalCost)}
                  </p>
                  <p className="text-sm text-base-content/50 mt-1">
                    Free tier: {formatCurrency(metrics.today.freeTierCost)}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Net Today */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Net Today</p>
                  <p className={`text-3xl font-bold mt-1 ${metrics.today.net >= 0 ? 'text-success' : 'text-error'}`}>
                    {formatCurrency(metrics.today.net)}
                  </p>
                  <p className="text-sm text-base-content/50 mt-1">
                    Yesterday: {formatCurrency(metrics.yesterday.net)}
                  </p>
                </div>
                {metrics.today.net >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Conversion Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Conversion Rate */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Conversion Rate</p>
                  <p className="text-3xl font-bold mt-1">{formatPercent(funnel.conversionRate)}</p>
                  <p className="text-sm text-base-content/50 mt-1">
                    {funnel.usersWhoPurchased} / {funnel.totalSignups} users
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
              <div className={`mt-2 text-sm ${funnel.conversionRate >= 5 ? 'text-success' : 'text-warning'}`}>
                {funnel.conversionRate >= 5 ? '✅ Above target (5%)' : '⚠️ Below target (5%)'}
              </div>
            </div>
          </div>

          {/* 40+ Credits to Paying */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">40+ Credits → Paying</p>
                  <p className="text-3xl font-bold mt-1">{formatPercent(funnel.creditsToPayingRate)}</p>
                  <p className="text-sm text-base-content/50 mt-1">
                    {funnel.usersWhoHit40Credits} users hit 40 credits
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Upgrades Today */}
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-base-content/40">Upgrades Today</p>
                  <p className="text-3xl font-bold mt-1">{upgradeStats.todayUpgrades}</p>
                  <p className="text-sm text-base-content/50 mt-1">
                    Last 7 days: {upgradeStats.last7DaysUpgrades}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-pink-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Summaries */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Period Summaries</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Period</th>
                <th>Signups</th>
                <th>Revenue</th>
                <th>Costs</th>
                <th>Net</th>
                <th>Conv. Rate</th>
                <th>ARPU</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold">Last 7 Days</td>
                <td>{metrics.last7Days.signups}</td>
                <td className="text-success">{formatCurrency(metrics.last7Days.revenue)}</td>
                <td className="text-warning">{formatCurrency(metrics.last7Days.totalCost)}</td>
                <td className={metrics.last7Days.net >= 0 ? 'text-success' : 'text-error'}>
                  {formatCurrency(metrics.last7Days.net)}
                </td>
                <td>{formatPercent(metrics.last7Days.conversionRate)}</td>
                <td>{formatCurrency(metrics.last7Days.averageRevenuePerUser)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Last 30 Days</td>
                <td>{metrics.last30Days.signups}</td>
                <td className="text-success">{formatCurrency(metrics.last30Days.revenue)}</td>
                <td className="text-warning">{formatCurrency(metrics.last30Days.totalCost)}</td>
                <td className={metrics.last30Days.net >= 0 ? 'text-success' : 'text-error'}>
                  {formatCurrency(metrics.last30Days.net)}
                </td>
                <td>{formatPercent(metrics.last30Days.conversionRate)}</td>
                <td>{formatCurrency(metrics.last30Days.averageRevenuePerUser)}</td>
              </tr>
              <tr className="bg-base-300">
                <td className="font-bold">All Time</td>
                <td className="font-bold">{metrics.allTime.signups}</td>
                <td className="text-success font-bold">{formatCurrency(metrics.allTime.revenue)}</td>
                <td className="text-warning font-bold">{formatCurrency(metrics.allTime.totalCost)}</td>
                <td className={`font-bold ${metrics.allTime.net >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(metrics.allTime.net)}
                </td>
                <td className="font-bold">{formatPercent(metrics.allTime.conversionRate)}</td>
                <td className="font-bold">{formatCurrency(metrics.allTime.averageRevenuePerUser)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Free Tier Burn Rate */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Free Tier Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <p className="text-sm text-base-content/40">Free Users</p>
              <p className="text-2xl font-bold">{burnRate.totalFreeUsers}</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <p className="text-sm text-base-content/40">Credits Used</p>
              <p className="text-2xl font-bold">{burnRate.creditsUsed.toLocaleString()}</p>
              <p className="text-xs text-base-content/50">of {burnRate.creditsGranted.toLocaleString()} granted</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <p className="text-sm text-base-content/40">Burn Rate</p>
              <p className="text-2xl font-bold">{formatPercent(burnRate.burnRate)}</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <p className="text-sm text-base-content/40">Est. Monthly Cost</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(burnRate.projectedMonthlyCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Billing Ops */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Provider Billing Ops</h2>
              <p className="text-sm text-base-content/50">Run live provider billing ingestion and verify reconciliation flags.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/revenue/reconciliation" className="btn btn-ghost btn-sm">
                View Reconciliation Details
              </Link>
              <button
                className="btn btn-outline btn-sm gap-2"
                onClick={fetchDashboardData}
                disabled={loading || ingesting}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Flags
              </button>
              <button
                className="btn btn-primary btn-sm gap-2"
                onClick={runLiveProviderIngest}
                disabled={loading || ingesting}
              >
                <RefreshCw className={`w-4 h-4 ${ingesting ? 'animate-spin' : ''}`} />
                Run Live Ingest
              </button>
            </div>
          </div>

          {ingestMessage ? (
            <div className="alert alert-success mt-3">
              <span>{ingestMessage}</span>
            </div>
          ) : null}
          {ingestError ? (
            <div className="alert alert-error mt-3">
              <span>{ingestError}</span>
            </div>
          ) : null}

          {reconciliation ? (
            <div className="mt-4">
              <div className="text-xs text-base-content/60 mb-3">
                Last reconciliation refresh: {formatTimestamp(lastReconciliationRefreshAt)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-base-300 p-3">
                <p className="text-xs text-base-content/50">Provider Cost Source</p>
                <p className="text-sm font-semibold mt-1">{reconciliation.providerCosts?.source || 'unknown'}</p>
              </div>
              <div className="rounded-lg border border-base-300 p-3">
                <p className="text-xs text-base-content/50">Provider Cost (Window)</p>
                <p className="text-sm font-semibold mt-1">{formatCurrency(reconciliation.providerCosts?.totalCostUsd || 0)}</p>
              </div>
              <div className="rounded-lg border border-base-300 p-3">
                <p className="text-xs text-base-content/50">Revenue Mismatch</p>
                <p className={`text-sm font-semibold mt-1 ${reconciliation.mismatches?.hasRevenueMismatch ? 'text-warning' : 'text-success'}`}>
                  {reconciliation.mismatches?.hasRevenueMismatch ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="rounded-lg border border-base-300 p-3">
                <p className="text-xs text-base-content/50">Missing Inputs</p>
                <p className={`text-sm font-semibold mt-1 ${reconciliation.mismatches?.hasMissingInputs ? 'text-warning' : 'text-success'}`}>
                  {reconciliation.mismatches?.hasMissingInputs ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            </div>
          ) : (
            <div className="text-sm text-base-content/50 mt-4">
              Reconciliation data unavailable.
            </div>
          )}
        </div>
      </div>

      {/* Emergency Brakes */}
      <div className="alert alert-info">
        <AlertTriangle className="w-5 h-5" />
        <div>
          <p className="font-semibold">Emergency Brake Triggers:</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Cost &gt; $100/day for 3 days → Pause marketing</li>
            <li>• Conversion rate &lt; 3% after 500 signups → Adjust messaging</li>
            <li>• Signup spike &gt; 1,000/day → Verify abuse prevention</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

