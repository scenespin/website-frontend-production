/**
 * Playlist React Query Hooks
 * 
 * Custom React Query hooks for playlist operations.
 * Feature 0209: Video Playlist Builder and Editor
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import type {
  Playlist,
  PlaylistResponse,
  PlaylistListResponse,
  PlaylistTemplatesResponse,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  playlistCacheKeys,
} from '@/types/playlist';

// ============================================================================
// HELPER: Get auth token
// ============================================================================

async function getAuthToken(getToken: (options?: { template?: string }) => Promise<string | null>): Promise<string | null> {
  try {
    return await getToken({ template: 'wryda-backend' });
  } catch (error) {
    console.error('[usePlaylists] Failed to get auth token:', error);
    return null;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Query hook for fetching a single playlist
 */
export function usePlaylist(screenplayId: string, playlistId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<Playlist, Error>({
    queryKey: ['playlists', screenplayId, playlistId],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Playlist not found');
        }
        throw new Error(`Failed to fetch playlist: ${response.status} ${response.statusText}`);
      }

      const data: PlaylistResponse = await response.json();
      return data.playlist;
    },
    enabled: enabled && !!screenplayId && !!playlistId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Query hook for fetching all playlists for a scene
 */
export function useScenePlaylists(screenplayId: string, sceneId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<Playlist[], Error>({
    queryKey: ['playlists', screenplayId, 'scene', sceneId],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/scenes/${sceneId}/playlists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scene playlists: ${response.status} ${response.statusText}`);
      }

      const data: PlaylistListResponse = await response.json();
      return data.playlists || [];
    },
    enabled: enabled && !!screenplayId && !!sceneId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Query hook for fetching user's templates
 */
export function usePlaylistTemplates(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<Playlist[], Error>({
    queryKey: ['playlists', screenplayId, 'templates'],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
      }

      const data: PlaylistTemplatesResponse = await response.json();
      return data.templates || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 60 * 1000, // 1 minute (templates change less frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutation hook for creating a playlist
 */
export function useCreatePlaylist(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Playlist, Error, CreatePlaylistRequest>({
    mutationFn: async (request) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create playlist: ${response.status}`);
      }

      const data: PlaylistResponse = await response.json();
      return data.playlist;
    },
    onSuccess: (playlist) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId] });
      if (playlist.sceneId) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'scene', playlist.sceneId] });
      }
      if (playlist.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'templates'] });
      }
      toast.success('Playlist created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create playlist');
    },
  });
}

/**
 * Mutation hook for updating a playlist
 */
export function useUpdatePlaylist(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Playlist, Error, { playlistId: string; updates: UpdatePlaylistRequest }>({
    mutationFn: async ({ playlistId, updates }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists/${playlistId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update playlist: ${response.status}`);
      }

      const data: PlaylistResponse = await response.json();
      return data.playlist;
    },
    onSuccess: (playlist) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, playlist.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId] });
      if (playlist.sceneId) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'scene', playlist.sceneId] });
      }
      if (playlist.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'templates'] });
      }
      toast.success('Playlist updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update playlist');
    },
  });
}

/**
 * Mutation hook for deleting a playlist
 */
export function useDeletePlaylist(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { playlistId: string; sceneId?: string | null }>({
    mutationFn: async ({ playlistId }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 200) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete playlist: ${response.status}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, variables.playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId] });
      if (variables.sceneId) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'scene', variables.sceneId] });
      }
      toast.success('Playlist deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete playlist');
    },
  });
}

/**
 * Mutation hook for duplicating a playlist
 */
export function useDuplicatePlaylist(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Playlist, Error, { playlistId: string; playlistName?: string }>({
    mutationFn: async ({ playlistId, playlistName }) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/screenplays/${screenplayId}/playlists/${playlistId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlistName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to duplicate playlist: ${response.status}`);
      }

      const data: PlaylistResponse = await response.json();
      return data.playlist;
    },
    onSuccess: (playlist) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId] });
      if (playlist.sceneId) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'scene', playlist.sceneId] });
      }
      if (playlist.isTemplate) {
        queryClient.invalidateQueries({ queryKey: ['playlists', screenplayId, 'templates'] });
      }
      toast.success('Playlist duplicated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to duplicate playlist');
    },
  });
}

/**
 * Helper function to export playlist as JSON
 */
export async function exportPlaylistAsJSON(
  screenplayId: string,
  playlistId: string,
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<void> {
  const token = await getAuthToken(getToken);
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/screenplays/${screenplayId}/playlists/${playlistId}/export`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export playlist: ${response.status}`);
  }

  const playlist: Playlist = await response.json();
  const blob = new Blob([JSON.stringify(playlist, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `playlist_${playlist.playlistName || playlistId}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
