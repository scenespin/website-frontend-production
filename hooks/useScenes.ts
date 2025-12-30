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

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

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

      const response = await fetch(`${BACKEND_API_URL}/api/screenplay/${screenplayId}/scenes`, {
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
  const { data: allFiles = [], isLoading: filesLoading } = useMediaFiles(screenplayId, undefined, enabled);
  const { data: folderTree = [], isLoading: foldersLoading } = useMediaFolderTree(screenplayId, enabled);

  // Organize files by scene
  const sceneVideos = React.useMemo(() => {
    if (!allFiles.length) return [];

    const sceneMap = new Map<string, SceneVideo>();

    // Filter scene-related files (videos only, exclude metadata.json, first frames, and full scenes)
    const sceneFiles = allFiles.filter(file => {
      const metadata = (file as any).metadata || {};
      const isSceneFile = metadata.entityType === 'scene' && metadata.sceneId;
      const isVideo = file.fileType === 'video';
      const isFullScene = metadata.isFullScene === true;
      // Include individual shot videos only, exclude metadata files, first frames, and full stitched scenes
      return isSceneFile && isVideo && !metadata.isMetadata && !metadata.isFirstFrame && !isFullScene;
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

      if (!sceneId || !sceneNumber) continue;

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

      // Only process individual shots (full scenes are filtered out above)
      if (shotNumber) {
        // Individual shot
        const existingShot = scene.videos.shots.find(s => s.shotNumber === shotNumber && s.timestamp === timestamp);
        if (!existingShot) {
          scene.videos.shots.push({
            shotNumber,
            video: file,
            metadata,
            timestamp,
          });
        }
      }
    }

    // Sort shots by shot number and timestamp
    for (const scene of sceneMap.values()) {
      scene.videos.shots.sort((a, b) => {
        if (a.shotNumber !== b.shotNumber) {
          return a.shotNumber - b.shotNumber;
        }
        // If same shot number, sort by timestamp (newest first)
        if (a.timestamp && b.timestamp) {
          return b.timestamp.localeCompare(a.timestamp);
        }
        return 0;
      });
    }

    // Convert to array and sort by scene number
    return Array.from(sceneMap.values()).sort((a, b) => a.sceneNumber - b.sceneNumber);
  }, [allFiles]);

  return {
    data: sceneVideos,
    isLoading: filesLoading || foldersLoading,
  };
}

