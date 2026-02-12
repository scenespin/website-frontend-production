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

      const response = await fetch(`/api/screenplays/${screenplayId}/scenes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Failed to fetch scenes: ${response.status}`);
      }

      const data = await response.json();
      // API returns { data: { scenes: [...] } } format
      return data.data?.scenes || data.scenes || [];
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
  // fetchAllPages so all scene videos load (no 50-item cap); same as shot board / link library
  const { data: allFiles = [], isLoading: filesLoading } = useMediaFiles(
    screenplayId,
    undefined,
    enabled,
    true, // includeAllFolders: needed because videos are in scene folders
    'scene', // entityType: filter at API level using GSI for efficiency
    undefined,
    false,
    undefined,
    true // fetchAllPages
  );
  const { data: folderTree = [], isLoading: foldersLoading } = useMediaFolderTree(screenplayId, enabled);

  // Organize files by scene
  const sceneVideos = React.useMemo(() => {
    if (!allFiles.length) {
      console.log('[useSceneVideos] 🔍 No files found in media library');
      return [];
    }

    console.log(`[useSceneVideos] 🔍 Processing ${allFiles.length} files from media library`);
    console.log(`[useSceneVideos] 📊 Files breakdown:`, {
      total: allFiles.length,
      withEntityType: allFiles.filter(f => (f as any).entityType || f.metadata?.entityType).length,
      withSceneId: allFiles.filter(f => f.metadata?.sceneId).length,
      videos: allFiles.filter(f => (f as any).mediaFileType === 'video' || f.fileType?.startsWith('video/')).length,
      firstFrames: allFiles.filter(f => f.metadata?.isFirstFrame).length
    });
    
    // 🔥 DEBUG: Log all files with their metadata to help debug missing videos
    console.log(`[useSceneVideos] 📋 All files sample (first 10):`, allFiles.slice(0, 10).map(f => ({
      fileName: f.fileName,
      fileId: f.id,
      fileType: f.fileType,
      mediaFileType: (f as any).mediaFileType,
      entityType: (f as any).entityType,
      metadata: {
        entityType: f.metadata?.entityType,
        sceneId: f.metadata?.sceneId,
        sceneNumber: f.metadata?.sceneNumber,
        shotNumber: f.metadata?.shotNumber,
        isMetadata: f.metadata?.isMetadata,
        isFirstFrame: f.metadata?.isFirstFrame,
        isFullScene: f.metadata?.isFullScene,
        timestamp: f.metadata?.timestamp,
        uploadedAt: f.uploadedAt
      }
    })));

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
        // 🔥 DEBUG: Log files that pass the filter with full details
        console.log(`[useSceneVideos] ✅ Included file:`, {
          fileName: file.fileName,
          fileId: file.id,
          entityType,
          sceneId: metadata.sceneId,
          sceneNumber: metadata.sceneNumber,
          shotNumber: metadata.shotNumber,
          timestamp: metadata.timestamp,
          uploadedAt: file.uploadedAt,
          isVideo,
          s3Key: file.s3Key?.substring(0, 50)
        });
      }
      
      // Include individual shot videos only, exclude metadata files, first frames, and full stitched scenes
      return isSceneFile && isVideo && !metadata.isMetadata && !metadata.isFirstFrame && !isFullScene;
    });

    console.log(`[useSceneVideos] ✅ Filtered to ${sceneFiles.length} scene video files (from ${allFiles.length} total)`);
    
    // 🔥 DEBUG: Log which shot numbers we found
    const shotNumbersFound = new Set(sceneFiles.map(f => f.metadata?.shotNumber).filter(Boolean));
    console.log(`[useSceneVideos] 📊 Shot numbers found:`, Array.from(shotNumbersFound).sort((a, b) => a - b));
    
    // 🔥 DEBUG: Log files by shot number to see what we have
    const filesByShot = new Map<number, typeof sceneFiles>();
    sceneFiles.forEach(file => {
      const shotNum = file.metadata?.shotNumber;
      if (shotNum !== undefined && shotNum !== null) {
        if (!filesByShot.has(shotNum)) {
          filesByShot.set(shotNum, []);
        }
        filesByShot.get(shotNum)!.push(file);
      }
    });
    filesByShot.forEach((files, shotNum) => {
      console.log(`[useSceneVideos] 📊 Shot ${shotNum}: ${files.length} variation(s)`, files.map(f => ({
        fileName: f.fileName,
        fileId: f.id,
        timestamp: f.metadata?.timestamp,
        uploadedAt: f.uploadedAt
      })));
    });

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
          fileId: file.id,
          s3Key: file.s3Key,
          sceneId,
          sceneNumber,
          metadata: {
            entityType: metadata.entityType,
            sceneId: metadata.sceneId,
            sceneNumber: metadata.sceneNumber,
            shotNumber: metadata.shotNumber,
            sceneName: metadata.sceneName,
            allMetadataKeys: Object.keys(metadata)
          },
          topLevelKeys: Object.keys(file)
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
        // 🔥 CRITICAL: Deduplication logic - only skip if it's the EXACT same file
        // Different file.id = different file = always show (even if same shotNumber)
        // This ensures all unique file variations are shown
        const existingShot = scene.videos.shots.find(s => s.video.id === file.id);
        
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
            s3Key: file.s3Key?.substring(0, 50),
            totalShotsForThisShotNumber: scene.videos.shots.filter(s => s.shotNumber === shotNumber).length,
            totalShotsInScene: scene.videos.shots.length
          });
        } else {
          console.log(`[useSceneVideos] ⚠️ Skipping duplicate shot ${shotNumber} (same file.id)`, {
            fileName: file.fileName,
            fileId: file.id,
            existingFileId: existingShot.video.id,
            existingFileName: existingShot.video.fileName,
            sceneId,
            sceneNumber,
            shotNumber,
            timestamp,
            existingTimestamp: existingShot.timestamp,
            totalShotsForThisShotNumber: scene.videos.shots.filter(s => s.shotNumber === shotNumber).length,
            totalShotsInScene: scene.videos.shots.length
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
          timestamps: variations.map(v => v.timestamp).filter(Boolean),
          fileIds: variations.map(v => v.video.id),
          fileNames: variations.map(v => v.video.fileName)
        };
      });
      return {
        sceneNumber: s.sceneNumber,
        sceneId: s.sceneId,
        totalShots: shots.length,
        uniqueShotNumbers: uniqueShotNumbers.size,
        variationsByShot,
        allFileIds: shots.map(shot => shot.video.id),
        allFileNames: shots.map(shot => shot.video.fileName)
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

