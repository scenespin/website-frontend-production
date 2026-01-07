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
      console.log('[useLocationReferences] No files or locationId:', { locationId, fileCount: locationMediaFiles.length });
      return { angleVariations: [], backgrounds: [] };
    }

    console.log('[useLocationReferences] Processing files:', { 
      locationId, 
      fileCount: locationMediaFiles.length,
      files: locationMediaFiles.map((f: any) => ({
        s3Key: f.s3Key?.substring(0, 50),
        entityId: f.metadata?.entityId || f.entityId,
        angle: f.metadata?.angle,
        backgroundType: f.metadata?.backgroundType,
        sourceType: f.metadata?.sourceType,
        isThumbnail: f.s3Key?.startsWith('thumbnails/')
      }))
    });

    const angleVariations: LocationAngle[] = [];
    const backgrounds: LocationBackground[] = [];

    locationMediaFiles.forEach((file: any) => {
      if ((file.metadata?.entityId || file.entityId) === locationId) {
        // Skip thumbnails
        if (file.s3Key?.startsWith('thumbnails/')) return;
        if (!file.s3Key) return;

        // 🔥 FIX: Prioritize angle detection - if it has angle metadata, it's an angle
        // Only check for background if it doesn't have angle metadata
        const hasAngleMetadata = file.metadata?.angle !== undefined || 
          (file.metadata?.sourceType === 'angle-variations' && file.metadata?.backgroundType === undefined);
        
        // 🔥 FIX: Use isBackgroundFile which now correctly checks for backgroundType
        // Backgrounds from angle packages have sourceType === 'angle-variations' AND backgroundType set
        // If sourceType === 'angle-variations' but no backgroundType, it's an angle, not a background
        const isBackground = !hasAngleMetadata && (
          isBackgroundFile(file) ||
          file.metadata?.source === 'background-generation' ||
          file.metadata?.uploadMethod === 'background-generation' ||
          file.metadata?.generationMethod === 'background-generation' ||
          (file.folderPath && file.folderPath.some((path: string) => path.toLowerCase().includes('background')))
        );

        // 🔥 DEBUG: Log classification for each file
        console.log('[useLocationReferences] Classifying file:', {
          s3Key: file.s3Key?.substring(0, 50),
          hasAngleMetadata,
          isBackground,
          angle: file.metadata?.angle,
          backgroundType: file.metadata?.backgroundType,
          sourceType: file.metadata?.sourceType,
          isBackgroundFileResult: isBackgroundFile(file)
        });

        if (isBackground) {
          // Background image
          // 🔥 PROFESSIONAL FIX: Set imageUrl to null (not empty string) if s3Url is missing/invalid
          // The resolver's isValidImageUrl will validate it - no need to duplicate validation logic here
          // This follows single responsibility: hook provides data, resolver validates URLs
          backgrounds.push({
            id: file.s3Key, // Use s3Key as ID for backend compatibility
            imageUrl: file.s3Url || null,
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
        } else if (hasAngleMetadata || !isBackground) {
          // Angle variation - prioritize files with angle metadata or files that aren't backgrounds
          // 🔥 FIX: Also include files that have sourceType === 'angle-variations' without backgroundType
          // This ensures angle variations from angle packages are correctly identified
          // 🔥 PROFESSIONAL FIX: Set imageUrl to null (not empty string) if s3Url is missing/invalid
          // The resolver's isValidImageUrl will validate it - no need to duplicate validation logic here
          // This follows single responsibility: hook provides data, resolver validates URLs
          angleVariations.push({
            angleId: file.s3Key, // Use s3Key as ID for backend compatibility
            angle: file.metadata?.angle || 'unknown',
            s3Key: file.s3Key,
            imageUrl: file.s3Url || null,
            label: file.metadata?.angle,
            timeOfDay: file.metadata?.timeOfDay,
            weather: file.metadata?.weather
          });
        }
        // 🔥 FIX: If file doesn't match angle or background criteria, skip it (don't add to either array)
      }
    });

    console.log('[useLocationReferences] Classification results:', {
      locationId,
      angleCount: angleVariations.length,
      backgroundCount: backgrounds.length,
      angles: angleVariations.map(a => ({ angle: a.angle, s3Key: a.s3Key?.substring(0, 50) })),
      backgrounds: backgrounds.map(b => ({ backgroundType: b.backgroundType, s3Key: b.s3Key?.substring(0, 50) }))
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

