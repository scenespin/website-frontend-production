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

// Location Profile from Location Bank API
export interface LocationReference {
  id: string;
  locationId: string;
  imageUrl: string;
  s3Key: string;
  angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail' | 'corner' | 'low-angle' | 'entrance' | 'foreground-framing' | 'pov' | 'atmospheric' | 'golden-hour' | 'back-view' | 'close-up' | 'establishing';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
  creditsUsed: number;
  createdAt: string;
  // 🔥 NEW: Generation metadata for exact regeneration
  metadata?: {
    generationPrompt?: string;
    providerId?: string;
    quality?: 'standard' | 'high-quality';
    referenceImageUrls?: string[];
    generatedAt?: string;
    isRegenerated?: boolean;
    // 🔥 NEW: Crop-related metadata for location images
    originalS3Key?: string; // Original square 4096x4096 version S3 key
    originalImageUrl?: string; // Original square URL (for UI toggle)
    autoCropped16_9S3Key?: string; // Auto-cropped 16:9 version S3 key
    autoCropped16_9ImageUrl?: string; // Auto-cropped 16:9 URL (for fallback)
    cropped16_9S3Key?: string; // Cropped 16:9 version S3 key (user or auto)
    cropped16_9ImageUrl?: string; // Cropped 16:9 URL (user or auto)
    croppedImageUrl?: string; // Legacy field for cropped URL (deprecated, use cropped16_9ImageUrl)
    userCropped?: boolean; // Flag indicating if this was user-defined crop
    cropMethod?: 'center' | 'user-defined'; // Crop method used
    aspectRatio?: '16:9' | '21:9'; // Final aspect ratio shown to user
    autoCropped?: boolean; // Flag indicating this was auto-cropped
  };
}

export interface LocationBackground {
  id: string;
  imageUrl: string;
  s3Key: string; // Temporary storage with 7-day expiration (or current S3 key if not migrated)
  // Cloud storage migration (Feature 0143) - Media Library is source of truth
  cloudStorageLocation?: 'google-drive' | 'dropbox'; // Where file is permanently stored (from Media Library)
  cloudFileId?: string; // File ID in cloud storage (Google Drive file ID or Dropbox path) (from Media Library)
  backgroundType: 'window' | 'wall' | 'doorway' | 'texture' | 'corner-detail' | 'furniture' | 'architectural-feature' | 'custom';
  description?: string;
  sourceType?: 'reference-images' | 'angle-variations';
  sourceAngleId?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'ai-generated' | 'angle-crop' | 'upload';
  creditsUsed: number;
  createdAt: string;
  metadata?: {
    generationPrompt?: string;
    providerId?: string;
    quality?: 'standard' | 'high-quality';
    sourceAngleIds?: string[];
  };
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
  backgrounds?: LocationBackground[]; // Background images for close-up shots
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
 * @param screenplayId - The screenplay ID
 * @param context - 'creation' or 'production-hub' (default: 'production-hub')
 * @param enabled - Whether the query should run
 */
export function useLocations(screenplayId: string, context: 'creation' | 'production-hub' = 'production-hub', enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery<LocationProfile[], Error>({
    queryKey: ['locations', screenplayId, context],
    queryFn: async () => {
      const token = await getAuthToken(getToken);
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/location-bank/list?screenplayId=${encodeURIComponent(screenplayId)}`, {
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

      const response = await fetch(`/api/location-bank/${locationId}?screenplayId=${encodeURIComponent(screenplayId)}`, {
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
      // Cancel outgoing refetches for both contexts
      await queryClient.cancelQueries({ queryKey: ['locations', screenplayId] });

      // Snapshot previous values for both contexts
      const previousProduction = queryClient.getQueryData<LocationProfile[]>(['locations', screenplayId, 'production-hub']);
      const previousCreation = queryClient.getQueryData<LocationProfile[]>(['locations', screenplayId, 'creation']);

      // Optimistically update both contexts
      queryClient.setQueryData<LocationProfile[]>(['locations', screenplayId, 'production-hub'], (old) => {
        return old ? old.filter(l => l.locationId !== locationId) : [];
      });
      queryClient.setQueryData<LocationProfile[]>(['locations', screenplayId, 'creation'], (old) => {
        return old ? old.filter(l => l.locationId !== locationId) : [];
      });

      return { previousProduction, previousCreation };
    },
    onError: (err, locationId, context) => {
      // Rollback on error for both contexts
      if (context?.previousProduction) {
        queryClient.setQueryData(['locations', screenplayId, 'production-hub'], context.previousProduction);
      }
      if (context?.previousCreation) {
        queryClient.setQueryData(['locations', screenplayId, 'creation'], context.previousCreation);
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

