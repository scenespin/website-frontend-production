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
  CheckCircle,
  XCircle,
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
      const [overviewRes, affiliatesRes, topPerformersRes, pendingPayoutsRes] = await Promise.all([
        fetch('/api/admin/affiliates/overview', { headers }),
        fetch(`/api/admin/affiliates?status=${statusFilter === 'all' ? '' : statusFilter}`, { headers }),
        fetch('/api/admin/affiliates/top-performers?limit=10', { headers }),
        fetch('/api/admin/affiliates/payouts/pending', { headers }),
      ]);

      const overviewData = await overviewRes.json();
      const affiliatesData = await affiliatesRes.json();
      const topPerformersData = await topPerformersRes.json();
      const pendingPayoutsData = await pendingPayoutsRes.json();

      setOverview(overviewData);
      setAffiliates(affiliatesData.affiliates || []);
      setTopPerformers(topPerformersData.top_performers || []);
      setPendingPayouts(pendingPayoutsData.payouts || []);
    } catch (error) {
      console.error('[Admin Affiliates] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveAffiliate(affiliateId) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      await fetch(`/api/admin/affiliates/${affiliateId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to approve:', error);
    }
  }

  async function suspendAffiliate(affiliateId) {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      await fetch(`/api/admin/affiliates/${affiliateId}/suspend`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      fetchDashboardData();
    } catch (error) {
      console.error('[Admin Affiliates] Failed to suspend:', error);
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
                    <td>{affiliate.total_signups || 0}</td>
                    <td>${(affiliate.total_commissions_earned || 0).toFixed(2)}</td>
                    <td>
                      <div className="flex gap-1">
                        {affiliate.status === 'pending' && (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={() => approveAffiliate(affiliate.affiliate_id)}
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                        )}
                        {affiliate.status === 'active' && (
                          <button
                            className="btn btn-xs btn-warning"
                            onClick={() => suspendAffiliate(affiliate.affiliate_id)}
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        )}
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
    </div>
  );
}

