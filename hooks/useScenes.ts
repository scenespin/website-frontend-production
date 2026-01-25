/**
 * Scenes Data Hooks
 * 
 * React Query hooks for fetching scene data and organizing scene videos.
 * Used by ScenesPanel component.
 * 
 * Feature 0170: Media Versioning & Scene Organization
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import type { MediaFile } from '@/types/media';
import { useMediaFiles, useMediaFolderTree } from './useMediaLibrary';

/**
 * Scene video data structure
 * Note: Full stitched scenes are no longer generated automatically.
 * Users can create stitched videos on-demand via the playlist player.
 */
export interface SceneVideo {
  sceneId: string;
  sceneNumber: number;
  sceneHeading: string;
  videos: {
    shots: Array<{
      shotNumber: number;
      video: MediaFile;
      metadata?: any;
      timestamp?: string;
      isNewest?: boolean; // Mark newest variation of each shot number
    }>;
  };
}

/**
 * Hook to fetch all scenes for a screenplay
 */
export function useScenes(screenplayId: string, enabled: boolean = true) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['scenes', screenplayId],
    queryFn: async () => {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/screenplay/${screenplayId}/scenes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to fetch scenes: ${response.status}`);
      }

      const data = await response.json();
      return data.scenes || [];
    },
    enabled: enabled && !!screenplayId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch and organize scene videos from Media Library
 * Groups videos by scene and organizes by timestamp
 */
export function useSceneVideos(screenplayId: string, enabled: boolean = true) {
  // 🔥 SCALABLE FIX: Query by entityType='scene' to use GSI for efficient database queries
  // This fetches only scene videos (not all files), reducing bandwidth and improving performance
  // The API uses entityType-entityId-index GSI which is much faster than scanning all files
  // includeAllFolders:true ensures videos in scene folders are included
  const { data: allFiles = [], isLoading: filesLoading } = useMediaFiles(
    screenplayId, 
    undefined, 
    enabled, 
    true, // includeAllFolders: needed because videos are in scene folders
    'scene' // entityType: filter at API level using GSI for efficiency
  );
  const { data: folderTree = [], isLoading: foldersLoading } = useMediaFolderTree(screenplayId, enabled);

  // Organize files by scene
  const sceneVideos = React.useMemo(() => {
    if (!allFiles.length) {
      console.log('[useSceneVideos] 🔍 No files found in media library');
      return [];
    }

    console.log(`[useSceneVideos] 🔍 Processing ${allFiles.length} files from media library`);

    const sceneMap = new Map<string, SceneVideo>();

    // Filter scene-related files (videos only, exclude metadata.json, first frames, and full scenes)
    const sceneFiles = allFiles.filter(file => {
      const metadata = (file as any).metadata || {};
      // 🔥 FIX: Check both top-level entityType and metadata.entityType (backend stores in both places)
      const entityType = (file as any).entityType || metadata.entityType;
      const isSceneFile = entityType === 'scene' && metadata.sceneId;
      // 🔥 FIX: Check both mediaFileType (simplified) and fileType (MIME type) for video detection
      const isVideo = (file as any).mediaFileType === 'video' || 
                      file.fileType === 'video' || 
                      (typeof file.fileType === 'string' && file.fileType.startsWith('video/'));
      const isFullScene = metadata.isFullScene === true;
      
      // 🔥 DEBUG: Log why files are filtered out with explicit values
      if (!isSceneFile) {
        console.log(`[useSceneVideos] ⚠️ File filtered out (not scene file):`, {
          fileName: file.fileName,
          topLevelEntityType: (file as any).entityType || 'MISSING',
          metadataEntityType: metadata.entityType || 'MISSING',
          sceneId: metadata.sceneId || 'MISSING',
          hasEntityType: !!entityType,
          hasSceneId: !!metadata.sceneId,
          metadataKeys: Object.keys(metadata),
          allFileKeys: Object.keys(file)
        });
      } else if (!isVideo) {
        console.log(`[useSceneVideos] ⚠️ File filtered out (not video):`, {
          fileName: file.fileName,
          fileType: file.fileType,
          mediaFileType: (file as any).mediaFileType,
          isVideo: isVideo
        });
      } else if (metadata.isMetadata || metadata.isFirstFrame || isFullScene) {
        console.log(`[useSceneVideos] ⚠️ File filtered out (metadata/firstFrame/fullScene):`, {
          fileName: file.fileName,
          isMetadata: metadata.isMetadata,
          isFirstFrame: metadata.isFirstFrame,
          isFullScene: isFullScene
        });
      } else {
        // 🔥 DEBUG: Log files that pass the filter
        console.log(`[useSceneVideos] ✅ Included file:`, {
          fileName: file.fileName,
          entityType,
          sceneId: metadata.sceneId,
          sceneNumber: metadata.sceneNumber,
          shotNumber: metadata.shotNumber,
          isVideo
        });
      }
      
      // Include individual shot videos only, exclude metadata files, first frames, and full stitched scenes
      return isSceneFile && isVideo && !metadata.isMetadata && !metadata.isFirstFrame && !isFullScene;
    });

    console.log(`[useSceneVideos] ✅ Filtered to ${sceneFiles.length} scene video files (from ${allFiles.length} total)`);

    // Group by scene
    for (const file of sceneFiles) {
      const metadata = (file as any).metadata || {};
      const sceneId = metadata.sceneId;
      const sceneNumber = metadata.sceneNumber;
      const sceneHeading = metadata.sceneName || `Scene ${sceneNumber}`;
      const shotNumber = metadata.shotNumber;
      const isFullScene = metadata.isFullScene === true;
      const timestamp = metadata.timestamp;

      // 🔥 DEBUG: Log files missing required metadata
      if (!sceneId || !sceneNumber) {
        console.warn(`[useSceneVideos] ⚠️ Skipping file (missing sceneId or sceneNumber):`, {
          fileName: file.fileName,
          sceneId,
          sceneNumber,
          metadata: {
            entityType: metadata.entityType,
            sceneId: metadata.sceneId,
            sceneNumber: metadata.sceneNumber,
            shotNumber: metadata.shotNumber,
            sceneName: metadata.sceneName,
            allMetadataKeys: Object.keys(metadata)
          }
        });
        continue;
      }

      const key = `${sceneId}-${sceneNumber}`;
      if (!sceneMap.has(key)) {
        sceneMap.set(key, {
          sceneId,
          sceneNumber,
          sceneHeading,
          videos: {
            shots: [],
          },
        });
      }

      const scene = sceneMap.get(key)!;

      // 🔥 CRITICAL: Only process individual shots (full scenes are filtered out above)
      // shotNumber is required - videos without shotNumber won't appear in storyboard
      // 🔥 DEBUG: Log shotNumber status for troubleshooting
      if (shotNumber === undefined || shotNumber === null) {
        console.warn(`[useSceneVideos] ⚠️ File missing shotNumber (WILL BE SKIPPED - won't appear in storyboard):`, {
          fileName: file.fileName,
          fileId: file.id,
          sceneId,
          sceneNumber,
          shotNumber,
          shotNumberType: typeof shotNumber,
          metadataKeys: Object.keys(metadata),
          allMetadata: metadata,
          topLevelKeys: Object.keys(file)
        });
      }
      
      if (shotNumber !== undefined && shotNumber !== null) {
        // Individual shot
        // 🔥 FIX: Check for duplicate by file ID (not just shotNumber + timestamp)
        // This ensures all variations are shown, even if they have the same timestamp
        const existingShot = scene.videos.shots.find(s => 
          s.video.id === file.id || 
          (s.shotNumber === shotNumber && s.timestamp === timestamp && s.video.s3Key === file.s3Key)
        );
        if (!existingShot) {
          scene.videos.shots.push({
            shotNumber,
            video: file,
            metadata,
            timestamp,
          });
          console.log(`[useSceneVideos] ✅ Added shot ${shotNumber} to scene ${sceneNumber}`, {
            fileName: file.fileName,
            fileId: file.id,
            sceneId,
            sceneNumber,
            shotNumber,
            timestamp,
            totalShotsForThisShotNumber: scene.videos.shots.filter(s => s.shotNumber === shotNumber).length + 1
          });
        } else {
          console.log(`[useSceneVideos] ⚠️ Skipping duplicate shot ${shotNumber}`, {
            fileName: file.fileName,
            fileId: file.id,
            existingFileId: existingShot.video.id,
            sceneId,
            sceneNumber,
            shotNumber,
            timestamp
          });
        }
      } else {
        // 🔥 WARNING: Log files missing shotNumber (they won't appear in storyboard)
        console.warn(`[useSceneVideos] ⚠️ File missing shotNumber (WILL BE SKIPPED - won't appear in storyboard):`, {
          fileName: file.fileName,
          sceneId,
          sceneNumber,
          shotNumber,
          shotNumberType: typeof shotNumber,
          metadataKeys: Object.keys(metadata),
          allMetadata: metadata
        });
      }
    }

    // Sort shots by shot number and timestamp
    // Also mark the newest variation of each shot number
    for (const scene of sceneMap.values()) {
      scene.videos.shots.sort((a, b) => {
        if (a.shotNumber !== b.shotNumber) {
          return a.shotNumber - b.shotNumber;
        }
        // If same shot number, sort by timestamp (newest first)
        if (a.timestamp && b.timestamp) {
          return b.timestamp.localeCompare(a.timestamp);
        }
        // Fallback: use uploadedAt if timestamp not available
        if (a.video.uploadedAt && b.video.uploadedAt) {
          return new Date(b.video.uploadedAt).getTime() - new Date(a.video.uploadedAt).getTime();
        }
        return 0;
      });
      
      // Mark the newest variation of each shot number
      const shotNumberGroups = new Map<number, typeof scene.videos.shots>();
      scene.videos.shots.forEach(shot => {
        if (!shotNumberGroups.has(shot.shotNumber)) {
          shotNumberGroups.set(shot.shotNumber, []);
        }
        shotNumberGroups.get(shot.shotNumber)!.push(shot);
      });
      
      // Mark first (newest) variation of each shot as "isNewest"
      shotNumberGroups.forEach((variations, shotNumber) => {
        if (variations.length > 0) {
          variations[0].isNewest = true;
          // Also add to metadata for easy access
          if (!variations[0].metadata) {
            variations[0].metadata = {};
          }
          variations[0].metadata.isNewestVariation = true;
        }
      });
    }

    // Convert to array and sort by scene number
    const result = Array.from(sceneMap.values()).sort((a, b) => a.sceneNumber - b.sceneNumber);
    
    // 🔥 DEBUG: Calculate shot variation statistics
    const shotStats = result.map(s => {
      const shots = s.videos.shots;
      const uniqueShotNumbers = new Set(shots.map(shot => shot.shotNumber));
      const variationsByShot = Array.from(uniqueShotNumbers).map(shotNum => {
        const variations = shots.filter(shot => shot.shotNumber === shotNum);
        return {
          shotNumber: shotNum,
          variationCount: variations.length,
          timestamps: variations.map(v => v.timestamp).filter(Boolean)
        };
      });
      return {
        sceneNumber: s.sceneNumber,
        sceneId: s.sceneId,
        totalShots: shots.length,
        uniqueShotNumbers: uniqueShotNumbers.size,
        variationsByShot
      };
    });

    console.log(`[useSceneVideos] 📊 Final result:`, {
      totalScenes: result.length,
      scenesWithVideos: result.filter(s => s.videos.shots.length > 0).length,
      totalShots: result.reduce((sum, s) => sum + s.videos.shots.length, 0),
      sceneDetails: shotStats
    });
    
    return result;
  }, [allFiles]);

  return {
    data: sceneVideos,
    isLoading: filesLoading || foldersLoading,
  };
}

