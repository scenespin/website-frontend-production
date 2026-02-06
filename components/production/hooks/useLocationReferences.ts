/**
 * useLocationReferences Hook
 * 
 * Custom hook for managing location references from Media Library.
 * Handles querying, mapping, and enriching location angles and backgrounds.
 */

import { useMemo } from 'react';
import { useMediaFiles, useBulkPresignedUrls, useDropboxPreviewUrls } from '@/hooks/useMediaLibrary';
import { isBackgroundFile, isAngleFile } from '../utils/mediaLibraryMappers';

export interface LocationAngle {
  angleId: string;
  angle: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  timeOfDay?: string;
  weather?: string;
  /** MediaFile id for Dropbox preview URL lookup */
  fileId?: string;
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
    useCase?: string; // e.g. 'extreme-closeup' for ECU grouping in LocationAngleSelector
  };
  timeOfDay?: string;
  weather?: string;
  /** MediaFile id for Dropbox preview URL lookup */
  fileId?: string;
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
  locationFullImageUrlsMap: Map<string, string>; // 🔥 NEW: Full image URLs for files without thumbnails
  dropboxUrlMap: Map<string, string>;
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
  // 🔥 FIX: Follow same pattern as characters and props - query ALL location files, filter client-side
  // This matches the working pattern used by useCharacterReferences and usePropReferences
  const { data: allLocationMediaFiles = [], isLoading: isLoadingFiles } = useMediaFiles(
    projectId,
    undefined,
    enabled, // Enable query even when locationId is null (like characters/props do)
    true, // includeAllFolders: true
    'location', // entityType only, no entityId (get all location files)
    undefined // 🔥 FIX: Don't pass entityId - query all location files and filter client-side
  );

  // 🔥 FIX: Filter Media Library files by locationId (client-side filtering, like characters/props)
  const locationMediaFiles = useMemo(() => {
    if (!allLocationMediaFiles || !locationId) return [];
    
    const filtered = allLocationMediaFiles.filter((file: any) => {
      const fileEntityId = file.metadata?.entityId || file.entityId;
      return fileEntityId === locationId;
    });
    
    console.log('[useLocationReferences] 🔍 Filtered files by locationId:', {
      inputFiles: allLocationMediaFiles.length,
      locationId,
      filteredFiles: filtered.length,
      filesWithThumbnails: filtered.filter((f: any) => f.thumbnailS3Key).length,
      sampleFiles: filtered.slice(0, 3).map((f: any) => ({
        s3Key: f.s3Key?.substring(0, 40) + '...',
        entityId: f.metadata?.entityId || f.entityId,
        thumbnailS3Key: f.thumbnailS3Key ? 'YES' : 'NO'
      }))
    });
    
    return filtered;
  }, [allLocationMediaFiles, locationId]);

  // Build location thumbnailS3KeyMap from Media Library results
  const locationThumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    let anglesWithThumbnails = 0;
    let backgroundsWithThumbnails = 0;
    let anglesWithoutThumbnails = 0;
    let backgroundsWithoutThumbnails = 0;
    
    // 🔥 DEBUG: Log sample files to see their structure
    const sampleAngleFiles = locationMediaFiles.filter((file: any) => {
      const hasAngleMetadata = file.metadata?.angle !== undefined;
      const isBackground = !hasAngleMetadata && (
        isBackgroundFile(file) ||
        file.metadata?.source === 'background-generation' ||
        file.metadata?.backgroundType !== undefined
      );
      return !isBackground && !file.s3Key?.startsWith('thumbnails/');
    }).slice(0, 3);
    
    const sampleBackgroundFiles = locationMediaFiles.filter((file: any) => {
      const hasAngleMetadata = file.metadata?.angle !== undefined;
      const isBackground = !hasAngleMetadata && (
        isBackgroundFile(file) ||
        file.metadata?.source === 'background-generation' ||
        file.metadata?.backgroundType !== undefined
      );
      return isBackground && !file.s3Key?.startsWith('thumbnails/');
    }).slice(0, 3);
    
    console.log('[useLocationReferences] 🔍 Sample angle files (first 3):', sampleAngleFiles.map((f: any) => ({
      s3Key: f.s3Key?.substring(0, 60),
      thumbnailS3Key: f.thumbnailS3Key ? f.thumbnailS3Key.substring(0, 60) : 'MISSING',
      hasThumbnailS3Key: !!f.thumbnailS3Key,
      angle: f.metadata?.angle,
      sourceType: f.metadata?.sourceType,
      backgroundType: f.metadata?.backgroundType
    })));
    
    console.log('[useLocationReferences] 🔍 Sample background files (first 3):', sampleBackgroundFiles.map((f: any) => ({
      s3Key: f.s3Key?.substring(0, 60),
      thumbnailS3Key: f.thumbnailS3Key ? f.thumbnailS3Key.substring(0, 60) : 'MISSING',
      hasThumbnailS3Key: !!f.thumbnailS3Key,
      angle: f.metadata?.angle,
      sourceType: f.metadata?.sourceType,
      backgroundType: f.metadata?.backgroundType
    })));
    
    locationMediaFiles.forEach((file: any) => {
      // Skip thumbnail files themselves (they're not the source files)
      if (file.s3Key?.startsWith('thumbnails/')) return;
      
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
        // Count for debugging
        const hasAngleMetadata = file.metadata?.angle !== undefined;
        const isBackground = !hasAngleMetadata && (
          isBackgroundFile(file) ||
          file.metadata?.source === 'background-generation' ||
          file.metadata?.backgroundType !== undefined
        );
        if (isBackground) {
          backgroundsWithThumbnails++;
        } else {
          anglesWithThumbnails++;
        }
      } else if (file.s3Key) {
        // Count files without thumbnails
        const hasAngleMetadata = file.metadata?.angle !== undefined;
        const isBackground = !hasAngleMetadata && (
          isBackgroundFile(file) ||
          file.metadata?.source === 'background-generation' ||
          file.metadata?.backgroundType !== undefined
        );
        if (isBackground) {
          backgroundsWithoutThumbnails++;
        } else {
          anglesWithoutThumbnails++;
        }
      }
    });
    
    console.log('[useLocationReferences] ThumbnailS3KeyMap stats:', {
      mapSize: map.size,
      anglesWithThumbnails,
      anglesWithoutThumbnails,
      backgroundsWithThumbnails,
      backgroundsWithoutThumbnails,
      totalFiles: locationMediaFiles.length,
      // 🔥 DEBUG: Show sample map entries
      sampleMapEntries: Array.from(map.entries()).slice(0, 3).map(([s3Key, thumbKey]) => ({
        s3Key: s3Key.substring(0, 50),
        thumbKey: thumbKey.substring(0, 50)
      }))
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
          file.metadata?.useCase === 'extreme-closeup' ||
          (file.folderPath && file.folderPath.some((path: string) => path.toLowerCase().includes('background') || path.toLowerCase().includes('extreme close')))
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
              quality: file.metadata?.quality,
              useCase: file.metadata?.useCase // Extreme close-ups: so LocationAngleSelector can group by "Extreme close-ups"
            },
            timeOfDay: file.metadata?.timeOfDay,
            weather: file.metadata?.weather,
            fileId: file.id
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
            weather: file.metadata?.weather,
            fileId: file.id
          });
        }
        // 🔥 FIX: If file doesn't match angle or background criteria, skip it (don't add to either array)
      }
    });

    console.log('[useLocationReferences] Classification results:', {
      locationId,
      angleCount: angleVariations.length,
      backgroundCount: backgrounds.length,
      angles: angleVariations.map(a => ({ 
        angle: a.angle, 
        s3Key: a.s3Key?.substring(0, 50),
        hasThumbnailInMap: locationThumbnailS3KeyMap.has(a.s3Key)
      })),
      backgrounds: backgrounds.map(b => ({ 
        backgroundType: b.backgroundType, 
        s3Key: b.s3Key?.substring(0, 50),
        hasThumbnailInMap: locationThumbnailS3KeyMap.has(b.s3Key)
      }))
    });

    return { angleVariations, backgrounds };
  }, [locationId, locationMediaFiles]);

  // Collect all location thumbnail S3 keys
  // 🔥 FIX: Also collect s3Keys for files without thumbnails (to fetch full images)
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
    
    // 🔥 DEBUG: Log which items have thumbnails vs which don't
    const itemsWithThumbnails = [...angleVariations, ...backgrounds].filter(item => 
      item.s3Key && locationThumbnailS3KeyMap.has(item.s3Key)
    ).length;
    const itemsWithoutThumbnails = [...angleVariations, ...backgrounds].filter(item => 
      item.s3Key && !locationThumbnailS3KeyMap.has(item.s3Key)
    ).length;
    
    console.log('[useLocationReferences] Thumbnail S3 keys collection:', {
      thumbnailKeysCount: keys.length,
      itemsWithThumbnails,
      itemsWithoutThumbnails,
      totalItems: angleVariations.length + backgrounds.length,
      angleVariationsCount: angleVariations.length,
      backgroundsCount: backgrounds.length
    });
    
    return keys;
  }, [angleVariations, backgrounds, locationThumbnailS3KeyMap]);
  
  // 🔥 NEW: Collect s3Keys for files without thumbnails (to fetch full images as fallback)
  const locationFullImageS3Keys = useMemo(() => {
    const keys: string[] = [];
    
    [...angleVariations, ...backgrounds].forEach(item => {
      // Only add if it doesn't have a thumbnail (we'll use full image as fallback)
      if (item.s3Key && !locationThumbnailS3KeyMap.has(item.s3Key)) {
        keys.push(item.s3Key);
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

  // 🔥 FIX: Fetch full images for files without thumbnails (as fallback for display)
  // This ensures angle files without thumbnails can still display
  const { data: locationFullImageUrlsMap = new Map() } = useBulkPresignedUrls(
    locationFullImageS3Keys,
    locationFullImageS3Keys.length > 0
  );
  
  // 🔥 DEBUG: Log URL map sizes
  console.log('[useLocationReferences] URL maps populated:', {
    thumbnailUrlsMapSize: locationThumbnailUrlsMap.size,
    fullImageUrlsMapSize: locationFullImageUrlsMap.size,
    thumbnailS3KeysCount: locationThumbnailS3Keys.length,
    fullImageS3KeysCount: locationFullImageS3Keys.length
  });

  const dropboxUrlMap = useDropboxPreviewUrls(locationMediaFiles, enabled && locationMediaFiles.length > 0);

  // Enrich with Dropbox temp URL when available so panels can display without extra lookup
  const enrichedAngleVariations = useMemo(() =>
    angleVariations.map(a => ({
      ...a,
      imageUrl: (a.fileId && dropboxUrlMap.get(a.fileId)) || a.imageUrl
    })),
    [angleVariations, dropboxUrlMap]
  );
  const enrichedBackgrounds = useMemo(() =>
    backgrounds.map(b => ({
      ...b,
      imageUrl: (b.fileId && dropboxUrlMap.get(b.fileId)) || b.imageUrl
    })),
    [backgrounds, dropboxUrlMap]
  );

  return {
    angleVariations: enrichedAngleVariations,
    backgrounds: enrichedBackgrounds,
    locationThumbnailS3KeyMap,
    locationThumbnailUrlsMap,
    locationFullImageUrlsMap, // 🔥 NEW: Return full image URLs map
    dropboxUrlMap,
    loading: isLoadingFiles
  };
}

