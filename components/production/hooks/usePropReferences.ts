/**
 * usePropReferences Hook
 * 
 * Custom hook for managing prop references from Media Library.
 * Handles querying, mapping, and enriching prop images (angleReferences/images).
 */

import { useMemo, useEffect } from 'react';
import { useMediaFiles, useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { mapMediaFilesToPropStructure } from '../utils/mediaLibraryMappers';

export interface PropType {
  id: string;
  name: string;
  imageUrl?: string;
  s3Key?: string;
  angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
  images?: Array<{ url: string; s3Key?: string }>;
  baseReference?: { s3Key?: string; imageUrl?: string };
}

interface UsePropReferencesOptions {
  projectId: string;
  propIds: string[];
  enabled?: boolean;
}

interface UsePropReferencesReturn {
  enrichedProps: PropType[];
  propThumbnailS3KeyMap: Map<string, string>;
  propThumbnailUrlsMap: Map<string, string>;
  loading: boolean;
}

/**
 * Hook for managing prop references from Media Library.
 * 
 * @param options - Configuration options
 * @param initialProps - Initial props from database (will be enriched with Media Library data)
 * @returns Enriched props with Media Library data, thumbnail maps, and loading state
 */
export function usePropReferences(
  { projectId, propIds, enabled = true }: UsePropReferencesOptions,
  initialProps: PropType[]
): UsePropReferencesReturn {
  // Query Media Library for all asset images (single query for efficiency)
  const { data: allAssetMediaFiles = [], isLoading: isLoadingFiles } = useMediaFiles(
    projectId,
    undefined,
    enabled && propIds.length > 0,
    false,
    'asset' // entityType only, no entityId (get all asset images)
  );

  // Filter Media Library files by prop IDs
  const propMediaFiles = useMemo(() => {
    if (!allAssetMediaFiles || propIds.length === 0) return [];
    return allAssetMediaFiles.filter((file: any) => 
      propIds.includes(file.metadata?.entityId || file.entityId)
    );
  }, [allAssetMediaFiles, propIds]);

  // Build thumbnailS3KeyMap from Media Library results
  const propThumbnailS3KeyMap = useMemo(() => {
    const map = new Map<string, string>();
    propMediaFiles.forEach((file: any) => {
      if (file.s3Key && file.thumbnailS3Key) {
        map.set(file.s3Key, file.thumbnailS3Key);
      }
    });
    return map;
  }, [propMediaFiles]);

  // Enrich props with Media Library data (Media Library is source of truth)
  const enrichedProps = useMemo(() => {
    if (initialProps.length === 0 || propMediaFiles.length === 0) {
      // No Media Library files found - use empty arrays (don't use old database references)
      return initialProps.map(prop => ({
        ...prop,
        angleReferences: [], // Media Library is source of truth - if no files, no angleReferences
        images: [], // Media Library is source of truth - if no files, no images
        baseReference: prop.baseReference // Preserve baseReference for fallback when all images are deleted
      }));
    }

    return initialProps.map(prop => {
      const propMediaFilesForProp = propMediaFiles.filter((file: any) => 
        (file.metadata?.entityId || file.entityId) === prop.id
      );
      
      if (propMediaFilesForProp.length === 0) {
        // No Media Library files found for this prop - use empty arrays
        return {
          ...prop,
          angleReferences: [],
          images: [],
          baseReference: prop.baseReference
        };
      }
      
      const { angleReferences: mlAngleReferences, images: mlImages } = mapMediaFilesToPropStructure(
        propMediaFilesForProp as any[],
        prop.id
      );
      
      // Use Media Library data as source of truth - only use what exists in Media Library
      return {
        ...prop,
        angleReferences: mlAngleReferences, // Only Media Library files
        images: mlImages, // Only Media Library files
        baseReference: prop.baseReference // Preserve baseReference for fallback when all images are deleted
      };
    });
  }, [initialProps, propMediaFiles]);

  // Collect all prop image thumbnail S3 keys
  const propThumbnailS3Keys = useMemo(() => {
    if (!propThumbnailS3KeyMap) return [];
    const keys: string[] = [];
    
    enrichedProps.forEach(prop => {
      // Add angleReferences thumbnail s3Keys
      if (prop.angleReferences) {
        prop.angleReferences.forEach(ref => {
          if (ref.s3Key && propThumbnailS3KeyMap.has(ref.s3Key)) {
            const thumbnailS3Key = propThumbnailS3KeyMap.get(ref.s3Key);
            if (thumbnailS3Key) {
              keys.push(thumbnailS3Key);
            }
          }
        });
      }
      
      // Add images[] thumbnail s3Keys
      if (prop.images) {
        prop.images.forEach(img => {
          if (img.s3Key && propThumbnailS3KeyMap.has(img.s3Key)) {
            const thumbnailS3Key = propThumbnailS3KeyMap.get(img.s3Key);
            if (thumbnailS3Key) {
              keys.push(thumbnailS3Key);
            }
          }
        });
      }
    });
    
    return keys;
  }, [enrichedProps, propThumbnailS3KeyMap]);

  // Fetch thumbnail URLs for all prop images
  const { data: propThumbnailUrlsMap = new Map() } = useBulkPresignedUrls(
    propThumbnailS3Keys,
    propThumbnailS3Keys.length > 0
  );

  return {
    enrichedProps,
    propThumbnailS3KeyMap,
    propThumbnailUrlsMap,
    loading: isLoadingFiles
  };
}

