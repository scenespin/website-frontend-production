/**
 * useCharacterReferences Hook
 * 
 * Custom hook for managing character references from Media Library.
 * Handles querying, mapping, and enriching character headshots.
 */

import { useState, useEffect, useMemo } from 'react';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { mapMediaFilesToHeadshots } from '../utils/mediaLibraryMappers';

export interface CharacterHeadshot {
  poseId?: string;
  s3Key: string;
  imageUrl: string;
  label?: string;
  priority?: number;
  outfitName?: string;
}

interface UseCharacterReferencesOptions {
  projectId: string;
  characterIds: string[];
  enabled?: boolean;
}

interface UseCharacterReferencesReturn {
  characterHeadshots: Record<string, CharacterHeadshot[]>;
  characterThumbnailS3KeyMap: Map<string, string>;
  thumbnailUrlsMap: Map<string, string>;
  fullImageUrlsMap: Map<string, string>;
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

  // Filter Media Library files by character IDs (client-side filtering)
  const characterMediaFiles = useMemo(() => {
    if (!allCharacterMediaFiles || characterIds.length === 0) return [];
    
    return allCharacterMediaFiles.filter((file: any) => {
      const fileEntityId = file.metadata?.entityId || file.entityId;
      return characterIds.includes(fileEntityId);
    });
  }, [allCharacterMediaFiles, characterIds]);

  // Build character thumbnailS3KeyMap from Media Library results
  const characterThumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    characterMediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    return map;
  }, [characterMediaFiles]);

  // Map Media Library files to character headshot structure
  const characterHeadshots = useMemo(() => {
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
  const headshotThumbnailS3Keys = useMemo(() => {
    const keys: string[] = [];
    Object.values(characterHeadshots).forEach(headshots => {
      headshots.forEach(headshot => {
        if (headshot.s3Key && characterThumbnailS3KeyMap.has(headshot.s3Key)) {
          const thumbnailS3Key = characterThumbnailS3KeyMap.get(headshot.s3Key);
          if (thumbnailS3Key) {
            keys.push(thumbnailS3Key);
          }
        }
      });
    });
    return keys;
  }, [characterHeadshots, characterThumbnailS3KeyMap]);

  // 🔥 PERFORMANCE FIX: Only fetch thumbnails upfront (for grid display)
  // Full images will be fetched lazily when needed (e.g., when selected for generation)
  // This dramatically reduces initial load time since thumbnails are much smaller
  const { data: thumbnailUrlsMap = new Map() } = useBulkPresignedUrls(
    headshotThumbnailS3Keys,
    headshotThumbnailS3Keys.length > 0
  );

  // 🔥 PERFORMANCE FIX: Don't fetch full images upfront - they're only needed for selected references
  // Full images will be fetched on-demand in SceneBuilderPanel when references are selected
  // This prevents loading hundreds of full-size images that may never be used
  const fullImageUrlsMap = new Map<string, string>();

  return {
    characterHeadshots,
    characterThumbnailS3KeyMap,
    thumbnailUrlsMap,
    fullImageUrlsMap,
    loading: isLoadingFiles
  };
}

