/**
 * useCharacterReferences Hook
 * 
 * Custom hook for managing character references from Media Library.
 * Handles querying, mapping, and enriching character headshots.
 */

import { useState, useEffect, useMemo } from 'react';
import { useMediaFiles, useBulkPresignedUrls, useDropboxPreviewUrls } from '@/hooks/useMediaLibrary';
import { mapMediaFilesToHeadshots } from '../utils/mediaLibraryMappers';
import { createClientLogger } from '@/utils/clientLogger';

const ENABLE_CHARACTER_REF_DEBUG_LOGS =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_SCENEBUILDER_DIAGNOSTICS === 'true';
const logger = createClientLogger('useCharacterReferences', {
  debugEnabled: ENABLE_CHARACTER_REF_DEBUG_LOGS,
  warnEnabled: ENABLE_CHARACTER_REF_DEBUG_LOGS
});

export interface CharacterHeadshot {
  poseId?: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  priority?: number;
  outfitName?: string;
  /** MediaFile id for Dropbox preview URL lookup */
  fileId?: string;
}

interface UseCharacterReferencesOptions {
  projectId: string;
  characterIds: string[];
  enabled?: boolean;
}

/** Public return type – keep in sync with SceneBuilderContext destructuring (including dropboxUrlMap). */
export interface UseCharacterReferencesReturn {
  characterHeadshots: Record<string, CharacterHeadshot[]>;
  characterThumbnailS3KeyMap: Map<string, string>;
  thumbnailUrlsMap: Map<string, string>;
  fullImageUrlsMap: Map<string, string>;
  dropboxUrlMap: Map<string, string>;
  loading: boolean;
}

/**
 * Hook for managing character references from Media Library.
 * 
 * @param options - Configuration options
 * @returns Character headshots, thumbnail maps, and loading state
 */
export function useCharacterReferences({
  projectId,
  characterIds,
  enabled = true
}: UseCharacterReferencesOptions): UseCharacterReferencesReturn {
  // Query Media Library for character images
  const { data: allCharacterMediaFiles = [], isLoading: isLoadingFiles } = useMediaFiles(
    projectId,
    undefined,
    enabled && characterIds.length > 0,
    true, // includeAllFolders: true (needed to get files from outfit folders)
    'character' // entityType: query all character files
  );

  // 🔍 DIAGNOSTIC: Log what characterIds we're looking for
  useMemo(() => {
    if (characterIds.length > 0 && !isLoadingFiles) {
      if (ENABLE_CHARACTER_REF_DEBUG_LOGS) {
        logger.debug('Character IDs requested:', {
          count: characterIds.length,
          ids: characterIds.slice(0, 5),
          allFilesCount: allCharacterMediaFiles.length,
          isLoading: isLoadingFiles
        });
      }
      
      // Log unique entityIds found in files
      const uniqueEntityIds = new Set<string>();
      allCharacterMediaFiles.forEach((file: any) => {
        const entityId = file.metadata?.entityId || file.entityId;
        if (entityId) uniqueEntityIds.add(entityId);
      });
      if (ENABLE_CHARACTER_REF_DEBUG_LOGS) {
        logger.debug('EntityIds in Media Library files:', {
          uniqueCount: uniqueEntityIds.size,
          sample: Array.from(uniqueEntityIds).slice(0, 5)
        });
      }
      
      // Check which characterIds are NOT found in files
      const missingCharacterIds = characterIds.filter(id => !uniqueEntityIds.has(id));
      if (ENABLE_CHARACTER_REF_DEBUG_LOGS && missingCharacterIds.length > 0) {
        logger.warn('Characters not found in Media Library:', missingCharacterIds);
      }
    }
  }, [characterIds.join(','), allCharacterMediaFiles.length, isLoadingFiles]);

  // Filter Media Library files by character IDs (client-side filtering)
  const characterMediaFiles = useMemo(() => {
    if (!allCharacterMediaFiles || characterIds.length === 0) return [];
    
    const filtered = allCharacterMediaFiles.filter((file: any) => {
      const fileEntityId = file.metadata?.entityId || file.entityId;
      return characterIds.includes(fileEntityId);
    });
    
    // 🔍 DIAGNOSTIC: Log filtered results
    if (ENABLE_CHARACTER_REF_DEBUG_LOGS) {
      logger.debug('Filtered files by characterIds:', {
        inputFiles: allCharacterMediaFiles.length,
        filteredFiles: filtered.length,
        filesWithThumbnails: filtered.filter((f: any) => f.thumbnailS3Key).length,
        sampleFiles: filtered.slice(0, 3).map((f: any) => ({
          s3Key: f.s3Key?.substring(0, 40) + '...',
          entityId: f.metadata?.entityId || f.entityId,
          thumbnailS3Key: f.thumbnailS3Key ? 'YES' : 'NO'
        }))
      });
    }
    
    return filtered;
  }, [allCharacterMediaFiles, characterIds]);

  // Build character thumbnailS3KeyMap from Media Library results
  const characterThumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    characterMediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    
    // 🔍 DIAGNOSTIC: Log thumbnail map
    if (ENABLE_CHARACTER_REF_DEBUG_LOGS) {
      logger.debug('ThumbnailS3KeyMap built:', {
        mapSize: map.size,
        filesWithoutThumbnails: characterMediaFiles.filter((f: any) => !f.thumbnailS3Key).length,
        sample: Array.from(map.entries()).slice(0, 2).map(([s3Key, thumbKey]) => ({
          s3Key: s3Key.substring(0, 40) + '...',
          thumbKey: thumbKey.substring(0, 40) + '...'
        }))
      });
    }
    
    return map;
  }, [characterMediaFiles]);

  // Map Media Library files to character headshot structure
  const characterHeadshotsRaw = useMemo(() => {
    const headshots: Record<string, CharacterHeadshot[]> = {};
    
    characterIds.forEach(characterId => {
      const characterFiles = characterMediaFiles.filter((file: any) => 
        (file.metadata?.entityId || file.entityId) === characterId
      );
      
      if (characterFiles.length > 0) {
        const mappedHeadshots = mapMediaFilesToHeadshots(characterFiles as any[], characterId);
        if (mappedHeadshots.length > 0) {
          headshots[characterId] = mappedHeadshots;
        }
      }
    });
    
    return headshots;
  }, [characterMediaFiles, characterIds]);

  // Collect all headshot thumbnail S3 keys
  // 🔥 FIX: Sort and deduplicate to create stable array reference
  // This prevents React Query from refetching when array order changes
  const headshotThumbnailS3Keys = useMemo(() => {
    const keysSet = new Set<string>();
    Object.values(characterHeadshotsRaw).forEach(headshots => {
      headshots.forEach(headshot => {
        if (headshot.s3Key && characterThumbnailS3KeyMap.has(headshot.s3Key)) {
          const thumbnailS3Key = characterThumbnailS3KeyMap.get(headshot.s3Key);
          if (thumbnailS3Key) {
            keysSet.add(thumbnailS3Key);
          }
        }
      });
    });
    
    // Convert to sorted array for stable reference
    const keys = Array.from(keysSet).sort();
    
    // 🔍 DIAGNOSTIC: Log thumbnail keys being requested (use characterHeadshotsRaw to avoid TDZ – characterHeadshots is defined later)
    if (ENABLE_CHARACTER_REF_DEBUG_LOGS) {
      logger.debug('Thumbnail S3 keys to fetch:', {
        keysCount: keys.length,
        headshotsCount: Object.values(characterHeadshotsRaw).reduce((sum, h) => sum + h.length, 0),
        headshotsWithS3Key: Object.values(characterHeadshotsRaw).reduce((sum, h) => sum + h.filter(x => x.s3Key).length, 0),
        headshotsInMap: Object.values(characterHeadshotsRaw).reduce((sum, h) => sum + h.filter(x => x.s3Key && characterThumbnailS3KeyMap.has(x.s3Key)).length, 0),
        sample: keys.slice(0, 2).map(k => k.substring(0, 40) + '...')
      });
    }
    
    return keys;
  }, [characterHeadshotsRaw, characterThumbnailS3KeyMap]);

  // 🔥 PERFORMANCE FIX: Only fetch thumbnails upfront (for grid display)
  // Full images will be fetched lazily when needed (e.g., when selected for generation)
  // This dramatically reduces initial load time since thumbnails are much smaller
  const { data: thumbnailUrlsMap = new Map() } = useBulkPresignedUrls(
    headshotThumbnailS3Keys,
    headshotThumbnailS3Keys.length > 0
  );

  // 🔍 DIAGNOSTIC: Log final URL map
  useMemo(() => {
    if (ENABLE_CHARACTER_REF_DEBUG_LOGS && thumbnailUrlsMap.size > 0) {
      logger.debug('ThumbnailUrlsMap populated:', {
        urlsCount: thumbnailUrlsMap.size,
        sample: Array.from(thumbnailUrlsMap.entries()).slice(0, 2).map(([key, url]) => ({
          key: key.substring(0, 40) + '...',
          url: url.substring(0, 50) + '...'
        }))
      });
    }
  }, [thumbnailUrlsMap.size]);

  // 🔥 PERFORMANCE FIX: Don't fetch full images upfront - they're only needed for selected references
  // Full images will be fetched on-demand in SceneBuilderPanel when references are selected
  // This prevents loading hundreds of full-size images that may never be used
  const fullImageUrlsMap = new Map<string, string>();

  // Dropbox temporary preview URLs for getMediaFileDisplayUrl / panel display
  const dropboxUrlMap = useDropboxPreviewUrls(characterMediaFiles, enabled && characterMediaFiles.length > 0);

  // Enrich headshots with Dropbox URL when available so selected refs have imageUrl set
  const characterHeadshots = useMemo(() => {
    const result: Record<string, CharacterHeadshot[]> = {};
    for (const [charId, headshots] of Object.entries(characterHeadshotsRaw)) {
      result[charId] = headshots.map(h => ({
        ...h,
        imageUrl: (h.fileId && dropboxUrlMap.get(h.fileId)) || h.imageUrl
      }));
    }
    return result;
  }, [characterHeadshotsRaw, dropboxUrlMap]);

  return {
    characterHeadshots,
    characterThumbnailS3KeyMap,
    thumbnailUrlsMap,
    fullImageUrlsMap,
    dropboxUrlMap,
    loading: isLoadingFiles
  };
}

