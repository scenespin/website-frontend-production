'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

const DEFAULT_START_DATE = '2024-01-01';

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

function formatDateTime(value) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString();
}

export default function AdminRevenueReconciliationPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const queryString = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00.000Z`).toISOString();
    const end = new Date(`${endDate}T23:59:59.999Z`).toISOString();
    return `startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
  }, [startDate, endDate]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const res = await fetch(`/api/admin/revenue/reconciliation?${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to load reconciliation report');
      setReport(data);
      setLastRefreshAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load reconciliation report');
    } finally {
      setLoading(false);
    }
  }, [getToken, queryString]);

  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user, fetchReport]);

  return (
    <AdminShell>
      <AdminNav />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Revenue Reconciliation Details</h1>
            <p className="text-base-content/40 mt-1">
              Compare Stripe-native revenue and strict provider billing costs.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/revenue" className="btn btn-ghost btn-sm">
              Back to Revenue Dashboard
            </Link>
            <button className="btn btn-outline btn-sm gap-2" onClick={fetchReport} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="form-control">
                <span className="label-text text-xs text-base-content/60 mb-1">Start Date</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs text-base-content/60 mb-1">End Date</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <div className="text-xs text-base-content/60 mt-3">
              Last refresh: {lastRefreshAt ? lastRefreshAt.toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {error ? (
          <div className="alert alert-error">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : null}

        {!loading && report ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <p className="text-sm text-base-content/40">Revenue Delta</p>
                  <p className={`text-2xl font-bold mt-1 ${report.mismatches?.hasRevenueMismatch ? 'text-warning' : 'text-success'}`}>
                    {formatCurrency(report.mismatches?.revenueDeltaUsd || 0)}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {formatPercent(report.mismatches?.revenueDeltaPct || 0)}
                  </p>
                </div>
              </div>
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <p className="text-sm text-base-content/40">Revenue Mismatch</p>
                  <p className={`text-2xl font-bold mt-1 ${report.mismatches?.hasRevenueMismatch ? 'text-warning' : 'text-success'}`}>
                    {report.mismatches?.hasRevenueMismatch ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <p className="text-sm text-base-content/40">Missing Inputs</p>
                  <p className={`text-2xl font-bold mt-1 ${report.mismatches?.hasMissingInputs ? 'text-warning' : 'text-success'}`}>
                    {report.mismatches?.hasMissingInputs ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <p className="text-sm text-base-content/40">Provider Cost Source</p>
                  <p className="text-2xl font-bold mt-1">
                    {report.providerCosts?.source || 'unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="text-xl font-semibold">Report Window</h2>
                <p className="text-sm text-base-content/60 mt-2">Start: {formatDateTime(report.startDate)}</p>
                <p className="text-sm text-base-content/60">End: {formatDateTime(report.endDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h3 className="font-semibold">Stripe</h3>
                  <p className="text-sm mt-2">Source: <span className="font-semibold">{report.stripe?.source || 'unknown'}</span></p>
                  <p className="text-sm">Gross: <span className="font-semibold">{formatCurrency(report.stripe?.grossCollected || 0)}</span></p>
                  <p className="text-sm">Refunds: <span className="font-semibold">{formatCurrency(report.stripe?.refunds || 0)}</span></p>
                  <p className="text-sm">Fees: <span className="font-semibold">{formatCurrency(report.stripe?.fees || 0)}</span></p>
                  <p className="text-sm">Net: <span className="font-semibold">{formatCurrency(report.stripe?.netCollected || 0)}</span></p>
                  <p className="text-sm">Charges: <span className="font-semibold">{report.stripe?.chargeCount || 0}</span></p>
                  <p className="text-sm">Paying Users: <span className="font-semibold">{report.stripe?.uniquePayingUsers || 0}</span></p>
                </div>
              </div>

              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h3 className="font-semibold">Provider Costs</h3>
                  <p className="text-sm mt-2">Cost: <span className="font-semibold">{formatCurrency(report.providerCosts?.totalCostUsd || 0)}</span></p>
                  <p className="text-sm">Credits: <span className="font-semibold">{report.providerCosts?.totalCredits || 0}</span></p>
                  <p className="text-sm">Events: <span className="font-semibold">{report.providerCosts?.eventCount || 0}</span></p>
                  <p className="text-sm">
                    Missing Billing Table: <span className={`font-semibold ${report.providerCosts?.missingProviderBillingTable ? 'text-warning' : 'text-success'}`}>
                      {report.providerCosts?.missingProviderBillingTable ? 'Yes' : 'No'}
                    </span>
                  </p>
                  <p className="text-sm">
                    Missing Metering Table: <span className={`font-semibold ${report.providerCosts?.missingMeteringTable ? 'text-warning' : 'text-success'}`}>
                      {report.providerCosts?.missingMeteringTable ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
