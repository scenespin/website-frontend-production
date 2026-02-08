'use client';

/**
 * Video Browser Panel (Feature 0254)
 *
 * Two sections in the same list: Scene-context videos (from Shots/Scene Builder) and Standalone videos.
 * Toggle icon next to Refresh switches between sections. Same table: Scene | Shot | Type | Time | Actions.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { RefreshCw, Loader2, Play, Video, Download, Trash2, Layers, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useShotBoard,
  type ShotBoardScene,
} from '@/hooks/useShotBoard';
import { useMediaFiles, useBulkPresignedUrls, useStandaloneVideosPaginated, type StandaloneVideosPage } from '@/hooks/useMediaLibrary';
import type { MediaFile } from '@/types/media';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type VideoSection = 'scene' | 'standalone';

export type VideoSortKey = 'scene' | 'shot' | 'type' | 'provider' | 'time';

export interface VideoBrowserEntry {
  /** Null/undefined for standalone entries (show "—") */
  sceneNumber?: number | null;
  sceneHeading?: string | null;
  sceneId?: string | null;
  shotNumber?: number | null;
  timestamp: string;
  videoFileName: string;
  videoS3Key: string;
  videoUrl: string | undefined;
  hasFirstFrame: boolean;
  videoMode?: string;
  /** Provider id (e.g. runway-gen4-turbo, veo-2) for display and sort */
  videoProvider?: string | null;
  /** Stable key for list (fileId or scene-shot-timestamp) */
  entryKey: string;
}

/** Map provider id from backend to display label in Videos list */
function getProviderLabel(provider: string | null | undefined): string {
  if (!provider) return '—';
  const p = provider.toLowerCase();
  if (p === 'veo-2' || p === 'veo-2.0') return 'Veo 2.0';
  if (p === 'veo-2-fast') return 'Veo 2.0 Fast';
  if (p === 'veo-3' || p === 'veo-3.0') return 'Veo 3.0';
  if (p === 'veo-3-fast') return 'Veo 3.0 Fast';
  if (p === 'veo-3.1') return 'Veo 3.1';
  if (p === 'veo-3.1-fast') return 'Veo 3.1 Fast';
  if (p === 'luma' || p === 'luma-ray-2') return 'Luma Ray 2';
  if (p === 'luma-ray-3') return 'Luma Ray 3';
  if (p === 'luma-ray-flash-2') return 'Luma Ray Flash 2';
  if (p === 'runway' || p === 'runway-gen4-turbo') return 'Runway Gen4 Turbo';
  if (p === 'runway-gen4-aleph') return 'Runway Gen4 Aleph';
  if (p === 'runway-gen3a-turbo') return 'Runway Gen3a Turbo';
  if (p === 'runway-gen3a') return 'Runway Gen3a';
  if (p === 'sora-2') return 'Sora 2';
  if (p === 'sora-2-pro') return 'Sora 2 Pro';
  if (p === 'sora-2-pro-hd') return 'Sora 2 Pro HD';
  if (p === 'grok-imagine-video') return 'Grok';
  return provider;
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
        const metadata = (variation.video as any).metadata || {};
        entries.push({
          sceneNumber: scene.sceneNumber,
          sceneHeading: scene.sceneHeading,
          sceneId: scene.sceneId,
          shotNumber: shot.shotNumber,
          timestamp: variation.timestamp,
          videoFileName: variation.video.fileName || `shot-${shot.shotNumber}.mp4`,
          videoS3Key: variation.video.s3Key,
          videoUrl,
          hasFirstFrame: !!(variation.firstFrame?.s3Key),
          videoMode: metadata.videoMode,
          videoProvider: metadata.videoProvider ?? metadata.videoModel ?? null,
          entryKey: `${scene.sceneId}-${shot.shotNumber}-${variation.timestamp}`,
        });
      }
    }
  }
  return entries;
}

function buildStandaloneEntries(
  files: MediaFile[],
  presignedUrls: Map<string, string>
): VideoBrowserEntry[] {
  return files
    .filter((f) => f.s3Key && ((f as any).mediaFileType === 'video' || (typeof f.fileType === 'string' && f.fileType.startsWith('video/'))))
    .map((file, index) => {
      const metadata = (file as any).metadata || {};
      const timestamp = metadata.timestamp || (file as any).uploadedAt || (file as any).createdAt || '';
      return {
        sceneNumber: null,
        sceneHeading: null,
        sceneId: null,
        shotNumber: null,
        timestamp: typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString(),
        videoFileName: file.fileName || 'video.mp4',
        videoS3Key: file.s3Key || '',
        videoUrl: presignedUrls.get(file.s3Key!),
        hasFirstFrame: false,
        videoMode: metadata.videoMode,
        videoProvider: metadata.videoProvider ?? metadata.videoModel ?? null,
        entryKey: (file as any).id || file.s3Key || `standalone-${index}`,
      };
    });
}

interface VideoBrowserPanelProps {
  className?: string;
}

export function VideoBrowserPanel({ className = '' }: VideoBrowserPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId ?? '';
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [currentSection, setCurrentSection] = useState<VideoSection>('scene');
  const [sortKey, setSortKey] = useState<VideoSortKey>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const handleSort = useCallback((key: VideoSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir(key === 'time' ? 'desc' : 'asc');
      return key;
    });
  }, []);

  const {
    scenes,
    isLoading: sceneLoading,
    error,
    refetch,
    presignedUrls,
    presignedUrlsLoading: sceneUrlsLoading,
  } = useShotBoard(screenplayId, !!screenplayId && currentSection === 'scene');

  const {
    data: standalonePages,
    isLoading: standaloneLoading,
    fetchNextPage,
    hasNextPage: hasMoreStandalone,
    isFetchingNextPage: isLoadingMoreStandalone,
  } = useStandaloneVideosPaginated(screenplayId, currentSection === 'standalone');
  const standaloneFiles = useMemo(
    () => ((standalonePages?.pages ?? []) as StandaloneVideosPage[]).flatMap((p) => p.files),
    [standalonePages]
  );
  const standaloneS3Keys = useMemo(
    () => standaloneFiles.map((f) => f.s3Key).filter((k): k is string => !!k),
    [standaloneFiles]
  );
  const { data: standalonePresignedUrls = new Map<string, string>(), isLoading: standaloneUrlsLoading } = useBulkPresignedUrls(
    standaloneS3Keys,
    currentSection === 'standalone' && standaloneS3Keys.length > 0
  );

  const sceneEntries = useMemo(() => buildVideoEntries(scenes, presignedUrls), [scenes, presignedUrls]);
  const standaloneEntries = useMemo(
    () => buildStandaloneEntries(standaloneFiles, standalonePresignedUrls),
    [standaloneFiles, standalonePresignedUrls]
  );

  const rawEntries = currentSection === 'scene' ? sceneEntries : standaloneEntries;
  const videoEntries = useMemo(() => {
    const sorted = [...rawEntries].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      const nullLastNum = (x: number | null | undefined, y: number | null | undefined): number => {
        const xNull = x == null ? 1 : 0;
        const yNull = y == null ? 1 : 0;
        if (xNull !== yNull) return xNull - yNull;
        return (x ?? 0) - (y ?? 0);
      };
      switch (sortKey) {
        case 'scene':
          return mult * nullLastNum(a.sceneNumber, b.sceneNumber);
        case 'shot':
          return mult * nullLastNum(a.shotNumber, b.shotNumber);
        case 'type': {
          const ta = a.videoMode ?? '';
          const tb = b.videoMode ?? '';
          return mult * (ta < tb ? -1 : ta > tb ? 1 : 0);
        }
        case 'provider': {
          const pa = getProviderLabel(a.videoProvider) ?? '—';
          const pb = getProviderLabel(b.videoProvider) ?? '—';
          return mult * (pa < pb ? -1 : pa > pb ? 1 : 0);
        }
        case 'time':
        default:
          return mult * (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0);
      }
    });
    return sorted;
  }, [rawEntries, sortKey, sortDir]);
  const isLoading = currentSection === 'scene' ? sceneLoading : standaloneLoading;
  const presignedUrlsLoading = currentSection === 'scene' ? sceneUrlsLoading : standaloneUrlsLoading;

  const handleRefresh = useCallback(() => {
    if (screenplayId) {
      queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      refetch();
      toast.success('Refreshing videos...');
    }
  }, [screenplayId, queryClient, refetch]);

  const toggleSection = useCallback(() => {
    setCurrentSection((s) => (s === 'scene' ? 'standalone' : 'scene'));
  }, []);

  const handlePlay = useCallback((url: string | undefined) => {
    if (url) setPlayingVideoUrl(url);
  }, []);

  const handleDownload = useCallback(
    async (entry: VideoBrowserEntry) => {
      if (!entry.videoS3Key) {
        toast.error('Download not available for this video');
        return;
      }
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const url = `${BACKEND_API_URL}/api/media/file?key=${encodeURIComponent(entry.videoS3Key)}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(response.statusText);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = entry.videoFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        toast.success('Download started');
      } catch (err) {
        console.error('[VideoBrowserPanel] Failed to download video:', err);
        toast.error('Failed to download video');
      }
    },
    [getToken]
  );

  const handleDeleteVideo = useCallback(
    async (entry: VideoBrowserEntry) => {
      if (!entry.videoS3Key || !screenplayId) return;
      if (!confirm('Delete this video? This cannot be undone.')) return;
      setDeletingKey(entry.entryKey);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const res = await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key: entry.videoS3Key }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || res.statusText || 'Delete failed');
        }
        queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
        queryClient.invalidateQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
        await refetch();
        toast.success('Video deleted');
      } catch (err: any) {
        console.error('[VideoBrowserPanel] Delete video failed:', err);
        toast.error(err?.message || 'Failed to delete video');
      } finally {
        setDeletingKey(null);
      }
    },
    [screenplayId, getToken, queryClient, refetch]
  );

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
      {/* Header: count + toggle (Scene / Standalone) + Refresh */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46] flex items-center justify-between gap-2">
        <span className="text-xs text-[#808080]">
          {videoEntries.length} video{videoEntries.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSection}
            className={cn(
              'p-2 rounded transition-colors',
              currentSection === 'scene'
                ? 'text-[#DC143C] bg-[#DC143C]/10 hover:bg-[#DC143C]/20'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A]'
            )}
            title={currentSection === 'scene' ? 'Showing scene videos (click for standalone)' : 'Showing standalone videos (click for scene)'}
            aria-label={currentSection === 'scene' ? 'Switch to standalone videos' : 'Switch to scene videos'}
          >
            <Layers className="w-4 h-4" />
          </button>
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
      </div>

      {/* Content */}
      {videoEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Video className="w-12 h-12 text-[#808080] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No videos yet</h3>
          <p className="text-sm text-[#808080] max-w-sm">
            {currentSection === 'scene'
              ? 'Generate videos from the First frames tab (Generate video) or from Scene Builder. They will appear here.'
              : 'Standalone videos (no scene/shot) will appear here when you generate from Video Gen without a scene.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Sortable column headers */}
            <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-medium text-[#808080] uppercase tracking-wider border-b border-[#3F3F46] mb-2">
              <button type="button" onClick={() => handleSort('scene')} className="flex items-center gap-1 w-16 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Scene {sortKey === 'scene' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <button type="button" onClick={() => handleSort('shot')} className="flex items-center gap-1 w-14 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Shot {sortKey === 'shot' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <button type="button" onClick={() => handleSort('type')} className="flex items-center gap-1 w-28 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Type {sortKey === 'type' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <button type="button" onClick={() => handleSort('provider')} className="flex items-center gap-1 w-24 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Provider {sortKey === 'provider' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <button type="button" onClick={() => handleSort('time')} className="flex items-center gap-1 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Time {sortKey === 'time' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <span className="flex-shrink-0 ml-auto w-24 text-right">Actions</span>
            </div>
            <ul className="space-y-1" role="list">
              {videoEntries.map((entry) => (
                <li
                  key={entry.entryKey}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-lg border border-[#3F3F46] bg-[#141414]',
                    'hover:bg-[#1A1A1A] transition-colors'
                  )}
                >
                  <span className="text-xs text-[#808080] w-16 flex-shrink-0">
                    {entry.sceneNumber != null ? `Scene ${entry.sceneNumber}` : '—'}
                  </span>
                  <span className="text-xs text-[#808080] w-14 flex-shrink-0">
                    {entry.shotNumber != null ? `Shot #${entry.shotNumber}` : '—'}
                  </span>
                  <span className="text-xs text-[#B3B3B3] w-28 flex-shrink-0">
                    {entry.videoMode === 'image-interpolation' && (
                      <span className="text-[10px] font-medium text-emerald-500/90 bg-emerald-500/10 px-2 py-0.5 rounded" title="Frame to frame">
                        Frame to frame
                      </span>
                    )}
                    {entry.videoMode === 'image-start' && (
                      <span className="text-[10px] font-medium text-sky-500/90 bg-sky-500/10 px-2 py-0.5 rounded" title="Image-to-video">
                        Image-to-video
                      </span>
                    )}
                    {entry.videoMode === 'reference-images' && (
                      <span className="text-[10px] font-medium text-violet-500/90 bg-violet-500/10 px-2 py-0.5 rounded" title="Reference images">
                        Reference images
                      </span>
                    )}
                    {(entry.videoMode === 'text-only' || !entry.videoMode) && (
                      <span className="text-[10px] font-medium text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded" title="Text-to-video">
                        Text-to-video
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[#808080] w-24 flex-shrink-0">
                    {getProviderLabel(entry.videoProvider)}
                  </span>
                  <span className="text-[10px] text-[#808080] flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
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
                      disabled={!entry.videoS3Key}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#808080] hover:text-white hover:bg-[#262626] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Download video"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(entry)}
                      disabled={deletingKey === entry.entryKey}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#DC143C]/90 hover:text-[#DC143C] hover:bg-[#DC143C]/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Delete video"
                    >
                      {deletingKey === entry.entryKey ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {currentSection === 'standalone' && hasMoreStandalone && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isLoadingMoreStandalone}
                  className="px-4 py-2 text-sm text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded border border-[#3F3F46] disabled:opacity-50"
                >
                  {isLoadingMoreStandalone ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
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
