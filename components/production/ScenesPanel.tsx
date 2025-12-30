'use client';

/**
 * Scenes Panel - Storyboard View
 * 
 * Displays scene videos in a storyboard-style layout.
 * Shows full stitched scenes and individual shots organized by scene number.
 * 
 * Feature 0170: Media Versioning & Scene Organization
 */

import React, { useState, useMemo } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useScenes, useSceneVideos, type SceneVideo } from '@/hooks/useScenes';
import { useBulkPresignedUrls } from '@/hooks/useMediaLibrary';
import { Film, Loader2, Play, Info, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { SceneCard } from './SceneCard';
import { SceneMetadataModal } from './SceneMetadataModal';

interface ScenesPanelProps {
  className?: string;
}

export function ScenesPanel({ className = '' }: ScenesPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;

  // Fetch scenes and scene videos
  const { data: scenes = [], isLoading: scenesLoading } = useScenes(screenplayId || '', !!screenplayId);
  const { data: sceneVideos = [], isLoading: videosLoading } = useSceneVideos(screenplayId || '', !!screenplayId);

  // Merge scene data with video data
  const scenesWithVideos = useMemo(() => {
    const sceneMap = new Map<number, any>();
    
    // Add all scenes from screenplay
    scenes.forEach(scene => {
      sceneMap.set(scene.number, {
        ...scene,
        videos: null,
      });
    });

    // Add video data
    sceneVideos.forEach(sceneVideo => {
      const existing = sceneMap.get(sceneVideo.sceneNumber);
      if (existing) {
        existing.videos = sceneVideo.videos;
      } else {
        // Scene has videos but not in screenplay (edge case)
        sceneMap.set(sceneVideo.sceneNumber, {
          id: sceneVideo.sceneId,
          number: sceneVideo.sceneNumber,
          heading: sceneVideo.sceneHeading,
          videos: sceneVideo.videos,
        });
      }
    });

    return Array.from(sceneMap.values())
      .sort((a, b) => a.number - b.number);
  }, [scenes, sceneVideos]);

  // Collect all S3 keys for bulk presigned URL generation
  const allS3Keys = useMemo(() => {
    const keys: string[] = [];
    sceneVideos.forEach(sceneVideo => {
      if (sceneVideo.videos.fullScene?.video.s3Key) {
        keys.push(sceneVideo.videos.fullScene.video.s3Key);
      }
      sceneVideo.videos.shots.forEach(shot => {
        if (shot.video.s3Key) {
          keys.push(shot.video.s3Key);
        }
        if (shot.firstFrame?.s3Key) {
          keys.push(shot.firstFrame.s3Key);
        }
      });
    });
    return keys;
  }, [sceneVideos]);

  const { data: presignedUrls } = useBulkPresignedUrls(
    allS3Keys,
    allS3Keys.length > 0
  );

  const isLoading = scenesLoading || videosLoading;

  // State for metadata modal
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  if (!screenplayId) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading screenplay...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Content */}
      {scenesWithVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-5 text-center">
          <Film className="w-10 h-10 text-[#808080] mb-2" />
          <p className="text-sm font-medium text-[#B3B3B3] mb-1">No Scenes Yet</p>
          <p className="text-xs text-[#808080]">
            Generate scenes using the Scene Builder or Workflows tab.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4 md:space-y-5">
            {scenesWithVideos.map((scene) => (
              <SceneCard
                key={scene.id || scene.number}
                scene={scene}
                presignedUrls={presignedUrls as Map<string, string> | undefined}
                screenplayId={screenplayId}
                onViewMetadata={(metadata) => {
                  setSelectedMetadata(metadata);
                  setShowMetadataModal(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && selectedMetadata && (
        <SceneMetadataModal
          metadata={selectedMetadata}
          onClose={() => {
            setShowMetadataModal(false);
            setSelectedMetadata(null);
          }}
        />
      )}
    </div>
  );
}

