'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, Download, Trash2, Filter, Calendar, User, AlertTriangle, CheckCircle, Info, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Admin Voice Consent Dashboard
 * 
 * Full-featured admin panel for managing voice cloning consents.
 * Features:
 * - View all consent records
 * - Search and filter
 * - Bulk actions
 * - Audit log viewing
 * - Export functionality
 * 
 * Add to your admin dashboard page.
 */
export default function AdminVoiceConsentDashboard() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, revoked, expired
  const [sortBy, setSortBy] = useState('agreedAt'); // agreedAt, expiresAt, userName
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConsents, setSelectedConsents] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConsentId, setDeletingConsentId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revoked: 0,
    expired: 0,
    expiringSoon: 0,
  });

  // Load consents on mount and when filters change
  useEffect(() => {
    loadConsents();
  }, [page, statusFilter, sortBy, sortOrder, searchQuery]);

  const loadConsents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        sortBy,
        sortOrder,
        search: searchQuery,
      });

      const response = await fetch(`/api/admin/voice-consents?${params}`);
      const data = await response.json();

      if (response.ok) {
        setConsents(data.consents || []);
        setTotalPages(data.totalPages || 1);
        setStats(data.stats || stats);
      } else {
        throw new Error(data.error || 'Failed to load consents');
      }
    } catch (error) {
      console.error('Error loading consents:', error);
      toast.error('Failed to load consent records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (consentId) => {
    try {
      const response = await fetch(`/api/admin/voice-consents/${consentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete consent');
      }

      toast.success('Consent record deleted successfully');
      loadConsents();
      setShowDeleteConfirm(false);
      setDeletingConsentId(null);
    } catch (error) {
      console.error('Error deleting consent:', error);
      toast.error(error.message || 'Failed to delete consent');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedConsents.size === 0) {
      toast.error('No consents selected');
      return;
    }

    if (!confirm(`Delete ${selectedConsents.size} consent record(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const promises = Array.from(selectedConsents).map(id =>
        fetch(`/api/admin/voice-consents/${id}`, { method: 'DELETE' })
      );

      await Promise.all(promises);
      toast.success(`Deleted ${selectedConsents.size} consent record(s)`);
      setSelectedConsents(new Set());
      loadConsents();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Failed to delete some consent records');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        format,
      });

      const response = await fetch(`/api/admin/voice-consents/export?${params}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-consents-${Date.now()}.${format}`;
      a.click();

      toast.success('Export downloaded successfully');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export consent records');
    }
  };

  const toggleSelectAll = () => {
    if (selectedConsents.size === consents.length) {
      setSelectedConsents(new Set());
    } else {
      setSelectedConsents(new Set(consents.map(c => c._id)));
    }
  };

  const toggleSelect = (consentId) => {
    const newSelected = new Set(selectedConsents);
    if (newSelected.has(consentId)) {
      newSelected.delete(consentId);
    } else {
      newSelected.add(consentId);
    }
    setSelectedConsents(newSelected);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (consent) => {
    if (consent.isRevoked) {
      return <span className="badge badge-error gap-1"><XCircle className="w-3 h-3" />Revoked</span>;
    }
    if (new Date(consent.expiresAt) < new Date()) {
      return <span className="badge badge-warning gap-1"><Clock className="w-3 h-3" />Expired</span>;
    }
    if (consent.daysUntilExpiration && consent.daysUntilExpiration <= 30) {
      return <span className="badge badge-warning gap-1"><AlertTriangle className="w-3 h-3" />Expiring Soon</span>;
    }
    return <span className="badge badge-success gap-1"><CheckCircle className="w-3 h-3" />Active</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Voice Consent Management
          </h1>
          <p className="text-sm opacity-70 mt-1">BIPA-compliant voice cloning consent tracking</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="btn btn-outline btn-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn btn-outline btn-sm">
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Total Consents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Info className="w-8 h-8 opacity-30" />
            </div>
          </div>
        </div>

        <div className="card bg-success/10 border border-success shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Active</p>
                <p className="text-2xl font-bold text-success">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-error/10 border border-error shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Revoked</p>
                <p className="text-2xl font-bold text-error">{stats.revoked}</p>
              </div>
              <XCircle className="w-8 h-8 text-error opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-warning/10 border border-warning shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Expired</p>
                <p className="text-2xl font-bold text-warning">{stats.expired}</p>
              </div>
              <Clock className="w-8 h-8 text-warning opacity-50" />
            </div>
          </div>
        </div>

        <div className="card bg-warning/10 border border-warning shadow-lg">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Expiring Soon</p>
                <p className="text-2xl font-bold text-warning">{stats.expiringSoon}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="form-control md:col-span-2">
              <div className="input-group">
                <span className="bg-base-300">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search by user name, email, or ID..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // Reset to first page
                  }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring Soon (30 days)</option>
              </select>
            </div>

            {/* Sort */}
            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="agreedAt-desc">Newest First</option>
                <option value="agreedAt-asc">Oldest First</option>
                <option value="expiresAt-asc">Expiring Soonest</option>
                <option value="expiresAt-desc">Expiring Latest</option>
                <option value="userName-asc">Name A-Z</option>
                <option value="userName-desc">Name Z-A</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedConsents.size > 0 && (
            <div className="alert alert-info mt-4">
              <Info className="w-5 h-5" />
              <span className="flex-1">{selectedConsents.size} consent(s) selected</span>
              <button onClick={handleBulkDelete} className="btn btn-error btn-sm">
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Consent Table */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : consents.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto opacity-30 mb-4" />
                <p className="text-lg font-semibold">No consent records found</p>
                <p className="text-sm opacity-70">Try adjusting your filters</p>
              </div>
            ) : (
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedConsents.size === consents.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Agreed Date</th>
                    <th>Expires Date</th>
                    <th>Days Remaining</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map((consent) => (
                    <tr key={consent._id} className={selectedConsents.has(consent._id) ? 'active' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedConsents.has(consent._id)}
                          onChange={() => toggleSelect(consent._id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                              <span className="text-xs">{consent.user?.name?.[0] || 'U'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-sm">{consent.user?.name || 'Unknown'}</div>
                            <div className="text-xs opacity-50">{consent.user?.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(consent)}</td>
                      <td className="text-sm">{formatDate(consent.agreedAt)}</td>
                      <td className="text-sm">{formatDate(consent.expiresAt)}</td>
                      <td>
                        {consent.daysUntilExpiration !== undefined ? (
                          <span className={consent.daysUntilExpiration <= 30 ? 'text-warning font-semibold' : ''}>
                            {consent.daysUntilExpiration} days
                          </span>
                        ) : (
                          <span className="opacity-50">—</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-ghost badge-sm font-mono">
                          {consent.consentTextVersion}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/api/voice-cloning/consent/download?userId=${consent.userId}`, '_blank')}
                            className="btn btn-ghost btn-xs"
                            title="Download Consent"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingConsentId(consent._id);
                              setShowDeleteConfirm(true);
                            }}
                            className="btn btn-ghost btn-xs text-error"
                            title="Delete Consent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-base-300">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-sm"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-error/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-xl font-bold">Delete Consent Record?</h3>
              </div>

              <p className="text-sm opacity-70 mb-6">
                This will permanently delete the consent record. This action cannot be undone.
                User voice data deletion should be handled separately per BIPA requirements.
              </p>

              <div className="alert alert-warning mb-4">
                <Info className="w-5 h-5" />
                <span className="text-sm">
                  Ensure user voice data has been deleted from third-party services (ElevenLabs) before removing the consent record.
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingConsentId(null);
                  }}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingConsentId)}
                  className="btn btn-error flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

