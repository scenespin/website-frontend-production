'use client';

/**
 * Shot Board Panel
 * 
 * Displays all shots organized by scene with per-shot variation cycling.
 * Each shot shows its first frame with optional video playback.
 * Users can cycle through multiple variations (generations) of each shot.
 * 
 * Replaces the old ScenesPanel/Storyboard view.
 */

import React, { useState, useCallback } from 'react';
import { Film, RefreshCw, Loader2, ChevronLeft, ChevronRight, Play, X, Clapperboard } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { useShotBoard, type ShotBoardScene, type ShotBoardShot, getTotalShotCount } from '@/hooks/useShotBoard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShotBoardPanelProps {
  className?: string;
  onNavigateToSceneBuilder?: () => void;
}

/**
 * Individual shot cell with variation cycling
 */
function ShotCell({
  shot,
  presignedUrls,
  onPlayVideo
}: {
  shot: ShotBoardShot;
  presignedUrls: Map<string, string>;
  onPlayVideo: (videoUrl: string) => void;
}) {
  const [variationIndex, setVariationIndex] = useState(0);
  const variations = shot.variations;
  const hasMultipleVariations = variations.length > 1;
  
  // Ensure index is valid
  const currentIndex = Math.min(variationIndex, variations.length - 1);
  const currentVariation = variations[currentIndex];
  
  if (!currentVariation) {
    return (
      <div className="relative flex-shrink-0 w-28 h-28 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] flex items-center justify-center">
        <span className="text-[10px] text-[#808080]">No data</span>
      </div>
    );
  }

  const firstFrameUrl = presignedUrls.get(currentVariation.firstFrame.s3Key);
  const videoUrl = currentVariation.video ? presignedUrls.get(currentVariation.video.s3Key) : undefined;
  const hasVideo = !!currentVariation.video && !!videoUrl;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVariationIndex(i => Math.max(0, i - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVariationIndex(i => Math.min(variations.length - 1, i + 1));
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoUrl) {
      onPlayVideo(videoUrl);
    }
  };

  return (
    <div className="relative flex-shrink-0 w-28 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] group">
      {/* First Frame Image */}
      <div className="relative w-full h-28">
        {firstFrameUrl ? (
          <img
            src={firstFrameUrl}
            alt={`Shot ${shot.shotNumber}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
            <Film className="w-6 h-6 text-[#808080]" />
          </div>
        )}

        {/* Play button overlay (only when video exists) */}
        {hasVideo && (
          <button
            type="button"
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none"
            aria-label="Play video"
          >
            <Play className="w-10 h-10 text-white drop-shadow" fill="currentColor" />
          </button>
        )}

        {/* Shot number badge */}
        <div className="absolute top-1 left-1 bg-[#DC143C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          #{shot.shotNumber}
        </div>

        {/* Video indicator badge */}
        {hasVideo && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5">
            <Film className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* Variation navigation (only when multiple variations) */}
      {hasMultipleVariations && (
        <div className="flex items-center justify-between px-1 py-1 bg-[#141414] border-t border-[#3F3F46]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="p-0.5 text-[#808080] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous variation"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] text-[#808080]">
            {currentIndex + 1}/{variations.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= variations.length - 1}
            className="p-0.5 text-[#808080] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next variation"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Scene row with horizontal strip of shots
 */
function SceneRow({
  scene,
  presignedUrls,
  onPlayVideo
}: {
  scene: ShotBoardScene;
  presignedUrls: Map<string, string>;
  onPlayVideo: (videoUrl: string) => void;
}) {
  return (
    <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
      {/* Scene Header */}
      <div className="px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#DC143C] flex items-center justify-center text-white text-sm font-semibold">
            {scene.sceneNumber}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{scene.sceneHeading}</h3>
            <p className="text-[10px] text-[#808080]">
              {scene.shots.length} shot{scene.shots.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Shots Strip */}
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {scene.shots.map((shot) => (
            <ShotCell
              key={`${scene.sceneId}-${shot.shotNumber}`}
              shot={shot}
              presignedUrls={presignedUrls}
              onPlayVideo={onPlayVideo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Shot Board Panel component
 */
export function ShotBoardPanel({ className = '', onNavigateToSceneBuilder }: ShotBoardPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const queryClient = useQueryClient();

  // Fetch shot board data
  const {
    scenes,
    isLoading,
    error,
    refetch,
    presignedUrls,
    presignedUrlsLoading
  } = useShotBoard(screenplayId || '', !!screenplayId);

  // Video playback modal state
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      refetch();
      toast.success('Refreshing Shot Board...');
    }
  }, [screenplayId, queryClient, refetch]);

  // Handle play video
  const handlePlayVideo = useCallback((videoUrl: string) => {
    setPlayingVideoUrl(videoUrl);
  }, []);

  // Loading state
  if (!screenplayId || isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading shots...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <p className="text-red-500 text-sm mb-2">Failed to load shots</p>
          <button
            onClick={handleRefresh}
            className="text-sm text-[#DC143C] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalShots = getTotalShotCount(scenes);

  return (
    <div className={`h-full flex flex-col bg-[#0A0A0A] ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Shot Board</h2>
          <span className="text-xs text-[#808080]">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''} • {totalShots} shot{totalShots !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || presignedUrlsLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded transition-colors disabled:opacity-50"
          title="Refresh Shot Board"
        >
          <RefreshCw className={`w-4 h-4 ${presignedUrlsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {scenes.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Clapperboard className="w-12 h-12 text-[#808080] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No shots yet</h3>
          <p className="text-sm text-[#808080] mb-6 max-w-sm">
            Generate your first scene in Scene Builder to see your shots here.
          </p>
          {onNavigateToSceneBuilder && (
            <button
              onClick={onNavigateToSceneBuilder}
              className="px-4 py-2 bg-[#DC143C] hover:bg-[#B0111E] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go to Scene Builder
            </button>
          )}
        </div>
      ) : (
        /* Scene List */
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {scenes.map((scene) => (
              <SceneRow
                key={scene.sceneId}
                scene={scene}
                presignedUrls={presignedUrls}
                onPlayVideo={handlePlayVideo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Video Playback Modal */}
      <Dialog open={!!playingVideoUrl} onOpenChange={(open) => !open && setPlayingVideoUrl(null)}>
        <DialogContent className="max-w-4xl bg-[#141414] border-[#3F3F46] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Play video</DialogTitle>
          </DialogHeader>
          {playingVideoUrl && (
            <div className="relative aspect-video w-full">
              <video
                src={playingVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onEnded={() => setPlayingVideoUrl(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
