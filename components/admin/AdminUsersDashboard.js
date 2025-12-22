'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { 
  Users, 
  Search, 
  Filter,
  Zap,
  CreditCard,
  Ban,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react';

/**
 * Admin Users Management Dashboard
 * 
 * Comprehensive user management: search, filter, credit adjustment, tier changes
 */
export default function AdminUsersDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tier: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, filters, pagination]);

  async function fetchUsers() {
    setLoading(true);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.error('[Admin Users] No auth token');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('[Admin Users] Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreditAdjustment(userId, adjustment) {
    const amount = prompt(`Enter credit adjustment amount (positive to add, negative to subtract):`);
    if (!amount) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ adjustment: parseInt(amount) }),
      });
      fetchUsers();
    } catch (error) {
      console.error('[Admin Users] Failed to adjust credits:', error);
      alert('Failed to adjust credits');
    }
  }

  async function handleTierChange(userId, newTier) {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      await fetch(`/api/admin/users/${userId}/tier`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: newTier }),
      });
      fetchUsers();
    } catch (error) {
      console.error('[Admin Users] Failed to change tier:', error);
      alert('Failed to change tier');
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required');
        return;
      }
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      fetchUsers();
    } catch (error) {
      console.error('[Admin Users] Failed to delete user:', error);
      alert('Failed to delete user');
    }
  }

  const filteredUsers = users.filter(u =>
    searchQuery ? 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    : true
  );

  const totalPages = Math.ceil(totalUsers / pagination.limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-base-content/40 mt-1">Manage users, credits, and account settings</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="btn btn-outline btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-base-content/40">Total Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="form-control">
              <div className="input-group">
                <span><Search className="w-4 h-4" /></span>
                <input
                  type="text"
                  placeholder="Search by email, ID, or name..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tier Filter */}
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={filters.tier}
                onChange={(e) => setFilters({...filters, tier: e.target.value})}
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="ultra">Ultra</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tier</th>
                  <th>Credits</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <div>
                        <div className="font-bold">{u.email || 'No email'}</div>
                        <div className="text-sm text-base-content/50">{u.user_id}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.tier === 'studio' ? 'badge-error' :
                        u.tier === 'ultra' ? 'badge-warning' :
                        u.tier === 'pro' ? 'badge-info' :
                        'badge-ghost'
                      }`}>
                        {u.tier || 'free'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-cinema-gold" />
                        <span className="font-bold">{u.credits_balance || 0}</span>
                      </div>
                    </td>
                    <td>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td>
                      <span className={`badge ${
                        u.status === 'active' ? 'badge-success' :
                        u.status === 'suspended' ? 'badge-error' :
                        'badge-ghost'
                      }`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreditAdjustment(u.user_id)}
                          className="btn btn-xs btn-primary"
                          title="Adjust Credits"
                        >
                          <CreditCard className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="btn btn-xs btn-info"
                          title="Edit User"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.user_id)}
                          className="btn btn-xs btn-error"
                          title="Delete User"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-base-content/40">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                disabled={pagination.page === 1}
                className="btn btn-sm btn-outline"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="btn btn-sm btn-ghost">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                disabled={pagination.page >= totalPages}
                className="btn btn-sm btn-outline"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit User: {selectedUser.email}</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tier</span>
                </label>
                <select
                  className="select select-bordered"
                  defaultValue={selectedUser.tier || 'free'}
                  onChange={(e) => handleTierChange(selectedUser.user_id, e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="ultra">Ultra</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div className="alert alert-info">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">
                  Current Credits: <strong>{selectedUser.credits_balance || 0}</strong>
                </span>
              </div>
            </div>

            <div className="modal-action">
              <button
                onClick={() => setSelectedUser(null)}
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

