'use client';

/**
 * Video Browser Panel
 *
 * Lists all videos from the Shot Board data (Media Library) by scene/shot/date.
 * Click a row or Play to open the video in a modal. Uses same data as First frames (useShotBoard).
 */

import React, { useMemo, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Play, Video, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useShotBoard,
  type ShotBoardScene,
  type ShotBoardShot,
} from '@/hooks/useShotBoard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface VideoBrowserEntry {
  sceneNumber: number;
  sceneHeading: string;
  sceneId: string;
  shotNumber: number;
  timestamp: string;
  videoFileName: string;
  videoS3Key: string;
  videoUrl: string | undefined;
}

function formatTimestamp(ts: string): string {
  if (!ts) return '—';
  // Support formats: "20241215-143022" or ISO
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [, y, m, d, hh, mm] = match;
    const month = new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'short' });
    const hour = Number(hh);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${month} ${d}, ${y} ${hour12}:${mm} ${ampm}`;
  }
  try {
    const date = new Date(ts);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  } catch {
    // ignore
  }
  return ts;
}

function buildVideoEntries(
  scenes: ShotBoardScene[],
  presignedUrls: Map<string, string>
): VideoBrowserEntry[] {
  const entries: VideoBrowserEntry[] = [];
  for (const scene of scenes) {
    for (const shot of scene.shots) {
      for (const variation of shot.variations) {
        if (!variation.video?.s3Key) continue;
        const videoUrl = presignedUrls.get(variation.video.s3Key);
        entries.push({
          sceneNumber: scene.sceneNumber,
          sceneHeading: scene.sceneHeading,
          sceneId: scene.sceneId,
          shotNumber: shot.shotNumber,
          timestamp: variation.timestamp,
          videoFileName: variation.video.fileName || `shot-${shot.shotNumber}.mp4`,
          videoS3Key: variation.video.s3Key,
          videoUrl,
        });
      }
    }
  }
  return entries;
}

interface VideoBrowserPanelProps {
  className?: string;
}

export function VideoBrowserPanel({ className = '' }: VideoBrowserPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId ?? '';
  const queryClient = useQueryClient();

  const {
    scenes,
    isLoading,
    error,
    refetch,
    presignedUrls,
    presignedUrlsLoading,
  } = useShotBoard(screenplayId, !!screenplayId);

  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const videoEntries = useMemo(
    () => buildVideoEntries(scenes, presignedUrls),
    [scenes, presignedUrls]
  );

  const handleRefresh = useCallback(() => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      refetch();
      toast.success('Refreshing videos...');
    }
  }, [screenplayId, queryClient, refetch]);

  const handlePlay = useCallback((url: string | undefined) => {
    if (url) setPlayingVideoUrl(url);
  }, []);

  const handleDownload = useCallback((entry: VideoBrowserEntry) => {
    if (!entry.videoUrl) return;
    const link = document.createElement('a');
    link.href = entry.videoUrl;
    link.download = entry.videoFileName;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    link.click();
  }, []);

  if (!screenplayId || isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <p className="text-red-500 text-sm mb-2">Failed to load videos</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-sm text-[#DC143C] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col bg-[#0A0A0A]', className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between">
        <span className="text-xs text-[#808080]">
          {videoEntries.length} video{videoEntries.length !== 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={presignedUrlsLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded transition-colors disabled:opacity-50"
          title="Refresh videos"
          aria-label="Refresh videos"
        >
          <RefreshCw className={cn('w-4 h-4', presignedUrlsLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {videoEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Video className="w-12 h-12 text-[#808080] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No videos yet</h3>
          <p className="text-sm text-[#808080] max-w-sm">
            Generate videos from the First frames tab (Generate video) or from Scene Builder. They will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <ul className="space-y-1" role="list">
              {videoEntries.map((entry, index) => (
                <li
                  key={`${entry.sceneId}-${entry.shotNumber}-${entry.timestamp}-${index}`}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-lg border border-[#3F3F46] bg-[#141414]',
                    'hover:bg-[#1A1A1A] transition-colors'
                  )}
                >
                  <span className="text-xs text-[#808080] w-16 flex-shrink-0">
                    Scene {entry.sceneNumber}
                  </span>
                  <span className="text-xs text-[#808080] w-14 flex-shrink-0">
                    Shot #{entry.shotNumber}
                  </span>
                  <span className="text-xs text-[#B3B3B3] flex-1 min-w-0 truncate" title={entry.sceneHeading}>
                    {entry.sceneHeading}
                  </span>
                  <span className="text-[10px] text-[#808080] flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlay(entry.videoUrl)}
                      disabled={!entry.videoUrl}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white bg-[#DC143C] hover:bg-[#B0111E] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Play video"
                    >
                      <Play className="w-3.5 h-3.5" fill="currentColor" />
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(entry)}
                      disabled={!entry.videoUrl}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#808080] hover:text-white hover:bg-[#262626] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Download video"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Video playback modal */}
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
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
