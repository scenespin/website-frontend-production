/**
 * AddCollaboratorModal Component
 * 
 * Modal for inviting new collaborators to a project with role selection
 * Migrated from old template with new styling
 */

'use client';

import { useState } from 'react';
import { X, UserPlus, Info, Shield, Eye, Pencil, CheckCircle } from 'lucide-react';

export function AddCollaboratorModal({ isOpen, onClose, onAdd, roles }) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('director');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const success = await onAdd(email, selectedRole);

      if (success) {
        // Reset form and close
        setEmail('');
        setSelectedRole('director');
        onClose();
      } else {
        setError('Failed to add collaborator. They may not have a GitHub account or the email might be incorrect.');
      }
    } catch (err) {
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setSelectedRole('director');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedRoleInfo = roles.find((r) => r.id === selectedRole);

  const getRoleIcon = (roleId) => {
    if (roleId.includes('director')) return <Shield className="w-5 h-5" />;
    if (roleId.includes('viewer')) return <Eye className="w-5 h-5" />;
    return <Pencil className="w-5 h-5" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="bg-[#1a1625] border border-purple-500/20 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <UserPlus className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Add Collaborator</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborator@example.com"
                disabled={loading}
                required
                className="w-full px-4 py-3 bg-[#0d0b14] border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-400">
                They'll need a GitHub account to collaborate on the script
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Role</label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => !loading && setSelectedRole(role.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedRole === role.id
                        ? 'bg-purple-500/10 border-purple-500/50 ring-2 ring-purple-500/30'
                        : 'bg-[#0d0b14] border-purple-500/20 hover:border-purple-500/30 hover:bg-purple-500/5'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="role"
                        value={role.id}
                        checked={selectedRole === role.id}
                        onChange={() => setSelectedRole(role.id)}
                        disabled={loading}
                        className="mt-1 accent-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-purple-400">{getRoleIcon(role.id)}</div>
                          <div className="font-medium text-white">{role.name}</div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">{role.description}</div>
                        <div className="flex flex-wrap gap-2">
                          {role.capabilities.canEditScript && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                              <CheckCircle className="w-3 h-3" />
                              Edit Script
                            </span>
                          )}
                          {role.capabilities.canViewScript && !role.capabilities.canEditScript && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                              <Eye className="w-3 h-3" />
                              View Script
                            </span>
                          )}
                          {role.capabilities.canManageAssets && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded">
                              <CheckCircle className="w-3 h-3" />
                              Manage Assets
                            </span>
                          )}
                          {role.capabilities.canViewAssets && !role.capabilities.canManageAssets && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">
                              <Eye className="w-3 h-3" />
                              View Assets
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            {selectedRoleInfo && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <strong className="text-blue-400">How it works:</strong> When you add this
                    collaborator, they'll be invited to the GitHub repository
                    {selectedRoleInfo.capabilities.canManageAssets &&
                      " and given access to the project's cloud storage folder"}
                    . They can manage permissions through those platforms.
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[#0d0b14] border border-purple-500/20 text-gray-300 rounded-lg hover:bg-purple-500/10 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/20"
              >
                {loading ? 'Adding...' : 'Add Collaborator'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

