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
  // 🔥 FIX: Use includeAllFolders: true to get files from subfolders like "Angles"
  // This matches the pattern used for characters (which need files from outfit folders)
  const { data: allAssetMediaFiles = [], isLoading: isLoadingFiles } = useMediaFiles(
    projectId,
    undefined,
    enabled && propIds.length > 0,
    true, // includeAllFolders: true (needed to get files from Angles subfolders)
    'asset' // entityType only, no entityId (get all asset images)
  );

  // Filter Media Library files by prop IDs and exclude archived/deleted files
  // Media Library is source of truth - only show files that exist and are not archived
  const propMediaFiles = useMemo(() => {
    if (!allAssetMediaFiles || propIds.length === 0) {
      console.log('[PropImageDebug] usePropReferences: No files or propIds', {
        allAssetMediaFilesCount: allAssetMediaFiles?.length || 0,
        propIdsCount: propIds.length,
        propIds: propIds
      });
      return [];
    }
    const filtered = allAssetMediaFiles.filter((file: any) => {
      // Exclude archived/deleted files (Media Library source of truth)
      if (file.isArchived === true || file.metadata?.isArchived === true) {
        return false;
      }
      // Filter by prop IDs
      const fileEntityId = file.metadata?.entityId || file.entityId;
      return propIds.includes(fileEntityId);
    });
    console.log('[PropImageDebug] usePropReferences: Filtered Media Library files (excluding archived)', {
      allAssetMediaFilesCount: allAssetMediaFiles.length,
      propIds: propIds,
      filteredCount: filtered.length,
      archivedCount: allAssetMediaFiles.filter((f: any) => f.isArchived === true || f.metadata?.isArchived === true).length,
      filteredFiles: filtered.map((f: any) => ({
        s3Key: f.s3Key,
        entityId: f.metadata?.entityId || f.entityId,
        createdIn: f.metadata?.createdIn,
        source: f.metadata?.source,
        uploadMethod: f.metadata?.uploadMethod,
        isArchived: f.isArchived || f.metadata?.isArchived,
        metadata: f.metadata,
        fullFile: f
      }))
    });
    return filtered;
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
    // 🔥 FIX: If initialProps is empty but Media Library has files, create props from Media Library
    if (initialProps.length === 0 && propMediaFiles.length > 0) {
      // Group Media Library files by entityId to create props
      const propsByEntityId = new Map<string, any[]>();
      propMediaFiles.forEach((file: any) => {
        const entityId = file.metadata?.entityId || file.entityId;
        if (entityId) {
          if (!propsByEntityId.has(entityId)) {
            propsByEntityId.set(entityId, []);
          }
          propsByEntityId.get(entityId)!.push(file);
        }
      });
      
      // Create props from Media Library files
      const createdProps: PropType[] = [];
      propsByEntityId.forEach((files, entityId) => {
        const { angleReferences, images } = mapMediaFilesToPropStructure(files as any[], entityId);
        
        // 🔥 FIX: Extract name from folder path or metadata, skipping thumbnails
        // Try to find a non-thumbnail file first (thumbnails have generic names like "thumb_angle-side-...")
        const nonThumbnailFile = files.find((f: any) => !f.s3Key?.startsWith('thumbnails/') && !f.fileName?.startsWith('thumb_'));
        const fileToUse = nonThumbnailFile || files[0];
        
        // Try to extract name from folder path (e.g., ['Assets', 'Folder Name', 'Angles'] -> 'Folder Name')
        let name: string | undefined;
        if (fileToUse?.folderPath && Array.isArray(fileToUse.folderPath)) {
          // Find the folder name that's not 'Assets' or 'Angles' (the actual prop/asset folder)
          const assetFolderIndex = fileToUse.folderPath.findIndex((p: string) => p === 'Assets' || p === 'Props');
          if (assetFolderIndex >= 0 && assetFolderIndex < fileToUse.folderPath.length - 1) {
            // Get the folder name after 'Assets' or 'Props'
            name = fileToUse.folderPath[assetFolderIndex + 1];
          }
        }
        
        // Fallback to metadata
        if (!name) {
          name = fileToUse?.metadata?.assetName || 
                 fileToUse?.metadata?.name;
        }
        
        // Final fallback: use filename (but skip if it looks like a thumbnail ID)
        if (!name && fileToUse?.fileName) {
          const fileName = fileToUse.fileName.replace(/\.[^/.]+$/, '');
          // Skip if it looks like a thumbnail ID (starts with "thumb_" or is just a hash)
          if (!fileName.startsWith('thumb_') && fileName.length > 10) {
            name = fileName;
          }
        }
        
        // Last resort
        if (!name) {
          name = 'Unnamed Prop';
        }
        
        createdProps.push({
          id: entityId,
          name: name,
          angleReferences: angleReferences,
          images: images,
          baseReference: images.length > 0 ? { s3Key: images[0].s3Key, imageUrl: images[0].url } : undefined
        });
      });
      
      console.log('[PropImageDebug] usePropReferences: Created props from Media Library files', {
        createdPropsCount: createdProps.length,
        createdProps: createdProps.map(p => ({
          id: p.id,
          name: p.name,
          angleReferencesCount: p.angleReferences?.length || 0,
          imagesCount: p.images?.length || 0
        }))
      });
      
      return createdProps;
    }
    
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
      
      console.log('[PropImageDebug] usePropReferences: Enriching prop', prop.id, prop.name, {
        propMediaFilesForPropCount: propMediaFilesForProp.length,
        propMediaFilesForProp: propMediaFilesForProp.map((f: any) => ({
          s3Key: f.s3Key,
          entityId: f.metadata?.entityId || f.entityId,
          createdIn: f.metadata?.createdIn,
          source: f.metadata?.source,
          uploadMethod: f.metadata?.uploadMethod,
          angle: f.metadata?.angle,
          fullMetadata: f.metadata
        }))
      });
      
      if (propMediaFilesForProp.length === 0) {
        // No Media Library files found for this prop - use empty arrays
        console.log('[PropImageDebug] usePropReferences: No Media Library files for prop', prop.id, '- returning empty arrays');
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
      
      console.log('[PropImageDebug] usePropReferences: Mapped structure for prop', prop.id, {
        angleReferencesCount: mlAngleReferences.length,
        imagesCount: mlImages.length,
        angleReferences: mlAngleReferences.map((ref: any) => ({
          id: ref.id,
          s3Key: ref.s3Key,
          imageUrl: ref.imageUrl,
          label: ref.label
        })),
        images: mlImages.map((img: any) => ({
          url: img.url,
          s3Key: img.s3Key
        }))
      });
      
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

