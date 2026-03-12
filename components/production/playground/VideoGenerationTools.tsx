'use client';

/**
 * Video Generation Tools
 *
 * Generate video with model selection, aspect ratio, and quality. Uses GET /api/video/models.
 * Only models that generate from scratch are shown (Runway Aleph is excluded – it needs a
 * source video and is used in "modify video" flows). Sends preferredProvider for the chosen model.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Video, Image as ImageIcon, Loader2, Upload, X, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getEstimatedDuration } from '@/utils/jobTimeEstimates';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useAuth } from '@clerk/nextjs';
import { GenerationPreview } from './GenerationPreview';
import { extractCreditError, getCreditErrorDisplayMessage, syncCreditsFromError } from '@/utils/creditGuard';
import { uploadToObjectStorage } from '@/lib/objectStorageUpload';

/** Capabilities from GET /api/video/models (used for mode-based model filtering). */
interface VideoModelCapabilities {
  imageInterpolation?: boolean;
  imageStart?: boolean;
  textOnly?: boolean;
  [key: string]: unknown;
}

interface VideoModel {
  id: string;
  label: string;
  description?: string;
  provider: string;
  durations: number[];
  creditsMap: Record<number, number>;
  aspectRatios?: string[];
  resolutions?: string[];
  requiresSourceVideo?: boolean;
  recommended?: boolean;
  capabilities?: VideoModelCapabilities;
}

interface VideoGenerationToolsProps {
  className?: string;
  screenplayId?: string;
  /** Pre-fill starting frame from Shot Board (presigned URL) */
  initialStartImageUrl?: string;
  /** Optional line context handoff from Shot Board variation */
  initialLineText?: string;
  initialLineType?: string;
  /** Optional: scene/shot context for job placement and labeling */
  sceneId?: string;
  sceneNumber?: number;  // Feature 0241: Scene number for Media Library folder structure
  sceneName?: string;
  shotNumber?: number;
}

type VideoMode = 'text-to-video' | 'starting-frame' | 'frame-to-frame';
type DirectVideoAttemptStatus = 'queued' | 'running' | 'success' | 'failed';

interface DirectVideoAttempt {
  id: string;
  jobId?: string;
  status: DirectVideoAttemptStatus;
  message: string;
  at: string;
  videoUrl?: string;
}

const DEFAULT_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '21:9', '9:21', '4:3', '3:4'];
const DIRECT_VIDEO_ATTEMPTS_RETENTION_MS = 12 * 60 * 60 * 1000;

/** Single camera option: id is Luma concept key (or '' for None). Same dropdown for all providers; Luma gets concept, others get promptText. */
interface CameraOption {
  id: string;
  label: string;
  promptText: string;
}

/** Luma API concepts as baseline (Plan 0257). Order: None, then alphabetical by label. */
const LUMA_CAMERA_OPTIONS: CameraOption[] = [
  { id: '', label: 'None', promptText: '' },
  { id: 'aerial', label: 'Aerial', promptText: 'aerial shot, bird\'s eye view from above' },
  { id: 'aerial_drone', label: 'Aerial Drone', promptText: 'aerial drone shot, flying camera' },
  { id: 'bolt_cam', label: 'Bolt Cam', promptText: 'fast bolt cam style movement' },
  { id: 'crane_down', label: 'Crane Down', promptText: 'crane shot descending from high to low' },
  { id: 'crane_up', label: 'Crane Up', promptText: 'crane shot rising from low to high' },
  { id: 'dolly_zoom', label: 'Dolly Zoom', promptText: 'dolly zoom, vertigo effect' },
  { id: 'elevator_doors', label: 'Elevator Doors', promptText: 'elevator doors style opening' },
  { id: 'eye_level', label: 'Eye Level', promptText: 'eye level shot, neutral height' },
  { id: 'ground_level', label: 'Ground Level', promptText: 'ground level shot, low to the ground' },
  { id: 'handheld', label: 'Handheld', promptText: 'handheld camera, documentary style' },
  { id: 'high_angle', label: 'High Angle', promptText: 'high angle shot, camera looking down' },
  { id: 'low_angle', label: 'Low Angle', promptText: 'low angle shot, camera looking up' },
  { id: 'orbit_left', label: 'Orbit Left', promptText: 'camera orbits left around subject' },
  { id: 'orbit_right', label: 'Orbit Right', promptText: 'camera orbits right around subject' },
  { id: 'over_the_shoulder', label: 'Over the Shoulder', promptText: 'over the shoulder shot' },
  { id: 'overhead', label: 'Overhead', promptText: 'overhead shot, directly above' },
  { id: 'pan_left', label: 'Pan Left', promptText: 'camera pans left' },
  { id: 'pan_right', label: 'Pan Right', promptText: 'camera pans right' },
  { id: 'pedestal_down', label: 'Pedestal Down', promptText: 'pedestal down, camera lowers vertically' },
  { id: 'pedestal_up', label: 'Pedestal Up', promptText: 'pedestal up, camera raises vertically' },
  { id: 'pov', label: 'Point of View', promptText: 'point of view, first-person perspective' },
  { id: 'pull_out', label: 'Pull Out', promptText: 'camera pulls out, dolly back' },
  { id: 'push_in', label: 'Push In', promptText: 'camera pushes in, dolly forward' },
  { id: 'roll_left', label: 'Roll Left', promptText: 'camera rolls left' },
  { id: 'roll_right', label: 'Roll Right', promptText: 'camera rolls right' },
  { id: 'selfie', label: 'Selfie', promptText: 'selfie style, camera facing subject' },
  { id: 'static', label: 'Static', promptText: 'static shot, no camera movement' },
  { id: 'tilt_down', label: 'Tilt Down', promptText: 'camera tilts down' },
  { id: 'tilt_up', label: 'Tilt Up', promptText: 'camera tilts up' },
  { id: 'tiny_planet', label: 'Tiny Planet', promptText: 'tiny planet effect, 360 wrap' },
  { id: 'truck_left', label: 'Truck Left', promptText: 'camera trucks left, lateral move' },
  { id: 'truck_right', label: 'Truck Right', promptText: 'camera trucks right, lateral move' },
  { id: 'zoom_in', label: 'Zoom In', promptText: 'zoom in toward subject' },
  { id: 'zoom_out', label: 'Zoom Out', promptText: 'zoom out from subject' },
];

export function VideoGenerationTools({
  className = '',
  screenplayId: propScreenplayId,
  initialStartImageUrl,
  initialLineText,
  initialLineType,
  sceneId: propSceneId,
  sceneNumber: propSceneNumber,
  sceneName: propSceneName,
  shotNumber: propShotNumber,
}: VideoGenerationToolsProps) {
  const screenplay = useScreenplay();
  const screenplayId = propScreenplayId || screenplay.screenplayId;
  const { getToken } = useAuth();

  const [activeMode, setActiveMode] = useState<VideoMode>('starting-frame');
  const [prompt, setPrompt] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [selectedResolution, setSelectedResolution] = useState<string>('1080p');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<VideoModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [videoModelDropdownOpen, setVideoModelDropdownOpen] = useState(false);
  const videoModelDropdownRef = useRef<HTMLDivElement>(null);
  const videoModelTriggerRef = useRef<HTMLButtonElement>(null);
  const [videoModelDropdownDirection, setVideoModelDropdownDirection] = useState<'up' | 'down'>('down');
  const [videoModelDropdownMaxHeight, setVideoModelDropdownMaxHeight] = useState(240);

  // Close Video Model dropdown when clicking outside
  useEffect(() => {
    if (!videoModelDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (videoModelDropdownRef.current && !videoModelDropdownRef.current.contains(e.target as Node)) {
        setVideoModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [videoModelDropdownOpen]);

  // Starting Frame mode: either uploaded (file + s3Key) or from prop (URL only)
  const [startImage, setStartImage] = useState<{ file: File; preview: string; s3Key?: string } | null>(null);
  const [startImageUrlFromProp, setStartImageUrlFromProp] = useState<string | null>(null);
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const lineContextText = typeof initialLineText === 'string' ? initialLineText.trim() : '';
  const lineContextType = typeof initialLineType === 'string' ? initialLineType.trim() : '';

  // When initialStartImageUrl is provided (e.g. from Shot Board), pre-fill starting frame
  useEffect(() => {
    if (initialStartImageUrl?.trim()) {
      setStartImageUrlFromProp(initialStartImageUrl);
      setStartImage(null);
    }
  }, [initialStartImageUrl]);

  // When switching to Frame to Frame, carry over the current starting frame into Frame 1 so it persists
  const handleSwitchToFrameToFrame = () => {
    setActiveMode('frame-to-frame');
    if (startImage) {
      setFrame1({ file: startImage.file, preview: startImage.preview, s3Key: startImage.s3Key });
    } else if (startImageUrlFromProp) {
      setFrame1({ preview: startImageUrlFromProp });
    }
  };

  // Frame to Frame mode (frame1 can be URL-only when carried over from Starting Frame)
  const [frame1, setFrame1] = useState<{ file?: File; preview: string; s3Key?: string } | null>(null);
  const [frame2, setFrame2] = useState<{ file?: File; preview: string; s3Key?: string } | null>(null);
  const frame1InputRef = useRef<HTMLInputElement>(null);
  const frame2InputRef = useRef<HTMLInputElement>(null);

  // Generated video state
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | undefined>(undefined);
  const [pendingGenerationJobId, setPendingGenerationJobId] = useState<string | null>(null);
  const [generationStartedAtMs, setGenerationStartedAtMs] = useState<number | null>(null);
  const [latestCompletedJobId, setLatestCompletedJobId] = useState<string | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<DirectVideoAttempt[]>([]);
  const [attemptsHydrated, setAttemptsHydrated] = useState(false);
  const activeAttemptPollsRef = useRef<Set<string>>(new Set());
  const lastHydrateAtMsRef = useRef(0);
  const pendingReconcileMissRef = useRef<{ jobId: string | null; misses: number }>({
    jobId: null,
    misses: 0,
  });

  const getDismissedLatestVideoStorageKey = () =>
    `wryda:dismissed-latest-video:${screenplayId || 'default'}`;
  const getVideoAttemptsStorageKey = () =>
    `direct-video-gen:attempts:${screenplayId || 'default'}`;
  const getVideoActiveGenerationStorageKey = () =>
    `direct-video-gen:active-generation:${screenplayId || 'default'}`;

  const normalizeVideoAttemptStatus = (status: unknown): DirectVideoAttemptStatus => {
    const value = String(status || '').toLowerCase();
    if (value === 'queued') return 'queued';
    if (
      value === 'running' ||
      value === 'processing' ||
      value === 'pending' ||
      value === 'generating' ||
      value === 'enhancing' ||
      value === 'in_progress' ||
      value === 'submitted' ||
      value === 'starting' ||
      value === 'rendering' ||
      value === 'finalizing' ||
      value === 'accepted'
    ) {
      return 'running';
    }
    if (value === 'completed' || value === 'succeeded' || value === 'success') return 'success';
    return 'failed';
  };

  const upsertVideoAttempt = (attempt: DirectVideoAttempt) => {
    setRecentAttempts((prev) => {
      const withoutExisting = prev.filter(
        (item) => item.id !== attempt.id && !(attempt.jobId && item.jobId && item.jobId === attempt.jobId)
      );
      const now = Date.now();
      return [attempt, ...withoutExisting]
        .filter((item) => {
          const atMs = new Date(item.at || 0).getTime();
          return Number.isFinite(atMs) && now - atMs <= DIRECT_VIDEO_ATTEMPTS_RETENTION_MS;
        })
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, 20);
    });
  };

  const upsertVideoAttemptFromJob = (job: any) => {
    if (!job) return;
    const jobId = String(job.jobId || job.id || '');
    if (!jobId) return;
    const status = normalizeVideoAttemptStatus(job.status);
    const videoUrl = job?.videos?.[0]?.videoUrl;
    const errorMessage = job?.error?.message || job?.error?.userMessage || job?.error;
    upsertVideoAttempt({
      id: `job_${jobId}`,
      jobId,
      status,
      message:
        status === 'success'
          ? 'Video generated successfully.'
          : status === 'running' || status === 'queued'
            ? 'Video generation in progress...'
            : `Failed: ${String(errorMessage || 'generation error')}`,
      at: job.completedAt || job.updatedAt || job.createdAt || new Date().toISOString(),
      videoUrl: typeof videoUrl === 'string' && videoUrl.length > 0 ? videoUrl : undefined,
    });
  };

  const isJobRelevantToPanel = (job: any): boolean => {
    if (!job) return false;
    if (propSceneId && job.sceneId) {
      return String(job.sceneId) === String(propSceneId);
    }
    const sceneId = String(job.sceneId || '');
    const sceneName = String(job.sceneName || '');
    const sameScreenplay = screenplayId ? String(job.screenplayId || '') === String(screenplayId) : true;
    if (!sameScreenplay) return false;
    return sceneId.startsWith('playground_') || /playground/i.test(sceneName);
  };

  const dismissLatestGeneratedVideo = () => {
    setGeneratedVideoUrl(null);
    if (typeof window === 'undefined') return;
    if (latestCompletedJobId) {
      sessionStorage.setItem(getDismissedLatestVideoStorageKey(), latestCompletedJobId);
    }
  };

  const clearDismissedLatestVideo = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(getDismissedLatestVideoStorageKey());
  };

  // Load latest completed video on mount so "Latest generated" shows the previous one
  useEffect(() => {
    let cancelled = false;
    const loadLatestCompleted = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token || cancelled) return;
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        const response = await apiModule.video.getJobs({ limit: 1, status: 'completed' });
        const data = response?.data ?? response;
        if (cancelled || !data?.success || !Array.isArray(data.jobs) || data.jobs.length === 0) return;
        const job = data.jobs[0];
        const completedJobId = job?.jobId || job?.id || null;
        setLatestCompletedJobId(completedJobId);
        const dismissedJobId =
          typeof window !== 'undefined'
            ? sessionStorage.getItem(getDismissedLatestVideoStorageKey())
            : null;
        if (completedJobId && dismissedJobId && dismissedJobId === completedJobId) {
          return;
        }
        const videoUrl = job.videos?.[0]?.videoUrl;
        if (videoUrl) {
          setGeneratedVideoUrl(videoUrl);
          // Optional: set generation time from metadata if available
          const meta = job.videos?.[0]?.assetMetadata;
          if (meta?.generationTime != null) setGenerationTime(meta.generationTime);
        }
      } catch (e) {
        if (!cancelled) console.warn('[VideoGen] Load latest completed job:', e);
      }
    };
    loadLatestCompleted();
    return () => { cancelled = true; };
  }, [screenplayId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setAttemptsHydrated(true);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(getVideoAttemptsStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const retained = (Array.isArray(parsed) ? parsed : [])
        .filter((item): item is DirectVideoAttempt => !!item && typeof item === 'object')
        .filter((item) => {
          const atMs = new Date(item.at || 0).getTime();
          return Number.isFinite(atMs) && now - atMs <= DIRECT_VIDEO_ATTEMPTS_RETENTION_MS;
        })
        .slice(0, 20);
      setRecentAttempts(retained);
    } catch {
      setRecentAttempts([]);
    } finally {
      setAttemptsHydrated(true);
    }
  }, [screenplayId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = getVideoActiveGenerationStorageKey();
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { jobId?: string; startedAtMs?: number };
      const restoredJobId = parsed?.jobId ? String(parsed.jobId).trim() : '';
      const startedAtMs = Number(parsed?.startedAtMs || 0);
      if (!Number.isFinite(startedAtMs) || startedAtMs <= 0) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      // Without a jobId we cannot reconcile terminal status after refresh; clear stale pending marker.
      if (!restoredJobId) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      if (Date.now() - startedAtMs > 24 * 60 * 60 * 1000) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      setGenerationStartedAtMs(startedAtMs);
      setGenerationTime((Date.now() - startedAtMs) / 1000);
      setPendingGenerationJobId(restoredJobId);
      setIsGenerating(true);
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [screenplayId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !attemptsHydrated) return;
    const now = Date.now();
    const retained = recentAttempts
      .filter((item) => {
        const atMs = new Date(item.at || 0).getTime();
        return Number.isFinite(atMs) && now - atMs <= DIRECT_VIDEO_ATTEMPTS_RETENTION_MS;
      })
      .slice(0, 20);
    window.sessionStorage.setItem(getVideoAttemptsStorageKey(), JSON.stringify(retained));
  }, [attemptsHydrated, recentAttempts, screenplayId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = getVideoActiveGenerationStorageKey();
    if (!isGenerating || !generationStartedAtMs || !pendingGenerationJobId) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        jobId: pendingGenerationJobId,
        startedAtMs: generationStartedAtMs,
      })
    );
  }, [screenplayId, isGenerating, pendingGenerationJobId, generationStartedAtMs]);

  useEffect(() => {
    if (!isGenerating || !generationStartedAtMs) return;
    setGenerationTime((Date.now() - generationStartedAtMs) / 1000);
    const interval = window.setInterval(() => {
      setGenerationTime((Date.now() - generationStartedAtMs) / 1000);
    }, 250);
    return () => window.clearInterval(interval);
  }, [isGenerating, generationStartedAtMs]);

  useEffect(() => {
    if (!screenplayId || !attemptsHydrated) return;
    let cancelled = false;

    const pollVideoJobUntilTerminal = (jobId: string) => {
      if (!jobId) return;
      if (activeAttemptPollsRef.current.has(jobId)) {
        window.setTimeout(() => {
          if (!cancelled) {
            pollVideoJobUntilTerminal(jobId);
          }
        }, 3000);
        return;
      }
      activeAttemptPollsRef.current.add(jobId);
      void (async () => {
        try {
          const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
          setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
          const startedAt = Date.now();
          while (!cancelled && Date.now() - startedAt < 20 * 60 * 1000) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            if (cancelled) return;
            const response = await apiModule.video.getJobStatus(jobId);
            const payload = response?.data ?? response;
            const job = payload?.job;
            if (!job || cancelled) continue;
            upsertVideoAttemptFromJob(job);
            const status = normalizeVideoAttemptStatus(job.status);
            if (status === 'success' || status === 'failed') {
              if (status === 'success' && typeof job?.videos?.[0]?.videoUrl === 'string') {
                clearDismissedLatestVideo();
                setGeneratedVideoUrl(job.videos[0].videoUrl);
              }
              return;
            }
          }
        } catch {
          // Non-fatal; background panel should remain stable.
        } finally {
          activeAttemptPollsRef.current.delete(jobId);
        }
      })();
    };

    const hydrateVideoJobs = async () => {
      try {
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        const response = await apiModule.video.getJobs({ limit: 20 });
        const payload = response?.data ?? response;
        const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
        const backendJobIds = new Set(
          jobs
            .map((job: any) => String(job?.jobId || job?.id || ''))
            .filter((jobId: string) => jobId.length > 0)
        );
        jobs.filter((job: any) => isJobRelevantToPanel(job)).slice(0, 12).forEach((job: any) => {
          upsertVideoAttemptFromJob(job);
          const status = normalizeVideoAttemptStatus(job.status);
          if (status === 'success' && typeof job?.videos?.[0]?.videoUrl === 'string') {
            clearDismissedLatestVideo();
            setGeneratedVideoUrl(job.videos[0].videoUrl);
          }
          if (status === 'running' || status === 'queued') {
            pollVideoJobUntilTerminal(String(job.jobId || job.id || ''));
          }
        });

        // Recovery guard: clear stale local "running" state when backend no longer has this job.
        if (
          pendingGenerationJobId &&
          generationStartedAtMs &&
          Date.now() - generationStartedAtMs > 120000 &&
          !backendJobIds.has(String(pendingGenerationJobId))
        ) {
          if (pendingReconcileMissRef.current.jobId !== pendingGenerationJobId) {
            pendingReconcileMissRef.current = { jobId: pendingGenerationJobId, misses: 1 };
          } else {
            pendingReconcileMissRef.current = {
              jobId: pendingGenerationJobId,
              misses: pendingReconcileMissRef.current.misses + 1,
            };
          }

          if (pendingReconcileMissRef.current.misses >= 3) {
            upsertVideoAttempt({
              id: `job_${pendingGenerationJobId}`,
              jobId: pendingGenerationJobId,
              status: 'failed',
              message: 'Failed: generation state could not be reconciled after refresh.',
              at: new Date().toISOString(),
            });
            setIsGenerating(false);
            setPendingGenerationJobId(null);
            setGenerationStartedAtMs(null);
            pendingReconcileMissRef.current = { jobId: null, misses: 0 };
          }
        } else if (
          !pendingGenerationJobId ||
          backendJobIds.has(String(pendingGenerationJobId))
        ) {
          pendingReconcileMissRef.current = { jobId: null, misses: 0 };
        }
      } catch {
        // Ignore hydration failures to avoid blocking panel render.
      }
    };

    const now = Date.now();
    if (now - lastHydrateAtMsRef.current > 10000) {
      lastHydrateAtMsRef.current = now;
      void hydrateVideoJobs();
    }
    recentAttempts
      .filter((attempt) => attempt.jobId && (attempt.status === 'running' || attempt.status === 'queued'))
      .forEach((attempt) => pollVideoJobUntilTerminal(String(attempt.jobId)));

    return () => {
      cancelled = true;
    };
  }, [attemptsHydrated, recentAttempts, screenplayId, getToken, propSceneId, pendingGenerationJobId, generationStartedAtMs]);

  useEffect(() => {
    if (!pendingGenerationJobId) return;
    const matchingAttempt = recentAttempts.find((attempt) => attempt.jobId === pendingGenerationJobId);
    if (!matchingAttempt) return;
    if (matchingAttempt.status !== 'success' && matchingAttempt.status !== 'failed') return;

    if (generationStartedAtMs) {
      const elapsed = (Date.now() - generationStartedAtMs) / 1000;
      setGenerationTime(elapsed);
    }
    setIsGenerating(false);
    setPendingGenerationJobId(null);
    setGenerationStartedAtMs(null);
  }, [pendingGenerationJobId, recentAttempts, generationStartedAtMs]);

  // Fetch video models (exclude requiresSourceVideo for "generate from scratch")
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
        setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
        const response = await apiModule.video.getModels();
        const list = response?.data?.models ?? response?.data?.data?.models ?? [];
        // Only models that generate from scratch (no Runway Aleph – that one needs a source video and is used in "modify video" flows)
        const filtered = (Array.isArray(list) ? list : []).filter(
          (m: VideoModel) => !m.requiresSourceVideo
        );
        // Use "Grok Video (xAI)" so it sorts A–Z right under Google (no custom order)
        const withLabels = filtered.map((m: VideoModel) =>
          m.id === 'grok-imagine-video' ? { ...m, label: 'Grok Video (xAI)' } : m
        );
        const sorted = [...withLabels].sort((a: VideoModel, b: VideoModel) =>
          (a.label || a.id).localeCompare(b.label || b.id)
        );
        setModels(sorted);
        if (sorted.length > 0) {
          setSelectedModel((prev) => {
            const stillValid = prev && sorted.some((m: VideoModel) => m.id === prev);
            return stillValid ? prev : sorted[sorted.length - 1].id;
          });
        } else {
          setSelectedModel('');
        }
      } catch (e) {
        console.error('Failed to load video models', e);
        toast.error('Failed to load video models');
        setModels([]);
        setSelectedModel('');
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [getToken]);

  // When Frame to Frame is selected, show only models that support image-interpolation (Plan 0257).
  const displayModels = useMemo(() => {
    const list = models;
    if (activeMode === 'text-to-video') {
      return list.filter((m) => m.capabilities?.textOnly === true);
    }
    if (activeMode === 'starting-frame') {
      return list.filter((m) => m.capabilities?.imageStart === true);
    }
    return list.filter((m) => m.capabilities?.imageInterpolation === true);
  }, [models, activeMode]);

  // Keep dropdown inside viewport: open upward when near bottom and clamp menu height to available space.
  useEffect(() => {
    if (!videoModelDropdownOpen) return;

    const updateDropdownPosition = () => {
      const trigger = videoModelTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const edgePadding = 12;
      const minUsableHeight = 120;
      const targetHeight = 240;
      const estimatedOptionHeight = 42;
      const desiredHeight = Math.min(targetHeight, Math.max(minUsableHeight, displayModels.length * estimatedOptionHeight));
      const spaceBelow = Math.max(0, viewportHeight - rect.bottom - edgePadding);
      const spaceAbove = Math.max(0, rect.top - edgePadding);

      const openUp =
        (spaceBelow < desiredHeight && spaceAbove > spaceBelow) ||
        (spaceBelow < minUsableHeight && spaceAbove >= minUsableHeight);
      const availableSpace = openUp ? spaceAbove : spaceBelow;
      const clampedHeight = Math.max(0, Math.min(targetHeight, desiredHeight, availableSpace || targetHeight));

      setVideoModelDropdownDirection(openUp ? 'up' : 'down');
      setVideoModelDropdownMaxHeight(clampedHeight);
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [videoModelDropdownOpen, displayModels.length]);

  // Keep selection valid: if current model is not in the displayed list, reset to the newest alphabetical option.
  useEffect(() => {
    if (displayModels.length === 0) return;
    const isCurrentInList = selectedModel && displayModels.some((m) => m.id === selectedModel);
    if (!isCurrentInList) {
      setSelectedModel(displayModels[displayModels.length - 1].id);
    }
  }, [activeMode, displayModels, selectedModel]);

  const selectedModelInfo = selectedModel ? models.find((m) => m.id === selectedModel) : null;
  const aspectRatioOptions = selectedModelInfo?.aspectRatios?.length
    ? selectedModelInfo.aspectRatios
    : DEFAULT_ASPECT_RATIOS;
  const durationOptions = selectedModelInfo?.durations?.length
    ? selectedModelInfo.durations
    : [5, 10];
  const resolutionOptions = selectedModelInfo?.resolutions?.length
    ? selectedModelInfo.resolutions
    : ['1080p'];

  // When model changes, clamp duration, aspect ratio, and resolution to model's supported values
  useEffect(() => {
    if (!selectedModel) return;
    const info = models.find((m) => m.id === selectedModel);
    if (info?.durations?.length && !info.durations.includes(selectedDuration)) {
      setSelectedDuration(info.durations[0]);
    }
    if (info?.aspectRatios?.length && !info.aspectRatios.includes(aspectRatio)) {
      setAspectRatio(info.aspectRatios[0]);
    }
    if (info?.resolutions?.length && !info.resolutions.includes(selectedResolution)) {
      setSelectedResolution(info.resolutions[0]);
    }
  }, [selectedModel]);

  // Credits: use selected model's creditsMap from API (same source as backend charge). Fallback only when map missing or duration not in map.
  const getTotalCredits = (): number => {
    const map = selectedModelInfo?.creditsMap;
    if (map && typeof map[selectedDuration] === 'number') {
      return map[selectedDuration];
    }
    if (map && Object.keys(map).length > 0) {
      const durations = Object.keys(map).map(Number).sort((a, b) => a - b);
      const nearest = durations.reduce((prev, d) => (Math.abs(d - selectedDuration) < Math.abs(prev - selectedDuration) ? d : prev));
      return map[nearest] ?? 50;
    }
    return selectedDuration === 5 ? 50 : 100;
  };

  // Luma-baseline camera options (Plan 0257): one list for all providers. id = Luma concept key; Luma gets native concept, others get promptText.
  const cameraAngles = LUMA_CAMERA_OPTIONS;

  // Format camera angle for video prompts
  const formatCameraAngleForVideo = (angleId: string): string => {
    if (!angleId) return '';
    const angle = cameraAngles.find(a => a.id === angleId);
    if (!angle) return '';
    // Simple, direct formatting (backend handles model-specific optimization)
    return `${angle.promptText}, `;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) throw new Error('Authentication required');

    const presignedResponse = await fetch(
      `/api/video/upload/get-presigned-url?` +
      `fileName=${encodeURIComponent(file.name)}` +
      `&fileType=${encodeURIComponent(file.type)}` +
      `&fileSize=${file.size}` +
      `&projectId=${encodeURIComponent(screenplayId || 'default')}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!presignedResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { url, fields, s3Key } = await presignedResponse.json();

    const s3Response = await uploadToObjectStorage(url, fields, file, {
      fileName: file.name,
      contentType: file.type,
    });

    if (!s3Response.ok) {
      throw new Error('S3 upload failed');
    }

    return s3Key;
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: { file: File; preview: string; s3Key?: string } | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    setStartImageUrlFromProp(null); // Clear any pre-filled URL when user uploads
    try {
      const preview = URL.createObjectURL(file);
      const s3Key = await uploadImage(file);
      setter({ file, preview, s3Key });
      toast.success('Image uploaded!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (activeMode === 'starting-frame' && !startImage?.s3Key && !startImageUrlFromProp) {
      toast.error('Please upload a starting frame image');
      return;
    }

    if (activeMode === 'frame-to-frame') {
      const frame1Valid = frame1 && (frame1.s3Key || (frame1.preview && frame1.preview.startsWith('http')));
      if (!frame1Valid || !frame2?.s3Key) {
        toast.error('Please upload both frame images');
        return;
      }
    }

    if (!screenplayId || screenplayId === 'default') {
      toast.error('Please select a screenplay first');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setGenerationTime(undefined);
    setPendingGenerationJobId(null);
    const startTime = Date.now();
    setGenerationStartedAtMs(startTime);
    let keepGeneratingUntilAsyncTerminal = false;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Build final prompt with camera angle
      let finalPrompt = prompt.trim();
      if (selectedCameraAngle) {
        const angleText = formatCameraAngleForVideo(selectedCameraAngle);
        finalPrompt = angleText + finalPrompt;
      }

      const selectedCameraOption = cameraAngles.find((a) => a.id === selectedCameraAngle);
      const defaultSceneName =
        activeMode === 'text-to-video'
          ? 'Playground Text to Video'
          : activeMode === 'starting-frame'
          ? 'Playground Starting Frame'
          : 'Playground Frame to Frame';

      const requestBody: any = {
        prompt: finalPrompt,
        videoMode:
          activeMode === 'text-to-video'
            ? 'text-only'
            : activeMode === 'starting-frame'
            ? 'image-start'
            : 'image-interpolation',
        resolution: selectedResolution,
        duration: `${selectedDuration}s`,
        aspectRatio: aspectRatio,
        cameraMotion: selectedCameraOption?.promptText || 'none',
        sceneId: propSceneId ?? `playground_${Date.now()}`,
        sceneNumber: propSceneNumber,
        sceneName: propSceneName ?? defaultSceneName,
      };
      if (selectedModel) requestBody.preferredProvider = selectedModel;
      // Luma baseline: id is the Luma concept key; send it when Luma is selected and an angle is chosen (Plan 0257).
      if (selectedModel && selectedModel.startsWith('luma-') && selectedCameraAngle) {
        requestBody.lumaConcepts = selectedCameraAngle;
      }
      if (propShotNumber != null) requestBody.shotNumber = propShotNumber;
      if (propScreenplayId) requestBody.screenplayId = propScreenplayId;

      if (activeMode === 'starting-frame') {
        if (startImage?.s3Key) {
          requestBody.startImageS3Key = startImage.s3Key;
          requestBody.startImageUrl = startImage.s3Key; // Backend accepts key here and presigns for job
        } else if (startImageUrlFromProp) {
          requestBody.startImageUrl = startImageUrlFromProp;
        }
      }

      if (activeMode === 'frame-to-frame' && frame1 && frame2?.s3Key) {
        requestBody.startImageUrl = frame1.s3Key ?? (frame1.preview?.startsWith('http') ? frame1.preview : undefined);
        requestBody.endImageUrl = frame2.s3Key;
        requestBody.prompt = `Transition from first frame to second frame: ${finalPrompt}`;
      }

      const { api: apiModule, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      const response = await apiModule.video.generateAsync(requestBody);
      const result = response?.data ?? response;
      const returnedJobId = result.data?.jobId || result.jobId;
      if (returnedJobId) {
        upsertVideoAttempt({
          id: `job_${returnedJobId}`,
          jobId: returnedJobId,
          status: 'running',
          message: 'Video generation in progress...',
          at: new Date().toISOString(),
        });
      }

      // Keep global credits UI synchronized immediately after generation starts.
      if (typeof window !== 'undefined' && window.refreshCredits) {
        window.refreshCredits();
      }
      
      // Extract video URL from response (if available immediately)
      const videoUrl = result.data?.videoUrl || result.data?.url || result.data?.s3Url;
      if (videoUrl) {
        const elapsed = (Date.now() - startTime) / 1000;
        setGenerationTime(elapsed);
        clearDismissedLatestVideo();
        setGeneratedVideoUrl(videoUrl);
        upsertVideoAttempt({
          id: returnedJobId ? `job_${returnedJobId}` : `attempt_${Date.now()}`,
          jobId: returnedJobId || undefined,
          status: 'success',
          message: 'Video generated successfully.',
          at: new Date().toISOString(),
          videoUrl,
        });
      } else {
        // For async jobs, we might get a job ID - show message
        const jobId = returnedJobId;
        if (jobId) {
          keepGeneratingUntilAsyncTerminal = true;
          setPendingGenerationJobId(jobId);
        } else {
          // Build proxy URL from key if backend returned only key.
          const s3Key = result.data?.s3Key || result.data?.key;
          if (s3Key) {
            const elapsed = (Date.now() - startTime) / 1000;
            setGenerationTime(elapsed);
            clearDismissedLatestVideo();
            const proxyUrl = `/api/media/file?key=${encodeURIComponent(s3Key)}`;
            setGeneratedVideoUrl(proxyUrl);
            upsertVideoAttempt({
              id: returnedJobId ? `job_${returnedJobId}` : `attempt_${Date.now()}`,
              jobId: returnedJobId || undefined,
              status: 'success',
              message: 'Video generated successfully.',
              at: new Date().toISOString(),
              videoUrl: proxyUrl,
            });
          }
        }
      }
      
      // Reset form (but keep generated video visible if available)
      setPrompt('');
      setSelectedCameraAngle('');
      if (activeMode === 'starting-frame') {
        if (startImage?.preview) URL.revokeObjectURL(startImage.preview);
        setStartImage(null);
        setStartImageUrlFromProp(null);
      } else {
        if (frame1?.preview?.startsWith('blob:')) URL.revokeObjectURL(frame1.preview);
        if (frame2?.preview?.startsWith('blob:')) URL.revokeObjectURL(frame2.preview);
        setFrame1(null);
        setFrame2(null);
      }
    } catch (error: any) {
      console.error('Video generation failed:', error);
      const creditError = extractCreditError(error);
      const displayMessage = creditError.isInsufficientCredits
        ? getCreditErrorDisplayMessage(creditError)
        : (error?.message || 'Failed to generate video');
      if (creditError.isInsufficientCredits) {
        syncCreditsFromError(creditError);
      }
      toast.error(displayMessage);
      upsertVideoAttempt({
        id: `attempt_${Date.now()}`,
        status: 'failed',
        message: `Failed: ${displayMessage}`,
        at: new Date().toISOString(),
      });
      if (typeof window !== 'undefined' && window.refreshCredits) {
        window.refreshCredits();
      }
      setGeneratedVideoUrl(null);
      setPendingGenerationJobId(null);
      setGenerationStartedAtMs(null);
    } finally {
      if (!keepGeneratingUntilAsyncTerminal) {
        setIsGenerating(false);
        setPendingGenerationJobId(null);
        setGenerationStartedAtMs(null);
      }
    }
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideoUrl;
      link.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderRecentAttemptsPanel = () => (
    <div className="border-t border-white/10 p-4 md:p-5 bg-[#141414]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-400">Recent attempts</p>
        <span className="text-[10px] text-gray-500">retained ~12h</span>
      </div>
      <p className="mb-2 text-[10px] text-[#808080]">
        Generated videos save to Archive under <span className="text-[#B3B3B3]">Videos</span>.
      </p>
      {recentAttempts.length === 0 ? (
        <p className="text-xs text-[#808080]">No recent attempts yet.</p>
      ) : (
        <div className="space-y-1.5">
          {recentAttempts.slice(0, 6).map((attempt) => (
            <div
              key={attempt.id}
              className={cn(
                'flex items-center justify-between rounded border px-2 py-1 text-[11px]',
                attempt.status === 'failed'
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : attempt.status === 'running' || attempt.status === 'queued'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              )}
            >
              <div className="min-w-0 pr-2">
                <p className="truncate">{attempt.message}</p>
                {attempt.videoUrl ? (
                  <button
                    type="button"
                    onClick={() => setGeneratedVideoUrl(attempt.videoUrl || null)}
                    className="mt-0.5 text-[10px] underline hover:text-white"
                  >
                    Open result
                  </button>
                ) : null}
              </div>
              <span className="shrink-0 text-[10px] opacity-80">
                {new Date(attempt.at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFrameInputs = () => (
    <>
      <h3 className="text-sm font-medium text-white mb-3">
        {activeMode === 'text-to-video'
          ? 'Text to Video'
          : activeMode === 'starting-frame'
          ? 'Starting Frame'
          : 'Frame to Frame'}
      </h3>
      {activeMode === 'text-to-video' ? (
        <div className="rounded-lg border border-[#3F3F46] bg-[#0A0A0A] min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center">
            <Video className="w-8 h-8 text-[#808080] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#B3B3B3] mb-1">No input image required</p>
            <p className="text-xs text-[#808080]">Use your prompt to generate a video from text.</p>
          </div>
        </div>
      ) : activeMode === 'starting-frame' ? (
        <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[200px] flex items-center justify-center">
          {!startImage && !startImageUrlFromProp ? (
            <button
              type="button"
              onClick={() => startImageInputRef.current?.click()}
              disabled={isUploading || isGenerating}
              className={cn(
                "w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                isUploading || isGenerating
                  ? "border-[#3F3F46] text-[#808080] cursor-not-allowed"
                  : "text-[#808080] hover:border-cinema-red hover:text-cinema-red"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8" />
                  <span>Upload Starting Frame</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative w-full h-full min-h-[200px]">
              <img
                src={startImage ? startImage.preview : startImageUrlFromProp ?? ''}
                alt="Starting frame"
                className="w-full h-full min-h-[200px] object-contain bg-[#0A0A0A]"
              />
              <button
                type="button"
                onClick={() => {
                  if (startImage?.preview) URL.revokeObjectURL(startImage.preview);
                  setStartImage(null);
                  setStartImageUrlFromProp(null);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-cinema-red rounded-full flex items-center justify-center"
                aria-label="Clear starting frame"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-[#808080] mb-1.5">Frame 1 (Start)</p>
            <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[160px] flex items-center justify-center">
              {!frame1 ? (
                <button
                  type="button"
                  onClick={() => frame1InputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className={cn(
                    "w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isUploading || isGenerating
                      ? "text-[#808080] cursor-not-allowed"
                      : "text-[#808080] hover:text-cinema-red"
                  )}
                >
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  <span>Upload Frame 1</span>
                </button>
              ) : (
                <div className="relative w-full h-full min-h-[160px]">
                  <img src={frame1.preview} alt="Frame 1" className="w-full h-full min-h-[160px] object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      if (frame1.preview?.startsWith('blob:')) URL.revokeObjectURL(frame1.preview);
                      setFrame1(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                    aria-label="Clear frame 1"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-[#808080] mb-1.5">Frame 2 (End)</p>
            <div className="rounded-lg border-2 border-dashed border-[#3F3F46] overflow-hidden bg-[#0A0A0A] min-h-[160px] flex items-center justify-center">
              {!frame2 ? (
                <button
                  type="button"
                  onClick={() => frame2InputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className={cn(
                    "w-full h-full min-h-[160px] flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isUploading || isGenerating
                      ? "text-[#808080] cursor-not-allowed"
                      : "text-[#808080] hover:text-cinema-red"
                  )}
                >
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  <span>Upload Frame 2</span>
                </button>
              ) : (
                <div className="relative w-full h-full min-h-[160px]">
                  <img src={frame2.preview} alt="Frame 2" className="w-full h-full min-h-[160px] object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      if (frame2.preview?.startsWith('blob:')) URL.revokeObjectURL(frame2.preview);
                      setFrame2(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-cinema-red rounded-full flex items-center justify-center"
                    aria-label="Clear frame 2"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={cn("min-h-full flex flex-col md:flex-row bg-[#0A0A0A]", className)}>
      {/* Hidden file inputs (triggered from upload areas) */}
      <input
        ref={startImageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e, setStartImage)}
        className="hidden"
        disabled={isUploading || isGenerating}
        aria-hidden
      />
      <input
        ref={frame1InputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e, setFrame1)}
        className="hidden"
        disabled={isUploading || isGenerating}
        aria-hidden
      />
      <input
        ref={frame2InputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageSelect(e, setFrame2)}
        className="hidden"
        disabled={isUploading || isGenerating}
        aria-hidden
      />

      {/* Left Panel - Form Controls (no inner scroll; whole page scrolls) */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Mode Tabs */}
        <div className="flex-shrink-0 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveMode('text-to-video')}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeMode === 'text-to-video'
                ? "bg-cinema-red text-white"
                : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
            )}
          >
            <Video className="w-4 h-4" />
            <span>Text</span>
          </button>

          <button
            onClick={() => setActiveMode('starting-frame')}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeMode === 'starting-frame'
                ? "bg-cinema-red text-white"
                : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            <span>First Frame</span>
          </button>

          <button
            onClick={handleSwitchToFrameToFrame}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeMode === 'frame-to-frame'
                ? "bg-cinema-red text-white"
                : "bg-[#1F1F1F] text-[#808080] hover:text-white hover:bg-[#2A2A2A]"
            )}
          >
            <Film className="w-4 h-4" />
            <span>Frame to Frame</span>
          </button>
        </div>
        </div>

        {/* Mobile: Input frame(s) goes directly under mode tabs */}
        <div className="md:hidden flex-shrink-0 border border-white/10 rounded-lg p-4 bg-[#141414]">
          {renderFrameInputs()}
        </div>

        {/* Generation Form - controls only; frame preview/upload is on the right */}
        <div className="flex-1 flex flex-col gap-6">
        {/* Camera Angle Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Camera Angle & Movement (Optional)
          </label>
          <select
            value={selectedCameraAngle}
            onChange={(e) => setSelectedCameraAngle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {cameraAngles.map((angle) => (
              <option key={angle.id || 'none'} value={angle.id}>
                {angle.label}
              </option>
            ))}
          </select>
          {selectedCameraAngle && (
            <p className="mt-1.5 text-xs text-[#808080]">
              Will add: &quot;{cameraAngles.find((a) => a.id === selectedCameraAngle)?.promptText}&quot;
            </p>
          )}
        </div>

        {/* Prompt Input */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">
              Prompt
            </label>
            {lineContextText ? (
              <button
                type="button"
                onClick={() => setPrompt(lineContextText)}
                disabled={isGenerating}
                className="text-xs px-2 py-1 rounded border border-[#3F3F46] bg-[#1F1F1F] text-[#B3B3B3] hover:text-white hover:border-[#52525B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Replace prompt with selected line context"
              >
                Use line context
              </button>
            ) : null}
          </div>
          {lineContextText ? (
            <p className="mb-2 text-xs text-[#808080] truncate" title={lineContextText}>
              {lineContextType ? `${lineContextType}: ` : ''}{lineContextText}
            </p>
          ) : null}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={activeMode === 'text-to-video'
              ? "Describe the scene, action, and cinematic style you want to generate..."
              : activeMode === 'starting-frame'
              ? "Describe the motion, camera movement, and action you want in the video..."
              : "Describe the transition and motion between the two frames..."
            }
            className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent resize-none"
            rows={4}
            disabled={isGenerating}
          />
        </div>

        {/* Resolution Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Resolution
          </label>
          <select
            value={resolutionOptions.includes(selectedResolution) ? selectedResolution : resolutionOptions[0] ?? '1080p'}
            onChange={(e) => setSelectedResolution(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {resolutionOptions.map((res) => (
              <option key={res} value={res}>{res === '4k' ? '4K' : res}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[#808080]">
            Total cost: <strong className="text-white">{getTotalCredits()} credits</strong>
          </p>
          <p className="mt-1.5 text-xs text-[#4A4A4A]">
            💡 For video modification (remove objects, transform scenes), use <strong>Post-Production Workflows</strong> tab
          </p>
        </div>

        {/* Model Selection – custom dropdown so opening it doesn't freeze parent scroll */}
        <div className="flex-shrink-0 relative" ref={videoModelDropdownRef}>
          <label className="block text-sm font-medium text-white mb-2">
            Video Model
          </label>
          {isLoadingModels ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading models...</span>
            </div>
          ) : displayModels.length === 0 ? (
            <div className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#808080]">
              No video models available. Check your connection and try again.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => !isGenerating && setVideoModelDropdownOpen((o) => !o)}
                disabled={isGenerating}
                ref={videoModelTriggerRef}
                className={cn(
                  "w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-left text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent flex items-center justify-between",
                  videoModelDropdownOpen && "ring-2 ring-cinema-red border-transparent"
                )}
              >
                <span>{selectedModelInfo?.label ?? displayModels.find((m) => m.id === selectedModel)?.label ?? (selectedModel || 'Select model')}</span>
                <span className={cn("text-[#808080] transition-transform", videoModelDropdownOpen && "rotate-180")}>▼</span>
              </button>
              {videoModelDropdownOpen && (
                <div
                  className={cn(
                    "absolute z-50 w-full overflow-y-auto rounded-lg border border-[#3F3F46] bg-[#1F1F1F] shadow-lg",
                    videoModelDropdownDirection === 'up' ? "bottom-full mb-1" : "top-full mt-1"
                  )}
                  style={{
                    minWidth: videoModelDropdownRef.current?.offsetWidth,
                    maxHeight: videoModelDropdownMaxHeight
                  }}
                >
                  {displayModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setVideoModelDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-sm transition-colors",
                        m.id === selectedModel ? "bg-cinema-red/20 text-white" : "text-white hover:bg-[#2A2A2A]"
                      )}
                    >
                      {m.id === selectedModel && <span className="mr-2">✓</span>}
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
              {selectedModel && selectedModelInfo && (
                <p className="mt-1.5 text-xs text-[#808080]">
                  {selectedModelInfo.description || selectedModelInfo.provider} • {getTotalCredits()} credits
                </p>
              )}
            </>
          )}
        </div>

        {/* Aspect Ratio */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {aspectRatioOptions.map((ar) => (
              <option key={ar} value={ar}>{ar}</option>
            ))}
          </select>
        </div>

        {/* Duration Selection */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-white mb-2">
            Duration (seconds)
          </label>
          <select
            value={durationOptions.includes(selectedDuration) ? selectedDuration : durationOptions[0] ?? 5}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cinema-red focus:border-transparent"
            disabled={isGenerating}
          >
            {durationOptions.map((d) => (
              <option key={d} value={d}>{d} seconds</option>
            ))}
          </select>
        </div>
        </div>

        {/* Generate Button */}
        <div className="flex-shrink-0 border-t border-white/10 p-4 md:p-6 bg-[#0A0A0A]">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || displayModels.length === 0 || !selectedModel ||
              (activeMode === 'starting-frame' && !startImage && !startImageUrlFromProp) ||
              (activeMode === 'frame-to-frame' && (!frame1 || !frame2))}
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium text-white transition-colors",
              "bg-cinema-red hover:bg-red-700 disabled:bg-[#3F3F46] disabled:text-[#808080] disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </div>
      </div>

        {/* Mobile: keep latest generated video at bottom */}
        <div className="md:hidden flex-shrink-0 border-t border-white/10 bg-[#141414]">
          <GenerationPreview
            isGenerating={isGenerating}
            generatedVideoUrl={generatedVideoUrl}
            generationTime={generationTime}
            onDownload={handleDownload}
            onClear={dismissLatestGeneratedVideo}
            onVideoError={dismissLatestGeneratedVideo}
            className="min-h-[260px]"
            title="Latest generated"
          />
          {renderRecentAttemptsPanel()}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-white/10 flex-shrink-0"></div>

      {/* Right Panel - Frame preview (top) + Latest generated (bottom) */}
      <div className="hidden md:flex md:w-1/2 flex-col min-h-full bg-[#141414]">
        {/* Top: Input frame(s) preview / upload */}
        <div className="flex-shrink-0 border-b border-white/10 p-4">
          {renderFrameInputs()}
        </div>

        {/* Bottom: Latest generated video (loaded from last completed job on mount; also updated when a video is generated this session). Temp files expire after 1 day — on load error we clear the URL so we show placeholder instead of empty player. */}
        <div className="flex-1 flex flex-col min-h-0">
          <GenerationPreview
            isGenerating={isGenerating}
            generatedVideoUrl={generatedVideoUrl}
            generationTime={generationTime}
            onDownload={handleDownload}
            onClear={dismissLatestGeneratedVideo}
            onVideoError={dismissLatestGeneratedVideo}
            className="flex-1 min-h-0"
            title="Latest generated"
          />
          {renderRecentAttemptsPanel()}
        </div>
      </div>
    </div>
  );
}

