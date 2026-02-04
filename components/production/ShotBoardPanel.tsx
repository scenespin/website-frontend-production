'use client';

/**
 * Shots panel (first frames)
 *
 * Displays first frames only, organized by scene with per-shot variation cycling.
 * Toolbar: Download first frame, Generate video (switches to Video Gen tab with pre-fill).
 */

import React, { useState, useCallback } from 'react';
import { Film, RefreshCw, Loader2, ChevronLeft, ChevronRight, Clapperboard, Download, Video } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { useShotBoard, type ShotBoardScene, type ShotBoardShot, getTotalShotCount } from '@/hooks/useShotBoard';

interface ShotBoardPanelProps {
  className?: string;
  onNavigateToSceneBuilder?: () => void;
  onGenerateVideo?: (context: GenerateVideoContext) => void;
}

/** Context passed when opening Generate video modal */
export interface GenerateVideoContext {
  firstFrameUrl: string;
  sceneId: string;
  shotNumber: number;
  sceneHeading: string;
}

/**
 * Individual shot cell with variation cycling (first frames only)
 */
function ShotCell({
  shot,
  sceneHeading,
  presignedUrls,
  onGenerateVideo,
}: {
  shot: ShotBoardShot;
  sceneHeading: string;
  presignedUrls: Map<string, string>;
  onGenerateVideo: (context: GenerateVideoContext) => void;
}) {
  const [variationIndex, setVariationIndex] = useState(0);
  const variations = shot.variations;
  const hasMultipleVariations = variations.length > 1;

  const currentIndex = Math.min(variationIndex, variations.length - 1);
  const currentVariation = variations[currentIndex];

  if (!currentVariation) {
    return (
      <div className="relative flex-shrink-0 w-40 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] flex items-center justify-center aspect-video">
        <span className="text-[10px] text-[#808080]">No data</span>
      </div>
    );
  }

  const firstFrameUrl = presignedUrls.get(currentVariation.firstFrame.s3Key);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVariationIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVariationIndex((i) => Math.min(variations.length - 1, i + 1));
  };

  const handleDownloadFirstFrame = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstFrameUrl) return;
    const filename = currentVariation.firstFrame.fileName || `shot-${shot.shotNumber}-first-frame.jpg`;
    try {
      const response = await fetch(firstFrameUrl);
      if (!response.ok) throw new Error(response.statusText);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error('[ShotBoard] Failed to download first frame:', err);
      toast.error('Failed to download image');
    }
  };

  const handleGenerateVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstFrameUrl) return;
    onGenerateVideo({
      firstFrameUrl,
      sceneId: shot.sceneId,
      shotNumber: shot.shotNumber,
      sceneHeading,
    });
  };

  return (
    <div className="relative flex-shrink-0 w-40 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] group">
      <div className="relative w-full aspect-video bg-[#0A0A0A]">
        {firstFrameUrl ? (
          <img
            src={firstFrameUrl}
            alt={`Shot ${shot.shotNumber}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
            <Film className="w-6 h-6 text-[#808080]" />
          </div>
        )}
        <div className="absolute top-1 left-1 bg-[#DC143C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          #{shot.shotNumber}
        </div>
      </div>

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

      <div className="flex items-center gap-1 px-1 py-1 bg-[#141414] border-t border-[#3F3F46]">
        <button
          type="button"
          onClick={handleDownloadFirstFrame}
          disabled={!firstFrameUrl}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-[#808080] hover:text-white hover:bg-[#262626] rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Download first frame"
          aria-label="Download first frame"
        >
          <Download className="w-3 h-3" />
          Frame
        </button>
        <button
          type="button"
          onClick={handleGenerateVideo}
          disabled={!firstFrameUrl || !onGenerateVideo}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-[#808080] hover:text-white hover:bg-[#262626] rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Generate video from this frame (opens Video Gen tab)"
          aria-label="Generate video"
        >
          <Video className="w-3 h-3" />
          Video
        </button>
      </div>
    </div>
  );
}

/**
 * Scene row with horizontal strip of shot cells
 */
function SceneRow({
  scene,
  presignedUrls,
  onGenerateVideo,
}: {
  scene: ShotBoardScene;
  presignedUrls: Map<string, string>;
  onGenerateVideo: (context: GenerateVideoContext) => void;
}) {
  return (
    <div className="bg-[#141414] rounded-lg border border-[#3F3F46] overflow-hidden">
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
      <div className="p-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {scene.shots.map((shot) => (
            <ShotCell
              key={`${scene.sceneId}-${shot.shotNumber}`}
              shot={shot}
              sceneHeading={scene.sceneHeading}
              presignedUrls={presignedUrls}
              onGenerateVideo={onGenerateVideo}
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

  const [generateVideoModalOpen, setGenerateVideoModalOpen] = useState(false);
  const [generateVideoContext, setGenerateVideoContext] = useState<GenerateVideoContext | null>(null);

  const handleRefresh = useCallback(() => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      refetch();
      toast.success('Refreshing Shot Board...');
    }
  }, [screenplayId, queryClient, refetch]);

  const handleOpenGenerateVideo = useCallback((context: GenerateVideoContext) => {
    setGenerateVideoContext(context);
    setGenerateVideoModalOpen(true);
  }, []);

  const handleCloseGenerateVideoModal = useCallback(() => {
    setGenerateVideoModalOpen(false);
    setGenerateVideoContext(null);
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
          <h2 className="text-lg font-semibold text-white">Shots</h2>
          <span className="text-xs text-[#808080]">
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''} • {totalShots} shot{totalShots !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || presignedUrlsLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded transition-colors disabled:opacity-50"
          title="Refresh shots"
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
                onGenerateVideo={handleGenerateVideo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
