'use client';

/**
 * Shots panel (first frames)
 *
 * Displays first frames only, organized by scene with per-shot variation cycling.
 * Toolbar: Download first frame, Generate video (switches to Video Gen tab with pre-fill).
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Film, RefreshCw, Loader2, ChevronLeft, ChevronRight, Clapperboard, Download, Video, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import { useShotBoard, type ShotBoardScene, type ShotBoardShot, getTotalShotCount } from '@/hooks/useShotBoard';
import { formatProviderTag } from '@/utils/providerLabels';
import { ImageViewer, type ImageItem } from './ImageViewer';

interface ShotBoardPanelProps {
  className?: string;
  onNavigateToSceneBuilder?: () => void;
  onGenerateVideo?: (context: GenerateVideoContext) => void;
}

/** Context passed when opening Generate video modal */
export interface GenerateVideoContext {
  firstFrameUrl: string;
  sceneId: string;
  sceneNumber: number;  // Feature 0241: Scene number for Media Library folder structure
  shotNumber: number;
  sceneHeading: string;
}

/**
 * Individual shot cell with variation cycling (first frames only).
 *
 * CODE PATH (so we know we're editing the right place):
 *   URL: /direct?tab=shots → app/direct/page.js → DirectPageClient → DirectHub
 *   → activeTab === 'shots' → this file ShotBoardPanel → SceneRow → ShotCell (here).
 *
 * Display: w-72 card, image fills frame (object-cover) for full-size look. data-shot-board="letterbox-v2".
 */
function ShotCell({
  shot,
  sceneHeading,
  sceneNumber,
  presignedUrls,
  onGenerateVideo,
  onFrameClick,
  onDeleteFirstFrame,
  globalIndex,
}: {
  shot: ShotBoardShot;
  sceneHeading: string;
  sceneNumber: number;  // Feature 0241: Scene number for Media Library folder structure
  presignedUrls: Map<string, string>;
  onGenerateVideo: (context: GenerateVideoContext) => void;
  onFrameClick?: (index: number) => void;
  onDeleteFirstFrame?: (s3Key: string) => void;
  globalIndex?: number;
}) {
  const [variationIndex, setVariationIndex] = useState(0);
  // Only show variations that have a first frame (avoids empty placeholder for video-only / text-to-video)
  const variations = shot.variations.filter((v) => v.firstFrame?.s3Key);
  const hasMultipleVariations = variations.length > 1;

  const currentIndex = Math.min(variationIndex, variations.length - 1);
  const currentVariation = variations[currentIndex];

  if (!currentVariation) {
    return (
      <div className="relative flex-shrink-0 w-72 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] flex items-center justify-center aspect-video">
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
      sceneNumber,
      shotNumber: shot.shotNumber,
      sceneHeading,
    });
  };

  return (
    <div
      className="relative flex-shrink-0 w-72 rounded-lg border border-[#3F3F46] overflow-hidden bg-[#1A1A1A] group flex flex-col"
      data-shot-board="letterbox-v2"
    >
      {/* Full-size frame: image fills the aspect-video box; click opens ImageViewer */}
      <div
        className={`relative w-full aspect-video flex-shrink-0 bg-[#0A0A0A] overflow-hidden ${firstFrameUrl && onFrameClick != null ? 'cursor-pointer' : ''}`}
        role={firstFrameUrl && onFrameClick != null ? 'button' : undefined}
        tabIndex={firstFrameUrl && onFrameClick != null ? 0 : undefined}
        onClick={(e) => {
          if (firstFrameUrl && onFrameClick != null && globalIndex != null) {
            e.stopPropagation();
            onFrameClick(globalIndex);
          }
        }}
        onKeyDown={(e) => {
          if (firstFrameUrl && onFrameClick != null && globalIndex != null && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.stopPropagation();
            onFrameClick(globalIndex);
          }
        }}
      >
        {firstFrameUrl ? (
          <img
            src={firstFrameUrl}
            alt={`Shot ${shot.shotNumber}`}
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A0A0A]">
            <Film className="w-6 h-6 text-[#808080]" />
          </div>
        )}
        <div className="absolute top-1 left-1 bg-[#DC143C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          #{shot.shotNumber}
        </div>
        {/* Image provider label (same style as production hub) — only when providerId present */}
        {currentVariation.firstFrame.metadata?.providerId && (() => {
          const tagText = formatProviderTag(currentVariation.firstFrame.metadata?.providerId);
          if (!tagText) return null;
          return (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 text-white text-[10px] rounded bg-black/70 backdrop-blur-sm">
              {tagText}
            </div>
          );
        })()}
      </div>

      {/* Toolbar: First frame · Frame | Video (visible layout so we can confirm this bundle loads) */}
      <div className="flex items-center justify-between gap-1.5 px-1.5 py-1 bg-[#1A1A1A] border-t border-[#3F3F46] w-full min-w-0 flex-shrink-0">
        {hasMultipleVariations ? (
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border border-[#3F3F46] bg-[#262626] text-[#808080] hover:text-white hover:bg-[#262626] hover:border-[#52525B] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#262626] transition-colors"
            aria-label="Previous variation"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="w-6 flex-shrink-0" aria-hidden />
        )}
        {hasMultipleVariations && (
          <span className="flex-shrink-0 text-[9px] text-[#71717A] font-medium tabular-nums min-w-[1.75rem] text-center">
            {currentIndex + 1}/{variations.length}
          </span>
        )}
        {/* Icon-only toolbar: tooltips (title) and aria-label for accessibility; on touch, users rely on icon recognition */}
        <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
          <button
            type="button"
            onClick={handleDownloadFirstFrame}
            disabled={!firstFrameUrl}
            className="flex items-center justify-center w-8 h-8 rounded border border-[#3F3F46] bg-[#262626] text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2A] hover:border-[#52525B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Download first frame"
            aria-label="Download first frame"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={!firstFrameUrl || !onGenerateVideo}
            className="flex items-center justify-center w-8 h-8 rounded border border-[#3F3F46] bg-[#262626] text-[#A1A1AA] hover:text-white hover:bg-[#2A2A2A] hover:border-[#52525B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            title="Generate video from this frame (opens Video Gen tab)"
            aria-label="Generate video from this frame"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
          {onDeleteFirstFrame && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!confirm('Delete this first frame? This cannot be undone.')) return;
                onDeleteFirstFrame(currentVariation.firstFrame.s3Key);
              }}
              className="flex items-center justify-center w-8 h-8 rounded border border-[#3F3F46] bg-[#262626] text-[#DC143C]/90 hover:text-[#DC143C] hover:bg-[#DC143C]/10 hover:border-[#DC143C]/30 transition-colors flex-shrink-0"
              title="Delete first frame"
              aria-label="Delete first frame"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {hasMultipleVariations ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= variations.length - 1}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border border-[#3F3F46] bg-[#262626] text-[#808080] hover:text-white hover:bg-[#262626] hover:border-[#52525B] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#262626] transition-colors"
            aria-label="Next variation"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="w-6 flex-shrink-0" aria-hidden />
        )}
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
  onFrameClick,
  onDeleteFirstFrame,
  viewerIndexByShot,
}: {
  scene: ShotBoardScene;
  presignedUrls: Map<string, string>;
  onGenerateVideo: (context: GenerateVideoContext) => void;
  onFrameClick?: (index: number) => void;
  onDeleteFirstFrame?: (s3Key: string) => void;
  viewerIndexByShot: Map<string, number>;
}) {
  const sceneNumber = scene.sceneNumber;
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
              sceneNumber={sceneNumber}
              presignedUrls={presignedUrls}
              onGenerateVideo={onGenerateVideo}
              onFrameClick={onFrameClick}
              onDeleteFirstFrame={onDeleteFirstFrame}
              globalIndex={viewerIndexByShot.get(`${scene.sceneId}-${shot.shotNumber}`)}
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
export function ShotBoardPanel({ className = '', onNavigateToSceneBuilder, onGenerateVideo: onGenerateVideoProp }: ShotBoardPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

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
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Flat list of first frames for ImageViewer — same rule as ShotCell: first variation that has a first frame (keeps list and cards in sync)
  const { allFirstFrameImages, viewerIndexByShot } = useMemo(() => {
    const items: ImageItem[] = [];
    const indexByShot = new Map<string, number>();
    let index = 0;
    for (const scene of scenes) {
      for (const shot of scene.shots) {
        const variationsWithFrame = shot.variations.filter((v) => v.firstFrame?.s3Key);
        const firstVariation = variationsWithFrame[0];
        if (!firstVariation) continue;
        const url = presignedUrls.get(firstVariation.firstFrame.s3Key);
        if (!url) continue;
        indexByShot.set(`${scene.sceneId}-${shot.shotNumber}`, index);
        items.push({
          id: `${scene.sceneId}-${shot.shotNumber}`,
          url,
          label: `Scene ${scene.sceneNumber} · Shot ${shot.shotNumber}`,
        });
        index += 1;
      }
    }
    return { allFirstFrameImages: items, viewerIndexByShot: indexByShot };
  }, [scenes, presignedUrls]);

  const handleFrameClick = useCallback((index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  }, []);

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

  const handleGenerateVideo = useCallback(
    (context: GenerateVideoContext) => {
      if (onGenerateVideoProp) {
        onGenerateVideoProp(context);
      } else {
        handleOpenGenerateVideo(context);
      }
    },
    [onGenerateVideoProp, handleOpenGenerateVideo]
  );

  const handleCloseGenerateVideoModal = useCallback(() => {
    setGenerateVideoModalOpen(false);
    setGenerateVideoContext(null);
  }, []);

  const handleDeleteFirstFrame = useCallback(
    async (s3Key: string) => {
      if (!screenplayId) return;
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const res = await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || res.statusText || 'Delete failed');
        }
        queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
        queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
        await refetch();
        toast.success('First frame deleted');
      } catch (err: any) {
        console.error('[ShotBoard] Delete first frame failed:', err);
        toast.error(err?.message || 'Failed to delete first frame');
      }
    },
    [screenplayId, getToken, queryClient, refetch]
  );

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
                onFrameClick={allFirstFrameImages.length > 0 ? handleFrameClick : undefined}
                onDeleteFirstFrame={handleDeleteFirstFrame}
                viewerIndexByShot={viewerIndexByShot}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full-size image viewer: click any first frame to open */}
      <ImageViewer
        images={allFirstFrameImages}
        currentIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        groupName="First frames"
      />
    </div>
  );
}
