'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Trash2, Edit2, Check, X as XIcon, Loader2, Users } from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import RoleBadge, { type ScreenplayRole } from './RoleBadge';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CollaborationPanel - UI for managing screenplay collaborators
 * Only visible to screenplay owners
 */
export default function CollaborationPanel({ isOpen, onClose }: CollaborationPanelProps) {
  const { user } = useUser();
  const {
    screenplayId,
    isOwner,
    collaborators,
    currentUserRole,
    loadCollaborators,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    getAvailableRoles
  } = useScreenplay();

  // Get current user's email and user_id for owner check
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const currentUserId = user?.id;

  const [availableRoles, setAvailableRoles] = useState<Array<{
    id: string;
    name: string;
    description: string;
    capabilities: Record<string, boolean>;
  }>>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<ScreenplayRole>('viewer');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<ScreenplayRole>('viewer');

  // Load available roles on mount
  useEffect(() => {
    if (isOpen && screenplayId) {
      setIsLoadingRoles(true);
      getAvailableRoles()
        .then(roles => {
          setAvailableRoles(roles);
        })
        .catch(err => {
          console.error('[CollaborationPanel] Error loading roles:', err);
          toast.error('Failed to load available roles');
        })
        .finally(() => {
          setIsLoadingRoles(false);
        });
    }
  }, [isOpen, screenplayId, getAvailableRoles]);

  // Reload collaborators when panel opens
  useEffect(() => {
    if (isOpen && screenplayId && isOwner) {
      loadCollaborators(screenplayId).catch(err => {
        console.error('[CollaborationPanel] Error loading collaborators:', err);
      });
    }
  }, [isOpen, screenplayId, isOwner, loadCollaborators]);

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!newCollaboratorRole) {
      toast.error('Please select a role');
      return;
    }

    setIsAdding(true);
    try {
      await addCollaborator(newCollaboratorEmail.trim(), newCollaboratorRole);
      setNewCollaboratorEmail('');
      setNewCollaboratorRole('viewer');
      toast.success('Collaborator added successfully');
    } catch (error: any) {
      console.error('[CollaborationPanel] Error adding collaborator:', error);
      // Error toast is handled by addCollaborator function
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveCollaborator = async (identifier: string, email: string) => {
    if (!confirm(`Remove ${email} from this screenplay?`)) {
      return;
    }

    try {
      await removeCollaborator(identifier);
      toast.success('Collaborator removed');
    } catch (error: any) {
      console.error('[CollaborationPanel] Error removing collaborator:', error);
      // Error toast is handled by removeCollaborator function
    }
  };

  const handleStartEditRole = (identifier: string, currentRole: ScreenplayRole) => {
    setEditingRole(identifier);
    setEditingRoleValue(currentRole);
  };

  const handleCancelEditRole = () => {
    setEditingRole(null);
    setEditingRoleValue('viewer');
  };

  const handleSaveRole = async (identifier: string) => {
    try {
      await updateCollaboratorRole(identifier, editingRoleValue);
      setEditingRole(null);
      setEditingRoleValue('viewer');
      toast.success('Role updated successfully');
    } catch (error: any) {
      console.error('[CollaborationPanel] Error updating role:', error);
      // Error toast is handled by updateCollaboratorRole function
    }
  };

  if (!isOpen) {
    return null;
  }

  // Only show panel to owners
  if (!isOwner) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Collaboration</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-base-300 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-base-content/70">
            Only screenplay owners can manage collaborators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Collaboration</h2>
              <p className="text-sm text-base-content/70">
                Manage who can access this screenplay
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current User Role */}
          {currentUserRole && (
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70 mb-1">Your Role</p>
                  <RoleBadge role={currentUserRole} size="md" />
                </div>
                {isOwner && (
                  <span className="text-xs text-base-content/50">Owner</span>
                )}
              </div>
            </div>
          )}

          {/* Add Collaborator Form */}
          <div className="border border-base-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Collaborator
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isAdding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Role
                </label>
                {isLoadingRoles ? (
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading roles...
                  </div>
                ) : (
                  <select
                    value={newCollaboratorRole}
                    onChange={(e) => setNewCollaboratorRole(e.target.value as ScreenplayRole)}
                    className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isAdding}
                  >
                    {availableRoles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={handleAddCollaborator}
                disabled={isAdding || !newCollaboratorEmail.trim()}
                className="w-full px-4 py-2 bg-primary text-primary-content rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Collaborator
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collaborators List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Collaborators ({collaborators.length})
            </h3>
            {collaborators.length === 0 ? (
              <div className="text-center py-8 text-base-content/70">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No collaborators yet</p>
                <p className="text-sm mt-1">Add someone to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collaborator, index) => {
                  // 🔥 PROTECTION: Check if this collaborator is the owner
                  const isOwnerCollaborator = isOwner && (
                    (collaborator.user_id && collaborator.user_id === currentUserId) ||
                    (collaborator.email && currentUserEmail && collaborator.email.toLowerCase() === currentUserEmail)
                  );

                  return (
                    <div
                      key={collaborator.email || collaborator.user_id || index}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{collaborator.email}</p>
                            {isOwnerCollaborator && (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                Owner
                              </span>
                            )}
                          </div>
                          {collaborator.user_id && (
                            <p className="text-xs text-base-content/50 truncate">
                              {collaborator.user_id}
                            </p>
                          )}
                          {editingRole === (collaborator.user_id || collaborator.email) ? (
                            <div className="flex items-center gap-2 mt-2">
                              <select
                                value={editingRoleValue}
                                onChange={(e) => setEditingRoleValue(e.target.value as ScreenplayRole)}
                                className="px-2 py-1 bg-base-100 border border-base-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isOwnerCollaborator}
                              >
                                {availableRoles.map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveRole(collaborator.user_id || collaborator.email)}
                                className="p-1 hover:bg-success/20 rounded transition-colors"
                                title="Save"
                                disabled={isOwnerCollaborator}
                              >
                                <Check className="w-4 h-4 text-success" />
                              </button>
                              <button
                                onClick={handleCancelEditRole}
                                className="p-1 hover:bg-error/20 rounded transition-colors"
                                title="Cancel"
                              >
                                <XIcon className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          ) : (
                            <div className="mt-1">
                              {isOwnerCollaborator ? (
                                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                  Owner (Director)
                                </span>
                              ) : (
                                <RoleBadge role={collaborator.role} size="sm" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingRole !== (collaborator.user_id || collaborator.email) && (
                          <>
                            {/* 🔥 PROTECTION: Hide edit/remove buttons for owner */}
                            {!isOwnerCollaborator && (
                              <>
                                <button
                                  onClick={() => handleStartEditRole(
                                    collaborator.user_id || collaborator.email,
                                    collaborator.role
                                  )}
                                  className="p-2 hover:bg-base-300 rounded transition-colors"
                                  title="Edit role"
                                >
                                  <Edit2 className="w-4 h-4 text-base-content/70" />
                                </button>
                                <button
                                  onClick={() => handleRemoveCollaborator(
                                    collaborator.user_id || collaborator.email,
                                    collaborator.email
                                  )}
                                  className="p-2 hover:bg-error/20 rounded transition-colors"
                                  title="Remove collaborator"
                                >
                                  <Trash2 className="w-4 h-4 text-error" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

