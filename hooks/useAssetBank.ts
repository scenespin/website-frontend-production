/**
 * Asset Bank React Query Hooks
 * 
 * Custom React Query hooks for Asset Bank operations.
 * Part of Production Hub Simplification Plan.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { Asset } from '@/types/asset';

// Use relative URLs to go through Next.js API proxy
// Don't call backend directly - go through /api/asset-bank route

// ============================================================================
// HELPER: Get auth token
// ============================================================================

async function getAuthToken(getToken: (options?: { template?: string }) => Promise<string | null>): Promise<string | null> {
  try {
    return await getToken({ template: 'wryda-backend' });
  } catch (error) {
    console.error('[useAssetBank] Failed to get auth token:', error);
    return null;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Query hook for fetching assets list
 * @param screenplayId - The screenplay ID
 * @param context - 'creation' or 'production-hub' (default: 'production-hub')
 * @param enabled - Whether the query should run
 */
export function useAssets(screenplayId: string, context: 'creation' | 'production-hub' = 'production-hub', enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<Asset[], Error>({
    queryKey: ['assets', screenplayId, context],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const contextParam = context ? `&context=${context}` : '';
      // Use relative URL to go through Next.js API proxy
      const response = await fetch(`/api/asset-bank?screenplayId=${encodeURIComponent(screenplayId)}${contextParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assetsResponse = data.assets || data.data?.assets || [];
      const assets = Array.isArray(assetsResponse) ? assetsResponse : [];
      
      // 🔥 DEBUG: Log angleReferences for troubleshooting
      assets.forEach((asset: any) => {
        if (asset.angleReferences && asset.angleReferences.length > 0) {
          console.log(`[useAssetBank] Asset ${asset.name} has ${asset.angleReferences.length} angleReferences:`, asset.angleReferences);
        } else if (asset.angleReferences === undefined) {
          console.log(`[useAssetBank] Asset ${asset.name} has no angleReferences field`);
        } else {
          console.log(`[useAssetBank] Asset ${asset.name} has empty angleReferences array`);
        }
      });
      
      return assets;
    },
    enabled: enabled && !!screenplayId,
    staleTime: 0, // 🔥 FIX: Always refetch to ensure fresh data (was 30000ms, causing stale cache issues)
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutation hook for deleting an asset
 * Feature 0149 Phase 7: Optimistic updates with error rollback
 */
export function useDeleteAsset(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Use relative URL to go through Next.js API proxy
      const response = await fetch(`/api/asset-bank/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete asset: ${response.status}`);
      }

      return assetId;
    },
    onMutate: async (assetId) => {
      // Cancel outgoing refetches for both contexts
      await queryClient.cancelQueries({ queryKey: ['assets', screenplayId] });

      // Snapshot previous values
      const previousProduction = queryClient.getQueryData<Asset[]>(['assets', screenplayId, 'production-hub']);
      const previousCreation = queryClient.getQueryData<Asset[]>(['assets', screenplayId, 'creation']);

      // Optimistically update both contexts
      queryClient.setQueryData<Asset[]>(['assets', screenplayId, 'production-hub'], (old) => {
        return old ? old.filter(a => a.id !== assetId) : [];
      });
      queryClient.setQueryData<Asset[]>(['assets', screenplayId, 'creation'], (old) => {
        return old ? old.filter(a => a.id !== assetId) : [];
      });

      return { previousProduction, previousCreation };
    },
    onError: (err, assetId, context) => {
      // Rollback on error
      if (context?.previousProduction) {
        queryClient.setQueryData(['assets', screenplayId, 'production-hub'], context.previousProduction);
      }
      if (context?.previousCreation) {
        queryClient.setQueryData(['assets', screenplayId, 'creation'], context.previousCreation);
      }
      toast.error(`Failed to delete asset: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSuccess: (assetId) => {
      // Invalidate Media Library cache
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      toast.success('Asset deleted');
    },
  });
}

