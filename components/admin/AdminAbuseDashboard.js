'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { 
  AlertTriangle, 
  Search, 
  Ban,
  Shield,
  CreditCard,
  X,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2
} from 'lucide-react';

/**
 * Admin Abuse Management Dashboard
 * 
 * Monitor and manage abuse:
 * - View flagged users
 * - Review abuse scores
 * - Revoke credits
 * - Ban users
 */
export default function AdminAbuseDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFlaggedUsers();
    }
  }, [user]);

  async function fetchFlaggedUsers() {
    setLoading(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.error('[Admin Abuse] No auth token');
        return;
      }

      const response = await fetch('/api/admin/abuse/flagged', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setFlaggedUsers(data.users || []);
    } catch (error) {
      console.error('[Admin Abuse] Failed to fetch flagged users:', error);
      alert('Failed to load flagged users. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDetails(userId) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/abuse/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSelectedUser(data);
      setShowUserDetails(true);
    } catch (error) {
      console.error('[Admin Abuse] Failed to fetch user details:', error);
      alert('Failed to load user details');
    }
  }

  async function handleRevokeCredits(userId, revocationType, creditsToRevoke = null) {
    if (!confirm(`Are you sure you want to revoke ${revocationType === 'all_credits' ? 'all' : revocationType === 'signup_credits' ? 'signup' : creditsToRevoke} credits?`)) {
      return;
    }

    const reason = prompt('Enter reason for revocation:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const body = {
        userId,
        revocationType,
        reason,
        ...(revocationType === 'custom' && { creditsToRevoke }),
      };

      const response = await fetch('/api/admin/abuse/revoke-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke credits');
      }

      alert('Credits revoked successfully');
      fetchFlaggedUsers();
      if (selectedUser?.user_id === userId) {
        fetchUserDetails(userId);
      }
    } catch (error) {
      console.error('[Admin Abuse] Failed to revoke credits:', error);
      alert(`Failed to revoke credits: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBanUser(userId) {
    if (!confirm(`Are you sure you want to BAN this user? This will revoke all credits and prevent them from using the platform.`)) {
      return;
    }

    const reason = prompt('Enter reason for ban:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/abuse/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to ban user');
      }

      alert('User banned successfully');
      fetchFlaggedUsers();
      setShowUserDetails(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('[Admin Abuse] Failed to ban user:', error);
      alert(`Failed to ban user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  function getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      case 'low': return 'text-success';
      default: return 'text-base-content';
    }
  }

  function getRiskBadge(riskLevel) {
    switch (riskLevel) {
      case 'critical': return 'badge-error';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      case 'low': return 'badge-success';
      default: return 'badge-ghost';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-warning" />
            Abuse Management
          </h1>
          <p className="text-base-content/70 mt-2">
            Monitor and manage abuse patterns, revoke credits, and ban users
          </p>
        </div>
        <button
          onClick={fetchFlaggedUsers}
          className="btn btn-primary gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-title">Total Flagged</div>
          <div className="stat-value text-2xl">{flaggedUsers.length}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-title">Critical Risk</div>
          <div className="stat-value text-2xl text-error">
            {flaggedUsers.filter(u => u.risk_level === 'critical').length}
          </div>
        </div>
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-title">High Risk</div>
          <div className="stat-value text-2xl text-warning">
            {flaggedUsers.filter(u => u.risk_level === 'high').length}
          </div>
        </div>
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-title">Medium Risk</div>
          <div className="stat-value text-2xl text-info">
            {flaggedUsers.filter(u => u.risk_level === 'medium').length}
          </div>
        </div>
      </div>

      {/* Flagged Users Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Flagged Users</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : flaggedUsers.length === 0 ? (
            <div className="text-center py-8 text-base-content/70">
              No flagged users found. Great job! 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Abuse Score</th>
                    <th>Risk Level</th>
                    <th>Flags</th>
                    <th>Recommended Action</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedUsers.map((flagged) => (
                    <tr key={flagged.user_id}>
                      <td>
                        <code className="text-xs">{flagged.user_id.substring(0, 8)}...</code>
                      </td>
                      <td>
                        <span className="font-bold">{flagged.total_score}</span>
                        <span className="text-xs text-base-content/70">/100</span>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadge(flagged.risk_level)}`}>
                          {flagged.risk_level}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-ghost">
                          {flagged.flags?.length || 0} flags
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {flagged.recommended_action}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchUserDetails(flagged.user_id)}
                            className="btn btn-sm btn-ghost"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">User Abuse Details</h3>
            
            <div className="space-y-4">
              <div>
                <strong>User ID:</strong> <code className="text-xs">{selectedUser.user_id}</code>
              </div>
              
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Abuse Score</div>
                  <div className="stat-value">{selectedUser.abuse_score?.total_score || 0}</div>
                  <div className="stat-desc">/ 100</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Risk Level</div>
                  <div className={`stat-value ${getRiskColor(selectedUser.abuse_score?.risk_level)}`}>
                    {selectedUser.abuse_score?.risk_level || 'low'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Flags</div>
                  <div className="stat-value">{selectedUser.flags?.length || 0}</div>
                </div>
              </div>

              {selectedUser.flags && selectedUser.flags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Abuse Flags:</h4>
                  <div className="space-y-2">
                    {selectedUser.flags.map((flag, idx) => (
                      <div key={idx} className="alert alert-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                          <div className="font-semibold">{flag.flag_type}</div>
                          <div className="text-sm">{flag.description}</div>
                          <div className="text-xs opacity-70">
                            Severity: {flag.severity} | {new Date(flag.detected_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.revocation_history && selectedUser.revocation_history.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Revocation History:</h4>
                  <div className="space-y-2">
                    {selectedUser.revocation_history.map((revocation, idx) => (
                      <div key={idx} className="alert alert-error">
                        <Trash2 className="w-4 h-4" />
                        <div>
                          <div className="font-semibold">
                            {revocation.revocation_type} - {revocation.credits_revoked} credits
                          </div>
                          <div className="text-sm">{revocation.reason}</div>
                          <div className="text-xs opacity-70">
                            {new Date(revocation.revoked_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="divider">Actions</div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleRevokeCredits(selectedUser.user_id, 'signup_credits')}
                  className="btn btn-warning btn-sm"
                  disabled={actionLoading}
                >
                  <CreditCard className="w-4 h-4" />
                  Revoke Signup Credits (50)
                </button>
                <button
                  onClick={() => handleRevokeCredits(selectedUser.user_id, 'all_credits')}
                  className="btn btn-error btn-sm"
                  disabled={actionLoading}
                >
                  <CreditCard className="w-4 h-4" />
                  Revoke All Credits
                </button>
                <button
                  onClick={() => {
                    const amount = prompt('Enter number of credits to revoke:');
                    if (amount) {
                      handleRevokeCredits(selectedUser.user_id, 'custom', parseInt(amount));
                    }
                  }}
                  className="btn btn-warning btn-sm"
                  disabled={actionLoading}
                >
                  <CreditCard className="w-4 h-4" />
                  Revoke Custom Amount
                </button>
                <button
                  onClick={() => handleBanUser(selectedUser.user_id)}
                  className="btn btn-error btn-sm"
                  disabled={actionLoading}
                >
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
                className="btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

