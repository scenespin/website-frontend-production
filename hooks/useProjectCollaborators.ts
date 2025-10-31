/**
 * useProjectCollaborators Hook
 * 
 * Custom React hook for managing project collaborators
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Collaborator {
    user_identifier: string;
    email?: string;
    github_username?: string;
    github_permission?: 'admin' | 'write' | 'read' | 'none';
    storage_permission?: 'owner' | 'editor' | 'viewer' | 'none';
    role_label: string;
    avatar_url?: string;
    added_at?: string;
}

export interface RoleInfo {
    id: string;
    name: string;
    description: string;
    capabilities: {
        canEditScript: boolean;
        canViewScript: boolean;
        canManageAssets: boolean;
        canViewAssets: boolean;
    };
}

interface UseProjectCollaboratorsReturn {
    collaborators: Collaborator[];
    roles: RoleInfo[];
    loading: boolean;
    error: string | null;
    addCollaborator: (email: string, role: string) => Promise<boolean>;
    removeCollaborator: (identifier: string) => Promise<boolean>;
    updateRole: (identifier: string, newRole: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useProjectCollaborators(projectId: string | null): UseProjectCollaboratorsReturn {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [roles, setRoles] = useState<RoleInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Get auth token from localStorage
    const getAuthToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    }, []);

    // Fetch available roles
    const fetchRoles = useCallback(async () => {
        if (!projectId) return;

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await axios.get(
                `${API_BASE}/api/projects/${projectId}/collaborators/roles`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setRoles(response.data.roles);
            }
        } catch (err: any) {
            console.error('Error fetching roles:', err);
            // Roles are optional, don't set error
        }
    }, [projectId, API_BASE, getAuthToken]);

    // Fetch collaborators
    const fetchCollaborators = useCallback(async () => {
        if (!projectId) return;

        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await axios.get(
                `${API_BASE}/api/projects/${projectId}/collaborators/list`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setCollaborators(response.data.collaborators || []);
            } else {
                throw new Error(response.data.error || 'Failed to fetch collaborators');
            }
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to load collaborators';
            setError(message);
            console.error('Error fetching collaborators:', err);
        } finally {
            setLoading(false);
        }
    }, [projectId, API_BASE, getAuthToken]);

    // Add collaborator
    const addCollaborator = useCallback(async (email: string, role: string): Promise<boolean> => {
        if (!projectId) return false;

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await axios.post(
                `${API_BASE}/api/projects/${projectId}/collaborators/add`,
                { email, role },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                // Refetch collaborators to update list
                await fetchCollaborators();
                return true;
            } else {
                setError(response.data.error || 'Failed to add collaborator');
                return false;
            }
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to add collaborator';
            setError(message);
            console.error('Error adding collaborator:', err);
            return false;
        }
    }, [projectId, API_BASE, getAuthToken, fetchCollaborators]);

    // Remove collaborator
    const removeCollaborator = useCallback(async (identifier: string): Promise<boolean> => {
        if (!projectId) return false;

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await axios.delete(
                `${API_BASE}/api/projects/${projectId}/collaborators/remove`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    data: { identifier }
                }
            );

            if (response.data.success) {
                // Refetch collaborators to update list
                await fetchCollaborators();
                return true;
            } else {
                setError(response.data.error || 'Failed to remove collaborator');
                return false;
            }
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to remove collaborator';
            setError(message);
            console.error('Error removing collaborator:', err);
            return false;
        }
    }, [projectId, API_BASE, getAuthToken, fetchCollaborators]);

    // Update collaborator role
    const updateRole = useCallback(async (identifier: string, newRole: string): Promise<boolean> => {
        if (!projectId) return false;

        try {
            const token = getAuthToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await axios.put(
                `${API_BASE}/api/projects/${projectId}/collaborators/update-role`,
                { identifier, role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                // Refetch collaborators to update list
                await fetchCollaborators();
                return true;
            } else {
                setError(response.data.error || 'Failed to update role');
                return false;
            }
        } catch (err: any) {
            const message = err.response?.data?.error || err.message || 'Failed to update role';
            setError(message);
            console.error('Error updating role:', err);
            return false;
        }
    }, [projectId, API_BASE, getAuthToken, fetchCollaborators]);

    // Fetch collaborators and roles on mount
    useEffect(() => {
        if (projectId) {
            fetchCollaborators();
            fetchRoles();
        }
    }, [projectId, fetchCollaborators, fetchRoles]);

    return {
        collaborators,
        roles,
        loading,
        error,
        addCollaborator,
        removeCollaborator,
        updateRole,
        refetch: fetchCollaborators
    };
}

