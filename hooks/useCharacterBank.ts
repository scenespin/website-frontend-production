/**
 * Character Bank React Query Hooks
 * 
 * Custom React Query hooks for Character Bank operations.
 * Part of Production Hub Simplification Plan.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { CharacterProfile } from '@/components/production/types';
import { fetchWithSessionId } from '@/lib/api';

// ============================================================================
// HELPER: Get auth token
// ============================================================================

async function getAuthToken(getToken: (options?: { template?: string }) => Promise<string | null>): Promise<string | null> {
  try {
    return await getToken({ template: 'wryda-backend' });
  } catch (error) {
    console.error('[useCharacterBank] Failed to get auth token:', error);
    return null;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Query hook for fetching characters list
 * @param screenplayId - The screenplay ID
 * @param context - 'creation' or 'production-hub' (default: 'production-hub')
 * @param enabled - Whether the query should run
 */
export function useCharacters(screenplayId: string, context: 'creation' | 'production-hub' = 'production-hub', enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<CharacterProfile[], Error>({
    queryKey: ['characters', screenplayId, context],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithSessionId(`/api/character-bank/list?screenplayId=${encodeURIComponent(screenplayId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch characters: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.characters || data.data?.characters || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutation hook for deleting a character
 * Feature 0149 Phase 7: Optimistic updates with error rollback
 */
export function useDeleteCharacter(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: string) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithSessionId(`/api/character-bank/${characterId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete character: ${response.status}`);
      }

      return characterId;
    },
    onMutate: async (characterId) => {
      // Cancel outgoing refetches for both contexts
      await queryClient.cancelQueries({ queryKey: ['characters', screenplayId] });

      // Snapshot previous values for both contexts
      const previousProduction = queryClient.getQueryData<CharacterProfile[]>(['characters', screenplayId, 'production-hub']);
      const previousCreation = queryClient.getQueryData<CharacterProfile[]>(['characters', screenplayId, 'creation']);

      // Optimistically update both contexts
      queryClient.setQueryData<CharacterProfile[]>(['characters', screenplayId, 'production-hub'], (old) => {
        return old ? old.filter(c => c.id !== characterId) : [];
      });
      queryClient.setQueryData<CharacterProfile[]>(['characters', screenplayId, 'creation'], (old) => {
        return old ? old.filter(c => c.id !== characterId) : [];
      });

      return { previousProduction, previousCreation };
    },
    onError: (err, characterId, context) => {
      // Rollback on error for both contexts
      if (context?.previousProduction) {
        queryClient.setQueryData(['characters', screenplayId, 'production-hub'], context.previousProduction);
      }
      if (context?.previousCreation) {
        queryClient.setQueryData(['characters', screenplayId, 'creation'], context.previousCreation);
      }
      toast.error(`Failed to delete character: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSuccess: (characterId) => {
      // Invalidate Media Library cache
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      toast.success('Character deleted');
    },
  });
}

