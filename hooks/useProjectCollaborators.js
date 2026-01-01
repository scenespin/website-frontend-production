/**
 * useProjectCollaborators Hook
 * 
 * Custom React hook for managing project collaborators
 * Migrated from old template with Clerk authentication
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} Collaborator
 * @property {string} user_identifier - Unique identifier
 * @property {string} [email] - Email address
 * @property {string} [github_username] - GitHub username
 * @property {'admin'|'write'|'read'|'none'} [github_permission] - GitHub permission level
 * @property {'owner'|'editor'|'viewer'|'none'} [storage_permission] - Cloud storage permission
 * @property {string} role_label - Human-readable role name
 * @property {string} [avatar_url] - Avatar URL
 * @property {string} [added_at] - ISO timestamp
 */

/**
 * @typedef {Object} RoleInfo
 * @property {string} id - Role identifier
 * @property {string} name - Display name
 * @property {string} description - Role description
 * @property {Object} capabilities - Permission flags
 * @property {boolean} capabilities.canEditScript - Can edit screenplay
 * @property {boolean} capabilities.canViewScript - Can view screenplay
 * @property {boolean} capabilities.canManageAssets - Can manage assets
 * @property {boolean} capabilities.canViewAssets - Can view assets
 */

// Default roles if backend doesn't provide them
const DEFAULT_ROLES = [
  {
    id: 'director',
    name: '🎬 Director',
    description: 'Full access to everything - script, assets, and team management',
    capabilities: {
      canEditScript: true,
      canViewScript: true,
      canManageAssets: true,
      canViewAssets: true,
    },
  },
  {
    id: 'writer',
    name: '✍️ Script Writer',
    description: 'Can edit screenplay and use all creative tools',
    capabilities: {
      canEditScript: true,
      canViewScript: true,
      canManageAssets: true,
      canViewAssets: true,
    },
  },
  {
    id: 'producer',
    name: '🎬 Producer',
    description: 'Production Hub: Generate and manage assets, view script (read-only). No script editing or AI writing agents.',
    capabilities: {
      canEditScript: false,
      canViewScript: true,
      canManageAssets: true,
      canViewAssets: true,
    },
  },
  {
    id: 'viewer',
    name: '👁️ Viewer',
    description: 'Read-only access to screenplay',
    capabilities: {
      canEditScript: false,
      canViewScript: true,
      canManageAssets: false,
      canViewAssets: false,
    },
  },
];

/**
 * Hook for managing project collaborators
 * @param {string|null} projectId - Project ID
 * @returns {Object} Collaboration state and functions
 */
export function useProjectCollaborators(projectId) {
  const { isSignedIn } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available roles
  const fetchRoles = useCallback(async () => {
    if (!projectId || !isSignedIn) return;

    try {
      const response = await api.projects.getCollaboratorRoles(projectId);
      if (response.success && response.roles) {
        setRoles(response.roles);
      }
    } catch (err) {
      console.warn('[useProjectCollaborators] Failed to fetch roles, using defaults:', err);
      // Non-critical - keep default roles
    }
  }, [projectId, isSignedIn]);

  // Fetch collaborators
  const fetchCollaborators = useCallback(async () => {
    if (!projectId || !isSignedIn) {
      setCollaborators([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.projects.listCollaborators(projectId);
      
      if (response.success) {
        setCollaborators(response.collaborators || []);
      } else {
        throw new Error(response.error || 'Failed to fetch collaborators');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to load collaborators';
      setError(message);
      console.error('[useProjectCollaborators] Error fetching collaborators:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, isSignedIn]);

  // Add collaborator
  const addCollaborator = useCallback(async (email, role) => {
    if (!projectId || !isSignedIn) return false;

    const loadingToast = toast.loading('Inviting collaborator...');

    try {
      const response = await api.projects.addCollaborator(projectId, { email, role });

      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success(`Invitation sent to ${email}!`);
        // Refetch collaborators to update list
        await fetchCollaborators();
        return true;
      } else {
        throw new Error(response.error || 'Failed to add collaborator');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to add collaborator';
      toast.dismiss(loadingToast);
      toast.error(message);
      setError(message);
      console.error('[useProjectCollaborators] Error adding collaborator:', err);
      return false;
    }
  }, [projectId, isSignedIn, fetchCollaborators]);

  // Remove collaborator
  const removeCollaborator = useCallback(async (identifier) => {
    if (!projectId || !isSignedIn) return false;

    const loadingToast = toast.loading('Removing collaborator...');

    try {
      const response = await api.projects.removeCollaborator(projectId, identifier);

      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success('Collaborator removed');
        // Refetch collaborators to update list
        await fetchCollaborators();
        return true;
      } else {
        throw new Error(response.error || 'Failed to remove collaborator');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to remove collaborator';
      toast.dismiss(loadingToast);
      toast.error(message);
      setError(message);
      console.error('[useProjectCollaborators] Error removing collaborator:', err);
      return false;
    }
  }, [projectId, isSignedIn, fetchCollaborators]);

  // Update collaborator role
  const updateRole = useCallback(async (identifier, newRole) => {
    if (!projectId || !isSignedIn) return false;

    const loadingToast = toast.loading('Updating role...');

    try {
      const response = await api.projects.updateCollaboratorRole(projectId, identifier, newRole);

      if (response.success) {
        toast.dismiss(loadingToast);
        toast.success('Role updated');
        // Refetch collaborators to update list
        await fetchCollaborators();
        return true;
      } else {
        throw new Error(response.error || 'Failed to update role');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to update role';
      toast.dismiss(loadingToast);
      toast.error(message);
      setError(message);
      console.error('[useProjectCollaborators] Error updating role:', err);
      return false;
    }
  }, [projectId, isSignedIn, fetchCollaborators]);

  // Fetch collaborators and roles on mount or when projectId changes
  useEffect(() => {
    if (projectId && isSignedIn) {
      fetchCollaborators();
      fetchRoles();
    } else {
      setCollaborators([]);
      setRoles(DEFAULT_ROLES);
    }
  }, [projectId, isSignedIn, fetchCollaborators, fetchRoles]);

  return {
    collaborators,
    roles,
    loading,
    error,
    addCollaborator,
    removeCollaborator,
    updateRole,
    refetch: fetchCollaborators,
  };
}

