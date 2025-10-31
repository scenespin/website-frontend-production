/**
 * CollaborationPanel Component
 * 
 * Displays and manages project collaborators
 * Migrated from old template with new styling
 */

'use client';

import { useState } from 'react';
import { Users, UserPlus, Trash2, Edit3, AlertCircle, Loader2, Shield, Eye, Pencil } from 'lucide-react';
import { useProjectCollaborators } from '@/hooks/useProjectCollaborators';
import { AddCollaboratorModal } from './AddCollaboratorModal';

export function CollaborationPanel({ projectId, isOwner = true }) {
  const { collaborators, roles, loading, error, addCollaborator, removeCollaborator, updateRole } =
    useProjectCollaborators(projectId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleRemove = async (identifier) => {
    const success = await removeCollaborator(identifier);
    if (success) {
      setConfirmDelete(null);
    }
  };

  const handleUpdateRole = async (identifier, newRole) => {
    const success = await updateRole(identifier, newRole);
    if (success) {
      setEditingRole(null);
    }
  };

  const getRoleIcon = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('director') || roleLower.includes('owner')) {
      return <Shield className="w-4 h-4 text-purple-400" />;
    } else if (roleLower.includes('viewer')) {
      return <Eye className="w-4 h-4 text-blue-400" />;
    } else if (roleLower.includes('editor') || roleLower.includes('writer')) {
      return <Pencil className="w-4 h-4 text-green-400" />;
    }
    return <Users className="w-4 h-4 text-gray-400" />;
  };

  const getRoleBadgeColor = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('director') || roleLower.includes('owner')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    } else if (roleLower.includes('viewer')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    } else if (roleLower.includes('writer')) {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    } else if (roleLower.includes('contributor')) {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  if (!isOwner) {
    return (
      <div className="p-6 bg-[#0d0b14] border border-purple-500/20 rounded-lg">
        <div className="flex items-center gap-3 text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <p>Only the project owner can manage collaborators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Project Collaborators</h3>
            <p className="text-sm text-gray-400">Manage who has access to this project</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Collaborator</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Collaborators List */}
      {!loading && (
        <div className="space-y-3">
          {collaborators.length === 0 ? (
            <div className="p-8 bg-[#0d0b14] border border-purple-500/20 rounded-lg text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-gray-400 mb-2">No collaborators yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Add collaborators to work together on this project
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
              >
                Add Your First Collaborator
              </button>
            </div>
          ) : (
            collaborators.map((collab) => (
              <div
                key={collab.user_identifier}
                className="p-4 bg-[#0d0b14] border border-purple-500/20 rounded-lg hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    {collab.avatar_url ? (
                      <img
                        src={collab.avatar_url}
                        alt={collab.user_identifier}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white truncate">
                          {collab.github_username || collab.email || collab.user_identifier}
                        </span>
                        {collab.github_username && collab.email && (
                          <span className="text-sm text-gray-500 truncate">({collab.email})</span>
                        )}
                      </div>

                      {/* Role Badge */}
                      {editingRole === collab.user_identifier ? (
                        <select
                          value={collab.role_label}
                          onChange={(e) => handleUpdateRole(collab.user_identifier, e.target.value)}
                          className="px-2 py-1 bg-[#1a1625] border border-purple-500/20 rounded text-sm text-white focus:outline-none focus:border-purple-500/50"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${getRoleBadgeColor(
                              collab.role_label
                            )}`}
                          >
                            {getRoleIcon(collab.role_label)}
                            {collab.role_label}
                          </span>
                          <div className="flex gap-1 text-xs text-gray-500 flex-wrap">
                            {collab.github_permission && collab.github_permission !== 'none' && (
                              <span className="px-1.5 py-0.5 bg-gray-700/30 rounded">
                                GitHub: {collab.github_permission}
                              </span>
                            )}
                            {collab.storage_permission && collab.storage_permission !== 'none' && (
                              <span className="px-1.5 py-0.5 bg-gray-700/30 rounded">
                                Storage: {collab.storage_permission}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editingRole === collab.user_identifier ? (
                      <button
                        onClick={() => setEditingRole(null)}
                        className="px-3 py-1.5 hover:bg-purple-500/10 rounded transition-colors text-sm text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingRole(collab.user_identifier)}
                        className="p-2 hover:bg-purple-500/10 rounded transition-colors"
                        title="Change role"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400 hover:text-purple-400" />
                      </button>
                    )}

                    {confirmDelete === collab.user_identifier ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(collab.user_identifier)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(collab.user_identifier)}
                        className="p-2 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Collaborator Modal */}
      <AddCollaboratorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCollaborator}
        roles={roles}
      />
    </div>
  );
}

