/**
 * useLocationReferences Hook
 * 
 * Custom hook for managing location references from Media Library.
 * Handles querying, mapping, and enriching location angles and backgrounds.
 */

import { useMemo } from 'react';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { isBackgroundFile, isAngleFile } from '../utils/mediaLibraryMappers';

export interface LocationAngle {
  angleId: string;
  angle: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  timeOfDay?: string;
  weather?: string;
}

export interface LocationBackground {
  id: string;
  imageUrl: string;
  s3Key: string;
  backgroundType?: string;
  sourceType?: string;
  sourceAngleId?: string;
  metadata?: {
    providerId?: string;
    quality?: string;
  };
  timeOfDay?: string;
  weather?: string;
}

interface UseLocationReferencesOptions {
  projectId: string;
  locationId: string | null;
  enabled?: boolean;
}

interface UseLocationReferencesReturn {
  angleVariations: LocationAngle[];
  backgrounds: LocationBackground[];
  locationThumbnailS3KeyMap: Map<string, string>;
  locationThumbnailUrlsMap: Map<string, string>;
  loading: boolean;
}

/**
 * Hook for managing location references from Media Library.
 * 
 * @param options - Configuration options
 * @returns Location angles, backgrounds, thumbnail maps, and loading state
 */
export function useLocationReferences({
  projectId,
  locationId,
  enabled = true
}: UseLocationReferencesOptions): UseLocationReferencesReturn {
  // Query Media Library for location images
  const { data: locationMediaFiles = [], isLoading: isLoadingFiles } = useMediaFiles(
    projectId,
    undefined,
    enabled && !!locationId,
    true, // includeAllFolders: true
    'location', // entityType
    locationId || undefined // entityId
  );

  // Build location thumbnailS3KeyMap from Media Library results
  const locationThumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    locationMediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    return map;
  }, [locationMediaFiles]);

  // Process location files into angles and backgrounds
  const { angleVariations, backgrounds } = useMemo(() => {
    if (!locationId || locationMediaFiles.length === 0) {
      return { angleVariations: [], backgrounds: [] };
    }

    const angleVariations: LocationAngle[] = [];
    const backgrounds: LocationBackground[] = [];

    locationMediaFiles.forEach((file: any) => {
      if ((file.metadata?.entityId || file.entityId) === locationId) {
        // Skip thumbnails
        if (file.s3Key?.startsWith('thumbnails/')) return;
        if (!file.s3Key) return;

        // 🔥 FIX: Use isBackgroundFile which now correctly checks for backgroundType
        // Backgrounds from angle packages have sourceType === 'angle-variations' AND backgroundType set
        // If sourceType === 'angle-variations' but no backgroundType, it's an angle, not a background
        const isBackground = isBackgroundFile(file) ||
          file.metadata?.source === 'background-generation' ||
          file.metadata?.uploadMethod === 'background-generation' ||
          file.metadata?.generationMethod === 'background-generation' ||
          (file.folderPath && file.folderPath.some((path: string) => path.toLowerCase().includes('background')));

        if (isBackground) {
          // Background image
          backgrounds.push({
            id: file.s3Key, // Use s3Key as ID for backend compatibility
            imageUrl: file.s3Url || '',
            s3Key: file.s3Key,
            backgroundType: file.metadata?.backgroundType || 'custom',
            sourceType: file.metadata?.sourceType,
            sourceAngleId: file.metadata?.sourceAngleId,
            metadata: {
              providerId: file.metadata?.providerId,
              quality: file.metadata?.quality
            },
            timeOfDay: file.metadata?.timeOfDay,
            weather: file.metadata?.weather
          });
        } else {
          // Angle variation
          angleVariations.push({
            angleId: file.s3Key, // Use s3Key as ID for backend compatibility
            angle: file.metadata?.angle || 'unknown',
            s3Key: file.s3Key,
            imageUrl: file.s3Url || '',
            label: file.metadata?.angle,
            timeOfDay: file.metadata?.timeOfDay,
            weather: file.metadata?.weather
          });
        }
      }
    });

    return { angleVariations, backgrounds };
  }, [locationId, locationMediaFiles]);

  // Collect all location thumbnail S3 keys
  const locationThumbnailS3Keys = useMemo(() => {
    const keys: string[] = [];
    
    [...angleVariations, ...backgrounds].forEach(item => {
      if (item.s3Key && locationThumbnailS3KeyMap.has(item.s3Key)) {
        const thumbnailS3Key = locationThumbnailS3KeyMap.get(item.s3Key);
        if (thumbnailS3Key) {
          keys.push(thumbnailS3Key);
        }
      }
    });
    
    return keys;
  }, [angleVariations, backgrounds, locationThumbnailS3KeyMap]);

  // 🔥 PERFORMANCE FIX: Only fetch thumbnails upfront (for grid display)
  // Full images will be fetched lazily when needed (e.g., when selected for generation)
  // This dramatically reduces initial load time since thumbnails are much smaller
  const { data: locationThumbnailUrlsMap = new Map() } = useBulkPresignedUrls(
    locationThumbnailS3Keys,
    locationThumbnailS3Keys.length > 0
  );

  // 🔥 PERFORMANCE FIX: Don't fetch full images upfront - they're only needed for selected references
  // Full images will be fetched on-demand in LocationAngleSelector when references are selected
  // This prevents loading hundreds of full-size images that may never be used
  // Note: angleVariations and backgrounds keep their original imageUrl (from Media Library s3Url)
  // which can be used as fallback, but thumbnails are preferred for display
  const enrichedAngleVariations = angleVariations;
  const enrichedBackgrounds = backgrounds;

  return {
    angleVariations: enrichedAngleVariations,
    backgrounds: enrichedBackgrounds,
    locationThumbnailS3KeyMap,
    locationThumbnailUrlsMap,
    loading: isLoadingFiles
  };
}

