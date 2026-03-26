'use client';

/**
 * Video Browser Panel (Feature 0254)
 *
 * Two sections in the same list: Scene-context videos (from Shots/Scene Builder) and Standalone videos.
 * Segmented control next to Refresh switches between sections. Same table: Scene | Shot | Type | Time | Actions.
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { RefreshCw, Loader2, Play, Video, Download, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type VideoSection = 'scene' | 'standalone';

export type VideoSortKey = 'scene' | 'type' | 'provider' | 'time';

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
  /** Override label for Provider column (e.g. "Premium Dialogue" for premium dialogue workflow) */
  providerDisplayLabel?: string | null;
  /** Video aspect ratio label (e.g. 16:9, 9:16, 1:1) */
  aspectRatio?: string | null;
  /** Stable key for list (fileId or scene-shot-timestamp) */
  entryKey: string;
  /** Media folder context for re-registered outputs (e.g., dubbing) */
  folderId?: string | null;
  /** Source media row id for backend lookup fallback */
  sourceFileId?: string | null;
  /** Duration hint in seconds for dubbing estimate fallback */
  sourceDurationSec?: number | null;
  /** Dubbing metadata */
  isDubbed?: boolean;
  dubbedLanguage?: string | null;
}

/** Max length for unknown provider display (avoid overflow in table cell) */
const MAX_PROVIDER_LABEL_LENGTH = 24;

/** Map provider id from backend to display label in Videos list. Unknown providers get a sanitized fallback. */
function getProviderLabel(provider: string | null | undefined): string {
  if (!provider) return '—';
  const p = provider.toLowerCase();
  if (p === 'veo-2' || p === 'veo-2.0') return 'Veo 2.0';
  if (p === 'veo-2-fast') return 'Veo 2.0 Fast';
  if (p === 'veo-3' || p === 'veo-3.0') return 'Veo 3.0';
  if (p === 'veo-3-fast') return 'Veo 3.0 Fast';
  if (p === 'veo-3.1') return 'Veo 3.1 (Quality)';
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
  // Unknown provider: title-case and truncate for table display
  const fallback = provider.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return fallback.length > MAX_PROVIDER_LABEL_LENGTH
    ? fallback.slice(0, MAX_PROVIDER_LABEL_LENGTH - 1) + '…'
    : fallback || provider;
}

/** Format YYYYMMDD-HHMMSS or ISO timestamp for display. Uses video timestamp when available so time matches backend. */
function formatTimestamp(ts: string): string {
  if (!ts) return '—';
  const match = ts.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    // Timestamp format is UTC from backend (YYYYMMDD-HHMMSS). Parse as UTC, then display in local timezone.
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss || 0)));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
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
  presignedUrls: Map<string, string>,
  mediaContextByS3Key: Map<string, { folderId?: string | null; sourceFileId?: string | null }>
): VideoBrowserEntry[] {
  const entries: VideoBrowserEntry[] = [];
  for (const scene of scenes) {
    for (const shot of scene.shots) {
      for (const variation of shot.variations) {
        if (!variation.video?.s3Key) continue;
        const videoUrl = presignedUrls.get(variation.video.s3Key);
        const metadata = (variation.video as any).metadata || {};
        const videoTimestamp = metadata.timestamp || variation.timestamp;
        const aspectRatio = getVideoAspectRatio(metadata);
        const sourceDurationSec = extractDurationSec(metadata);
        const mediaContext = mediaContextByS3Key.get(variation.video.s3Key);
        entries.push({
          sceneNumber: scene.sceneNumber,
          sceneHeading: scene.sceneHeading,
          sceneId: scene.sceneId,
          shotNumber: shot.shotNumber,
          timestamp: videoTimestamp,
          videoFileName: variation.video.fileName || `shot-${shot.shotNumber}.mp4`,
          videoS3Key: variation.video.s3Key,
          videoUrl,
          hasFirstFrame: !!(variation.firstFrame?.s3Key),
          videoMode: metadata.videoMode,
          videoProvider: metadata.videoProvider ?? metadata.videoModel ?? null,
          providerDisplayLabel: metadata.providerDisplayLabel ?? null,
          aspectRatio,
          sourceDurationSec,
          folderId: mediaContext?.folderId ?? null,
          sourceFileId: mediaContext?.sourceFileId ?? null,
          isDubbed: metadata.isDubbed === true,
          dubbedLanguage: metadata.targetLanguageName || metadata.targetLanguageCode || null,
          entryKey: `${scene.sceneId}-${shot.shotNumber}-${videoTimestamp}`,
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
      const aspectRatio = getVideoAspectRatio(metadata);
      const sourceDurationSec = extractDurationSec(metadata);
      return {
        sceneNumber: metadata.sceneNumber != null ? Number(metadata.sceneNumber) : null,
        sceneHeading: metadata.heading || null,
        sceneId: metadata.sceneId || null,
        shotNumber: metadata.shotNumber != null ? Number(metadata.shotNumber) : null,
        timestamp: typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString(),
        videoFileName: file.fileName || 'video.mp4',
        videoS3Key: file.s3Key || '',
        videoUrl: presignedUrls.get(file.s3Key!),
        hasFirstFrame: false,
        videoMode: metadata.videoMode,
        videoProvider: metadata.videoProvider ?? metadata.videoModel ?? null,
        providerDisplayLabel: metadata.providerDisplayLabel ?? null,
        aspectRatio,
        sourceDurationSec,
        folderId: (file as any).folderId || null,
        sourceFileId: (file as any).fileId || (file as any).id || null,
        isDubbed: metadata.isDubbed === true,
        dubbedLanguage: metadata.targetLanguageName || metadata.targetLanguageCode || null,
        entryKey: (file as any).id || file.s3Key || `standalone-${index}`,
      };
    });
}

function isDubbedSceneLinkedVideo(file: MediaFile): boolean {
  const metadata = (file as any).metadata || {};
  return metadata.isDubbed === true && !!metadata.sceneId;
}

function extractDurationSec(metadata: Record<string, any>): number | null {
  const raw = Number(
    metadata?.durationSec ??
    metadata?.videoDurationSec ??
    metadata?.mediaDurationSec ??
    metadata?.audioDurationSec ??
    metadata?.duration ??
    metadata?.media_metadata?.duration
  );
  if (!Number.isFinite(raw) || raw <= 0) return null;

  // Some providers emit ms; normalize obvious millisecond values.
  const normalized = raw > 6 * 3600 ? raw / 1000 : raw;
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return normalized;
}

function getVideoAspectRatio(metadata: Record<string, any>): string | null {
  const direct = metadata?.aspectRatio ?? metadata?.aspect_ratio;
  if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();
  const width = Number(metadata?.width ?? metadata?.videoWidth ?? metadata?.resolutionWidth);
  const height = Number(metadata?.height ?? metadata?.videoHeight ?? metadata?.resolutionHeight);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const d = gcd(Math.round(width), Math.round(height));
    return `${Math.round(width / d)}:${Math.round(height / d)}`;
  }
  return null;
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
  const [dubDialogEntry, setDubDialogEntry] = useState<VideoBrowserEntry | null>(null);
  const [dubDialogOpen, setDubDialogOpen] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [languageOptions, setLanguageOptions] = useState<Array<{ code: string; name: string }>>([]);
  const [estimatedCredits, setEstimatedCredits] = useState<number | null>(null);
  const [estimateHasRuntime, setEstimateHasRuntime] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [dubbing, setDubbing] = useState(false);

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
  } = useStandaloneVideosPaginated(screenplayId, !!screenplayId);
  const standaloneFiles = useMemo(
    () => ((standalonePages?.pages ?? []) as StandaloneVideosPage[]).flatMap((p) => p.files),
    [standalonePages]
  );
  const { data: allMediaFiles = [] } = useMediaFiles(
    screenplayId,
    undefined,
    !!screenplayId,
    true
  );
  const dubbedSceneFiles = useMemo(
    () =>
      allMediaFiles.filter((file) => {
        const metadata = (file as any).metadata || {};
        const isVideo =
          (file as any).mediaFileType === 'video' ||
          (typeof file.fileType === 'string' && file.fileType.startsWith('video/'));
        return isVideo && metadata.isDubbed === true && !!metadata.sceneId;
      }),
    [allMediaFiles]
  );
  const standaloneS3Keys = useMemo(
    () => standaloneFiles.map((f) => f.s3Key).filter((k): k is string => !!k),
    [standaloneFiles]
  );
  const dubbedSceneS3Keys = useMemo(
    () => dubbedSceneFiles.map((f) => f.s3Key).filter((k): k is string => !!k),
    [dubbedSceneFiles]
  );
  const { data: standalonePresignedUrls = new Map<string, string>(), isLoading: standaloneUrlsLoading } = useBulkPresignedUrls(
    standaloneS3Keys,
    currentSection === 'standalone' && standaloneS3Keys.length > 0
  );
  const { data: dubbedScenePresignedUrls = new Map<string, string>() } = useBulkPresignedUrls(
    dubbedSceneS3Keys,
    currentSection === 'scene' && dubbedSceneS3Keys.length > 0
  );

  const mediaContextByS3Key = useMemo(() => {
    const map = new Map<string, { folderId?: string | null; sourceFileId?: string | null }>();
    for (const file of allMediaFiles) {
      if (!file?.s3Key) continue;
      map.set(file.s3Key, {
        folderId: (file as any).folderId || null,
        sourceFileId: (file as any).fileId || (file as any).id || null,
      });
    }
    return map;
  }, [allMediaFiles]);

  const sceneEntries = useMemo(() => {
    const baseSceneEntries = buildVideoEntries(scenes, presignedUrls, mediaContextByS3Key);
    const dubbedEntries = buildStandaloneEntries(dubbedSceneFiles, dubbedScenePresignedUrls);
    const existingKeys = new Set(baseSceneEntries.map((e) => e.videoS3Key));
    const dedupedDubbed = dubbedEntries.filter((e) => !existingKeys.has(e.videoS3Key));
    return [...baseSceneEntries, ...dedupedDubbed];
  }, [scenes, presignedUrls, mediaContextByS3Key, dubbedSceneFiles, dubbedScenePresignedUrls]);
  const standaloneEntries = useMemo(
    () => buildStandaloneEntries(standaloneFiles.filter((file) => !isDubbedSceneLinkedVideo(file)), standalonePresignedUrls),
    [standaloneFiles, standalonePresignedUrls]
  );

  const rawEntries = currentSection === 'scene' ? sceneEntries : standaloneEntries;
  const videoEntries = useMemo(() => {
    const nullLastNum = (x: number | null | undefined, y: number | null | undefined): number => {
      const xNull = x == null ? 1 : 0;
      const yNull = y == null ? 1 : 0;
      if (xNull !== yNull) return xNull - yNull;
      return (x ?? 0) - (y ?? 0);
    };
    const sceneThenShotCmp = (a: VideoBrowserEntry, b: VideoBrowserEntry): number => {
      const sceneCmp = nullLastNum(a.sceneNumber, b.sceneNumber);
      if (sceneCmp !== 0) return sceneCmp;
      return nullLastNum(a.shotNumber, b.shotNumber);
    };

    const sorted = [...rawEntries].sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      let primary = 0;
      switch (sortKey) {
        case 'scene':
          primary = mult * sceneThenShotCmp(a, b);
          break;
        case 'type': {
          const ta = a.videoMode ?? '';
          const tb = b.videoMode ?? '';
          primary = mult * (ta < tb ? -1 : ta > tb ? 1 : 0);
          break;
        }
        case 'provider': {
          const pa = a.providerDisplayLabel ?? getProviderLabel(a.videoProvider) ?? '—';
          const pb = b.providerDisplayLabel ?? getProviderLabel(b.videoProvider) ?? '—';
          primary = mult * (pa < pb ? -1 : pa > pb ? 1 : 0);
          break;
        }
        case 'time':
        default:
          primary = mult * (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0);
          break;
      }
      // Keep scene/shot ordering deterministic when primary sort ties.
      return primary !== 0 ? primary : sceneThenShotCmp(a, b);
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

  const sceneCount = sceneEntries.length;
  const standaloneCount = standaloneEntries.length;
  const totalCount = sceneCount + standaloneCount;

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
        if (!token) {
          toast.error('Please sign in to download');
          return;
        }
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

  useEffect(() => {
    if (!dubDialogOpen || languageOptions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const res = await fetch(`${BACKEND_API_URL}/api/audio/languages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.languages)) {
          setLanguageOptions(data.languages);
        }
      } catch {
        // non-fatal
      }
    })();
    return () => { cancelled = true; };
  }, [dubDialogOpen, languageOptions.length, getToken]);

  useEffect(() => {
    if (!dubDialogOpen || !dubDialogEntry) return;
    let cancelled = false;
    (async () => {
      try {
        setEstimating(true);
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return;
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const res = await fetch(`${BACKEND_API_URL}/api/audio/dub/estimate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceLanguage,
            targetLanguage,
            screenplayId,
            sourceS3Key: dubDialogEntry.videoS3Key,
            sourceFileId: dubDialogEntry.sourceFileId,
            sourceDurationSec: dubDialogEntry.sourceDurationSec,
          }),
        });
        if (!res.ok) throw new Error('Failed to estimate dubbing cost');
        const data = await res.json();
        if (!cancelled) {
          setEstimatedCredits(Number(data?.estimatedCredits || 0));
          setEstimateHasRuntime(Number(data?.estimatedDurationSec || 0) > 0);
        }
      } catch (err: any) {
        if (!cancelled) {
          setEstimatedCredits(null);
          setEstimateHasRuntime(false);
          toast.error(err?.message || 'Failed to estimate dubbing');
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dubDialogOpen, dubDialogEntry, sourceLanguage, targetLanguage, screenplayId, getToken]);

  const handleOpenDubDialog = useCallback((entry: VideoBrowserEntry) => {
    setDubDialogEntry(entry);
    setDubDialogOpen(true);
  }, []);

  const handleConfirmDub = useCallback(async () => {
    if (!dubDialogEntry || !dubDialogEntry.videoS3Key || !screenplayId) return;
    setDubbing(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Please sign in');
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

      const presignedRes = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ s3Key: dubDialogEntry.videoS3Key, expiresIn: 3600 }),
      });
      if (!presignedRes.ok) throw new Error('Failed to access source video');
      const presignedData = await presignedRes.json();
      const sourceUrl = presignedData.downloadUrl;
      if (!sourceUrl) throw new Error('Source URL unavailable');

      const dubRes = await fetch(`${BACKEND_API_URL}/api/audio/dub`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          async: true,
          screenplayId,
          sourceType: 'dialogue-video',
          sourceLanguage,
          targetLanguage,
          audioUrl: sourceUrl,
          sourceS3Key: dubDialogEntry.videoS3Key,
          sourceFileId: dubDialogEntry.sourceFileId,
          sourceFileName: dubDialogEntry.videoFileName,
          sourceProviderDisplayLabel: dubDialogEntry.providerDisplayLabel,
          folderId: dubDialogEntry.folderId,
          sceneId: dubDialogEntry.sceneId,
          sceneHeading: dubDialogEntry.sceneHeading,
          sceneNumber: dubDialogEntry.sceneNumber,
          shotNumber: dubDialogEntry.shotNumber,
        }),
      });
      if (!dubRes.ok) {
        const err = await dubRes.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to start dubbing');
      }
      const data = await dubRes.json();
      if (typeof window !== 'undefined' && data?.jobId) {
        window.dispatchEvent(new CustomEvent('wryda:optimistic-job', {
          detail: {
            jobId: data.jobId,
            screenplayId,
            jobType: 'dubbing',
            assetName: `Dubbing - ${targetLanguage.toUpperCase()}`,
          }
        }));
      }
      toast.success(`Dubbing started${data?.jobId ? ` (Job ${String(data.jobId).slice(-8)})` : ''}`);
      setDubDialogOpen(false);
      setDubDialogEntry(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start dubbing');
    } finally {
      setDubbing(false);
    }
  }, [dubDialogEntry, screenplayId, sourceLanguage, targetLanguage, getToken]);

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
      {/* Header: desktop single-row, mobile stacked for tap-friendly controls */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#3F3F46] flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={presignedUrlsLoading}
          className="order-1 self-end sm:order-3 sm:self-auto sm:ml-auto flex items-center gap-2 px-3 py-1.5 text-sm text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A] rounded transition-colors disabled:opacity-50"
          title="Refresh videos"
          aria-label="Refresh videos"
        >
          <RefreshCw className={cn('w-4 h-4', presignedUrlsLoading && 'animate-spin')} />
          Refresh
        </button>
        <div className="order-2 sm:order-1 inline-flex w-full sm:w-auto items-center rounded-md border border-[#3F3F46] bg-[#141414] p-0.5">
          <button
            type="button"
            onClick={() => setCurrentSection('scene')}
            className={cn(
              'flex-1 sm:flex-none text-center px-3 py-2 sm:py-1.5 text-xs rounded transition-colors',
              currentSection === 'scene'
                ? 'text-white bg-[#262626]'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A]'
            )}
            aria-pressed={currentSection === 'scene'}
            title="Show scene videos"
            aria-label="Show scene videos"
          >
            <span className="sm:hidden">Scene ({sceneCount})</span>
            <span className="hidden sm:inline">Scene Videos ({sceneCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentSection('standalone')}
            className={cn(
              'flex-1 sm:flex-none text-center px-3 py-2 sm:py-1.5 text-xs rounded transition-colors',
              currentSection === 'standalone'
                ? 'text-white bg-[#262626]'
                : 'text-[#B3B3B3] hover:text-white hover:bg-[#1A1A1A]'
            )}
            aria-pressed={currentSection === 'standalone'}
            title="Show standalone videos"
            aria-label="Show standalone videos"
          >
            <span className="sm:hidden">Standalone ({standaloneCount})</span>
            <span className="hidden sm:inline">Standalone Videos ({standaloneCount})</span>
          </button>
        </div>
        <span className="order-3 sm:order-2 hidden sm:inline text-xs text-[#808080] whitespace-nowrap">
          {totalCount} total video{totalCount !== 1 ? 's' : ''}
        </span>
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
            <div className="flex items-center gap-4 px-4 py-2 text-xs font-medium text-[#808080] border-b border-[#3F3F46] mb-2">
              <button type="button" onClick={() => handleSort('scene')} className="flex items-center gap-1 w-16 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Scene {sortKey === 'scene' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <span className="w-14 flex-shrink-0 text-left">Shot</span>
              <button type="button" onClick={() => handleSort('type')} className="flex items-center gap-1 w-28 flex-shrink-0 text-left hover:text-[#B3B3B3]">
                Type {sortKey === 'type' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <button type="button" onClick={() => handleSort('provider')} className="flex items-center gap-1 w-24 sm:w-32 flex-shrink-0 text-left sm:whitespace-nowrap hover:text-[#B3B3B3]">
                Provider {sortKey === 'provider' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
              </button>
              <span className="w-16 flex-shrink-0 text-left">Aspect Ratio</span>
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
                    {(entry.videoMode === 'image-start' || entry.providerDisplayLabel === 'Dialogue' || entry.providerDisplayLabel === 'Premium Dialogue') && (
                      <span className="text-[10px] font-medium text-sky-500/90 bg-sky-500/10 px-2 py-0.5 rounded" title="Image-to-video">
                        Image-to-video
                      </span>
                    )}
                    {entry.videoMode === 'reference-images' && (
                      <span className="text-[10px] font-medium text-violet-500/90 bg-violet-500/10 px-2 py-0.5 rounded" title="Elements">
                        Elements
                      </span>
                    )}
                    {(entry.videoMode === 'text-only' || !entry.videoMode) && entry.providerDisplayLabel !== 'Dialogue' && entry.providerDisplayLabel !== 'Premium Dialogue' && (
                      <span className="text-[10px] font-medium text-amber-500/90 bg-amber-500/10 px-2 py-0.5 rounded" title="Text-to-video">
                        Text-to-video
                      </span>
                    )}
                    {entry.videoMode && !['image-interpolation', 'image-start', 'reference-images', 'text-only'].includes(entry.videoMode) && entry.providerDisplayLabel !== 'Dialogue' && entry.providerDisplayLabel !== 'Premium Dialogue' && (
                      <span className="text-[10px] font-medium text-[#808080] bg-[#262626] px-2 py-0.5 rounded" title={entry.videoMode}>
                        Video
                      </span>
                    )}
                  </span>
                  <span
                    className="text-xs text-[#808080] w-24 sm:w-32 flex-shrink-0 whitespace-normal break-words sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis"
                    title={entry.providerDisplayLabel ?? getProviderLabel(entry.videoProvider)}
                  >
                    {entry.providerDisplayLabel ?? getProviderLabel(entry.videoProvider)}
                  </span>
                  <span className="text-xs text-[#808080] w-16 flex-shrink-0">
                    {entry.aspectRatio || '—'}
                  </span>
                  <span className="text-[10px] text-[#808080] flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    {entry.isDubbed ? (
                      <span
                        className="px-2.5 py-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded"
                        title={entry.dubbedLanguage ? `Dubbed: ${entry.dubbedLanguage}` : 'Already dubbed'}
                      >
                        {entry.dubbedLanguage || 'Dubbed'}
                      </span>
                    ) : (entry.providerDisplayLabel === 'Dialogue' || entry.providerDisplayLabel === 'Premium Dialogue') && (
                      <button
                        type="button"
                        onClick={() => handleOpenDubDialog(entry)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white bg-[#1F1F1F] border border-[#3F3F46] hover:border-[#DC143C] hover:text-[#DC143C] rounded transition-colors"
                        aria-label="Dub video"
                      >
                        Dub
                      </button>
                    )}
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
                      className="p-1.5 text-[#808080] hover:text-white hover:bg-[#262626] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Download video"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(entry)}
                      disabled={deletingKey === entry.entryKey}
                      className="p-1.5 text-[#DC143C]/90 hover:text-[#DC143C] hover:bg-[#DC143C]/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Delete video"
                      title="Delete"
                    >
                      {deletingKey === entry.entryKey ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
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

      {/* Dubbing modal */}
      <Dialog open={dubDialogOpen} onOpenChange={(open) => { if (!dubbing) setDubDialogOpen(open); }}>
        <DialogContent className="max-w-md bg-[#141414] border-[#3F3F46]">
          <DialogHeader>
            <DialogTitle>Dub Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-[#B3B3B3]">
              {dubDialogEntry?.videoFileName || 'Selected video'}
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#B3B3B3]">Source Language</label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage} disabled={dubbing}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#3F3F46]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(languageOptions.length ? languageOptions : [{ code: 'en', name: 'English' }]).map((l) => (
                    <SelectItem key={`src-${l.code}`} value={l.code}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#B3B3B3]">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={dubbing}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#3F3F46]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(languageOptions.length ? languageOptions : [{ code: 'es', name: 'Spanish' }]).map((l) => (
                    <SelectItem key={`tgt-${l.code}`} value={l.code}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-[#808080]">
              {estimating
                ? 'Estimating cost...'
                : estimateHasRuntime && estimatedCredits
                  ? `Estimated cost: ${estimatedCredits} credits`
                  : 'Final charge is calculated from runtime after processing'}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDubDialogOpen(false)}
                disabled={dubbing}
                className="px-3 py-1.5 text-xs rounded border border-[#3F3F46] text-[#B3B3B3] hover:bg-[#1A1A1A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDub}
                disabled={dubbing || estimating}
                className="px-3 py-1.5 text-xs rounded bg-[#DC143C] text-white hover:bg-[#B0111E] disabled:opacity-50"
              >
                {dubbing
                  ? 'Starting...'
                  : estimateHasRuntime && estimatedCredits
                    ? `Charge ${estimatedCredits} & Start`
                    : 'Start Dubbing'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
