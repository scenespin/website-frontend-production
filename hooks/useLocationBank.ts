/**
 * Location Bank React Query Hooks
 * 
 * Custom React Query hooks for Location Bank operations.
 * Part of Production Hub Simplification Plan.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// Location Profile from Location Bank API
export interface LocationReference {
  id: string;
  locationId: string;
  imageUrl: string;
  s3Key: string;
  angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
  creditsUsed: number;
  createdAt: string;
}

export interface LocationProfile {
  locationId: string;
  screenplayId: string;
  projectId: string; // Backward compatibility
  name: string;
  type: 'interior' | 'exterior' | 'mixed';
  description: string;
  baseReference: LocationReference;
  angleVariations: LocationReference[];
  totalCreditsSpent?: number;
  consistencyRating?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// HELPER: Get auth token
// ============================================================================

async function getAuthToken(getToken: (options?: { template?: string }) => Promise<string | null>): Promise<string | null> {
  try {
    return await getToken({ template: 'wryda-backend' });
  } catch (error) {
    console.error('[useLocationBank] Failed to get auth token:', error);
    return null;
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Query hook for fetching locations list
 */
export function useLocations(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<LocationProfile[], Error>({
    queryKey: ['locations', screenplayId],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${BACKEND_API_URL}/api/location-bank/list?screenplayId=${encodeURIComponent(screenplayId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.locations || data.data?.locations || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30000, // 30 seconds
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutation hook for deleting a location
 * Feature 0149 Phase 7: Optimistic updates with error rollback
 */
export function useDeleteLocation(screenplayId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationId: string) => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${BACKEND_API_URL}/api/location-bank/${locationId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete location: ${response.status}`);
      }

      return locationId;
    },
    onMutate: async (locationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['locations', screenplayId] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<LocationProfile[]>(['locations', screenplayId]);

      // Optimistically update
      queryClient.setQueryData<LocationProfile[]>(['locations', screenplayId], (old) => {
        return old ? old.filter(l => l.locationId !== locationId) : [];
      });

      return { previous };
    },
    onError: (err, locationId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['locations', screenplayId], context.previous);
      }
      toast.error(`Failed to delete location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSuccess: (locationId) => {
      // Invalidate Media Library cache
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      toast.success('Location deleted');
    },
  });
}

