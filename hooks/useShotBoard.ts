/**
 * Shot Board Hook
 * 
 * React Query hook for fetching and organizing shot data for the Shot Board.
 * Groups first frames and videos by scene and shot, with support for multiple variations per shot.
 * 
 * Feature: Shot Board - replaces old Storyboard/ScenesPanel
 */

'use client';

import React from 'react';
import { useMediaFiles, useBulkPresignedUrls } from './useMediaLibrary';
import type { MediaFile } from '@/types/media';

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single variation of a shot (one generation attempt)
 * Each time you generate a shot, you create a new variation with a unique timestamp
 */
export interface ShotVariation {
  timestamp: string;
  firstFrame: {
    fileId: string;
    s3Key: string;
    fileName: string;
  };
  video?: {
    fileId: string;
    s3Key: string;
    fileName: string;
    metadata?: Record<string, any>;
  };
}

/**
 * A single shot slot within a scene
 * May have multiple variations from different generation runs
 */
export interface ShotBoardShot {
  shotNumber: number;
  sceneId: string;
  sceneNumber: number;
  variations: ShotVariation[]; // Sorted by timestamp, newest first
}

/**
 * A scene containing multiple shots
 */
export interface ShotBoardScene {
  sceneId: string;
  sceneNumber: number;
  sceneHeading: string;
  shots: ShotBoardShot[]; // Sorted by shotNumber
}

/**
 * Return type for useShotBoard hook
 */
export interface UseShotBoardResult {
  scenes: ShotBoardScene[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  // All S3 keys for bulk presigned URL generation
  allS3Keys: string[];
  // Presigned URLs map (s3Key -> presignedUrl)
  presignedUrls: Map<string, string>;
  presignedUrlsLoading: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to fetch and organize shot data for the Shot Board
 * 
 * @param screenplayId - The screenplay ID to fetch shots for
 * @param enabled - Whether to enable the query
 * @returns Shot board data organized by scene and shot
 */
export function useShotBoard(screenplayId: string, enabled: boolean = true): UseShotBoardResult {
  // Fetch all scene-related files from Media Library
  // entityType='scene' uses GSI for efficient querying
  // includeAllFolders=true ensures files in scene folders are included
  const { 
    data: allFiles = [], 
    isLoading: filesLoading, 
    error: filesError,
    refetch 
  } = useMediaFiles(
    screenplayId,
    undefined,
    enabled && !!screenplayId,
    true, // includeAllFolders
    'scene' // entityType filter
  );

  // Process files into shot board structure
  const { scenes, allS3Keys } = React.useMemo(() => {
    if (!allFiles.length) {
      return { scenes: [], allS3Keys: [] };
    }

    // Separate first frames and videos
    const firstFrames: MediaFile[] = [];
    const videos: MediaFile[] = [];

    for (const file of allFiles) {
      const metadata = (file as any).metadata || {};
      const entityType = (file as any).entityType || metadata.entityType;
      
      // Skip non-scene files
      if (entityType !== 'scene') continue;
      
      // Skip metadata.json files
      if (metadata.isMetadata) continue;
      
      // Skip full scene files (stitched videos)
      if (metadata.isFullScene) continue;
      
      // Must have shotNumber to be useful
      const shotNumber = metadata.shotNumber;
      if (shotNumber === undefined || shotNumber === null) continue;
      
      // Must have sceneId and sceneNumber
      if (!metadata.sceneId || metadata.sceneNumber === undefined) continue;

      if (metadata.isFirstFrame) {
        firstFrames.push(file);
      } else {
        // Check if it's a video
        const isVideo = (file as any).mediaFileType === 'video' || 
                        file.fileType === 'video' || 
                        (typeof file.fileType === 'string' && file.fileType.startsWith('video/'));
        if (isVideo) {
          videos.push(file);
        }
      }
    }

    // Build a map of videos by sceneId + shotNumber + timestamp for quick lookup
    const videoMap = new Map<string, MediaFile>();
    for (const video of videos) {
      const metadata = (video as any).metadata || {};
      const key = `${metadata.sceneId}-${metadata.shotNumber}-${metadata.timestamp}`;
      videoMap.set(key, video);
    }

    // Group first frames by scene, then by shot
    const sceneMap = new Map<string, {
      sceneId: string;
      sceneNumber: number;
      sceneHeading: string;
      shotsMap: Map<number, ShotVariation[]>;
    }>();

    for (const firstFrame of firstFrames) {
      const metadata = (firstFrame as any).metadata || {};
      const sceneId = metadata.sceneId;
      const sceneNumber = metadata.sceneNumber;
      const shotNumber = metadata.shotNumber;
      const timestamp = metadata.timestamp || '';
      const sceneHeading = metadata.sceneName || `Scene ${sceneNumber}`;

      // Get or create scene entry
      const sceneKey = `${sceneId}-${sceneNumber}`;
      if (!sceneMap.has(sceneKey)) {
        sceneMap.set(sceneKey, {
          sceneId,
          sceneNumber,
          sceneHeading,
          shotsMap: new Map()
        });
      }
      const scene = sceneMap.get(sceneKey)!;

      // Get or create shot entry
      if (!scene.shotsMap.has(shotNumber)) {
        scene.shotsMap.set(shotNumber, []);
      }
      const variations = scene.shotsMap.get(shotNumber)!;

      // Find matching video (same scene, shot, timestamp)
      const videoKey = `${sceneId}-${shotNumber}-${timestamp}`;
      const matchingVideo = videoMap.get(videoKey);

      // Create variation
      const variation: ShotVariation = {
        timestamp,
        firstFrame: {
          fileId: firstFrame.id || '',
          s3Key: firstFrame.s3Key || '',
          fileName: firstFrame.fileName || ''
        }
      };

      if (matchingVideo) {
        const videoMetadata = (matchingVideo as any).metadata || {};
        variation.video = {
          fileId: matchingVideo.id || '',
          s3Key: matchingVideo.s3Key || '',
          fileName: matchingVideo.fileName || '',
          metadata: videoMetadata
        };
      }

      variations.push(variation);
    }

    // Convert to final structure and sort
    const scenesResult: ShotBoardScene[] = [];
    const s3Keys: string[] = [];

    for (const [, sceneData] of sceneMap) {
      const shots: ShotBoardShot[] = [];

      for (const [shotNumber, variations] of sceneData.shotsMap) {
        // Sort variations by timestamp (newest first)
        variations.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        // Collect S3 keys for presigned URLs
        for (const variation of variations) {
          if (variation.firstFrame.s3Key) {
            s3Keys.push(variation.firstFrame.s3Key);
          }
          if (variation.video?.s3Key) {
            s3Keys.push(variation.video.s3Key);
          }
        }

        shots.push({
          shotNumber,
          sceneId: sceneData.sceneId,
          sceneNumber: sceneData.sceneNumber,
          variations
        });
      }

      // Sort shots by shotNumber
      shots.sort((a, b) => a.shotNumber - b.shotNumber);

      scenesResult.push({
        sceneId: sceneData.sceneId,
        sceneNumber: sceneData.sceneNumber,
        sceneHeading: sceneData.sceneHeading,
        shots
      });
    }

    // Sort scenes by sceneNumber
    scenesResult.sort((a, b) => a.sceneNumber - b.sceneNumber);

    return { scenes: scenesResult, allS3Keys: s3Keys };
  }, [allFiles]);

  // Fetch presigned URLs for all S3 keys
  const { data: presignedUrlsData, isLoading: presignedUrlsLoading } = useBulkPresignedUrls(
    allS3Keys,
    allS3Keys.length > 0
  );

  // Convert presigned URLs to Map
  const presignedUrls = React.useMemo(() => {
    if (!presignedUrlsData) return new Map<string, string>();
    return new Map(Object.entries(presignedUrlsData));
  }, [presignedUrlsData]);

  return {
    scenes,
    isLoading: filesLoading,
    error: filesError || null,
    refetch,
    allS3Keys,
    presignedUrls,
    presignedUrlsLoading
  };
}

/**
 * Helper to get total shot count across all scenes
 */
export function getTotalShotCount(scenes: ShotBoardScene[]): number {
  return scenes.reduce((total, scene) => total + scene.shots.length, 0);
}

/**
 * Helper to get total variation count across all shots
 */
export function getTotalVariationCount(scenes: ShotBoardScene[]): number {
  return scenes.reduce((total, scene) => 
    total + scene.shots.reduce((shotTotal, shot) => 
      shotTotal + shot.variations.length, 0
    ), 0
  );
}
