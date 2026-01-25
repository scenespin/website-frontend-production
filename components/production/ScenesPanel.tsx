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
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  // Fetch scenes and scene videos
  const { data: scenes = [], isLoading: scenesLoading } = useScenes(screenplayId || '', !!screenplayId);
  const { data: sceneVideos = [], isLoading: videosLoading } = useSceneVideos(screenplayId || '', !!screenplayId);

  // 🔥 FIX: Manual refresh function to force refetch of scene videos
  const handleRefresh = () => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      queryClient.invalidateQueries({ queryKey: ['scenes', screenplayId] });
      toast.success('Refreshing storyboard...');
    }
  };

  // 🔥 DEBUG: Log data for troubleshooting
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always expose debug function (even if data not loaded yet)
      (window as any).debugStoryboard = () => {
        console.log('=== STORYBOARD DEBUG ===');
        console.log('Screenplay ID:', screenplayId);
        console.log('Scenes:', scenes);
        console.log('Scene Videos:', sceneVideos);
        console.log('Scenes with videos:', sceneVideos.filter(sv => sv.videos.shots.length > 0));
        console.log('Is Loading:', videosLoading || scenesLoading);
        return { screenplayId, scenes, sceneVideos, isLoading: videosLoading || scenesLoading };
      };
    }
    
    if (!videosLoading && !scenesLoading && screenplayId) {
      console.log('[ScenesPanel] 📊 Storyboard Data:', {
        screenplayId,
        scenesCount: scenes.length,
        sceneVideosCount: sceneVideos.length,
        scenesWithVideos: sceneVideos.filter(sv => sv.videos.shots.length > 0).length,
        sceneVideosDetails: sceneVideos.map(sv => ({
          sceneId: sv.sceneId,
          sceneNumber: sv.sceneNumber,
          sceneHeading: sv.sceneHeading,
          shotsCount: sv.videos.shots.length,
          shots: sv.videos.shots.map(s => ({
            shotNumber: s.shotNumber,
            fileName: s.video.fileName,
            hasS3Key: !!s.video.s3Key,
            metadata: s.metadata
          }))
        }))
      });
      console.log('[ScenesPanel] 🔧 Debug function available: window.debugStoryboard()');
    }
  }, [screenplayId, scenes, sceneVideos, videosLoading, scenesLoading]);

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

    const result = Array.from(sceneMap.values())
      .sort((a, b) => a.number - b.number);
    
    // 🔥 DEBUG: Log merged scenes
    console.log('[ScenesPanel] 🔍 Merged scenes:', {
      totalScenes: scenes.length,
      totalSceneVideos: sceneVideos.length,
      mergedCount: result.length,
      sceneNumbers: result.map(s => s.number),
      scenesWithVideos: result.filter(s => s.videos?.shots?.length > 0).length
    });
    
    return result;
  }, [scenes, sceneVideos]);

  // Collect all S3 keys for bulk presigned URL generation
  const allS3Keys = useMemo(() => {
    const keys: string[] = [];
    sceneVideos.forEach(sceneVideo => {
      // Note: fullScene is no longer part of SceneVideo structure (stitched videos are on-demand)
      sceneVideo.videos.shots.forEach(shot => {
        if (shot.video.s3Key) {
          keys.push(shot.video.s3Key);
        }
        // Note: firstFrame is not part of the shot structure in SceneVideo
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
      {/* Header with Refresh Button */}
      <div className="px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[#FFFFFF]">Storyboard</h2>
          <span className="text-xs text-[#808080]">
            ({scenesWithVideos.length} scene{scenesWithVideos.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] rounded transition-colors"
          title="Refresh storyboard to show new videos"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

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
            {(() => {
              // 🔥 DEBUG: Log what's being rendered
              console.log('[ScenesPanel] 🎬 Rendering scenes:', {
                totalToRender: scenesWithVideos.length,
                sceneNumbers: scenesWithVideos.map(s => s.number),
                scenesWithVideosCount: scenesWithVideos.filter(s => s.videos?.shots?.length > 0).length
              });
              return scenesWithVideos.map((scene) => (
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
              ));
            })()}
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

