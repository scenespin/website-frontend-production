'use client';

/**
 * Jobs Drawer Component
 * 
 * Slide-out drawer for displaying workflow execution history with real-time polling.
 * Preserves all functionality from ProductionJobsPanel in a compact drawer format.
 * 
 * Features:
 * - Real-time polling every 3 seconds for running jobs
 * - Status filtering (all/running/completed/failed)
 * - Job details with download/delete/retry actions
 * - Storage decision modals
 * - Safety error dialogs
 * - Auto-open when jobs are running (optional)
 * - Compact job cards optimized for drawer width
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Loader2, CheckCircle, XCircle, Clock, Download, 
  RefreshCw, Trash2, Filter, ChevronDown, Play,
  Sparkles, AlertCircle, Image, Save, X, ChevronRight, GripHorizontal, Music
} from 'lucide-react';
import { toast } from 'sonner';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { useRouter } from 'next/navigation';
import { Z_INDEX } from '@/config/z-index';
import { getEstimatedDuration } from '@/utils/jobTimeEstimates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Reuse WorkflowJob interface from ProductionJobsPanel
interface WorkflowJob {
  jobId: string;
  workflowId: string;
  workflowName: string;
  jobType?: 'complete-scene' | 'pose-generation' | 'image-generation' | 'audio-generation' | 'workflow-execution' | 'playground-experiment' | 'screenplay-reading' | 'video-soundscape';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    videos?: Array<{
      url: string;
      description: string;
      creditsUsed: number;
    }>;
    poses?: Array<{
      poseId: string;
      poseName: string;
      imageUrl: string;
      s3Key: string;
      creditsUsed: number;
    }>;
    images?: Array<{
      imageUrl: string;
      s3Key: string;
      creditsUsed: number;
      label?: string;
    }>;
    audio?: Array<{
      audioUrl: string;
      s3Key: string;
      creditsUsed: number;
      label?: string;
    }>;
    screenplayReading?: {
      audioUrl: string;
      s3Key: string;
      subtitleUrl?: string;
      subtitleS3Key?: string;
      scenesProcessed: string[];
      scenesFailed?: Array<{
        sceneId: string;
        error: string;
      }>;
      sceneAudios?: Array<{
        sceneId: string;
        audioUrl: string;
        s3Key: string;
        heading?: string;
        creditsUsed: number;
      }>;
      characterVoiceMapping: Record<string, string>;
      creditsUsed: number;
    };
    totalCreditsUsed: number;
    executionTime: number;
    failedPoses?: Array<{
      poseId: string;
      poseName: string;
      error: string;
      errorCode?: string;
      attemptedQuality?: string;
    }>;
    angleReferences?: Array<{
      angle: string;
      imageUrl: string;
      s3Key: string;
      creditsUsed: number;
    }>;
    failedAngles?: Array<{
      angle: string;
      error: string;
      errorCode?: string;
      attemptedQuality?: string;
    }>;
    backgroundReferences?: Array<{
      backgroundType: string;
      imageUrl: string;
      s3Key: string;
      creditsUsed: number;
    }>;
    failedBackgrounds?: Array<{
      backgroundType: string;
      error: string;
    }>;
    videoSoundscape?: {
      analysisId: string;
      videoUrl: string;
      videoDuration: number;
      detectedCues?: Array<{
        timestamp: number;
        type: string;
        description: string;
        confidence: number;
      }>;
      moodProfile?: {
        primaryMood: string;
        intensity: number;
        tempo: string;
      };
    };
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
  creditsUsed: number;
  metadata?: any;
  inputs?: {
    assetId?: string;
    locationId?: string;
    characterId?: string;
    assetName?: string;
    locationName?: string;
    characterName?: string;
    packageId?: string;
    [key: string]: any;
  };
}

interface JobsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onToggle?: () => void;
  autoOpen?: boolean; // Auto-open when jobs are running
  compact?: boolean; // Compact mode for smaller screens
  jobCount?: number; // Number of active jobs for tab badge
  /** When provided (e.g. from ProductionHub), use this screenplayId so drawer and Hub query the same project (URL-first, then context). */
  screenplayIdFromHub?: string;
  onNavigateToEntity?: (entityType: 'character' | 'location' | 'asset', entityId: string) => void; // Callback to navigate to entity modal
}

// StatusFilter removed - showing all jobs per session

/**
 * Helper component to display image thumbnail from S3 key
 * Generates presigned URL on mount, with fallback to provided URL
 */
function ImageThumbnailFromS3Key({ s3Key, alt, fallbackUrl }: { s3Key: string; alt: string; fallbackUrl?: string }) {
  const { getToken } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackUrl || null);
  const [isLoading, setIsLoading] = useState(!fallbackUrl);

  useEffect(() => {
    if (!s3Key) {
      setIsLoading(false);
      return;
    }

    async function fetchPresignedUrl() {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          setIsLoading(false);
          // Use fallback if available and no token
          if (fallbackUrl && !imageUrl) {
            setImageUrl(fallbackUrl);
          }
          return;
        }

        const response = await fetch('/api/s3/download-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: s3Key,
            expiresIn: 3600, // 1 hour
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn('[JobsDrawer] Thumbnail not found (404), using fallback:', s3Key);
            setIsLoading(false);
            if (fallbackUrl) setImageUrl(fallbackUrl);
            return;
          }
          throw new Error(`Failed to get presigned URL: ${response.status}`);
        }

        const data = await response.json();
        if (data.downloadUrl) {
          setImageUrl(data.downloadUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[JobsDrawer] Failed to get presigned URL:', error);
        setIsLoading(false);
        // Use fallback if available and we failed to get presigned URL
        if (fallbackUrl && !imageUrl) {
          setImageUrl(fallbackUrl);
        }
      }
    }

    // Always fetch fresh presigned URL on mount
    fetchPresignedUrl();
    
    // Refresh presigned URL every 45 minutes (before 1 hour expiration)
    // This ensures images stay active for the entire session
    const refreshInterval = setInterval(() => {
      fetchPresignedUrl();
      console.log('[JobsDrawer] Refreshing presigned URL for', s3Key);
    }, 45 * 60 * 1000); // 45 minutes - refresh before expiration

    return () => clearInterval(refreshInterval);
  }, [s3Key, fallbackUrl, getToken, imageUrl]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl || fallbackUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E'}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src && !img.src.startsWith('data:')) {
          console.warn('[JobsDrawer] Thumbnail failed to load (e.g. 404), using placeholder:', s3Key);
        }
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
      }}
    />
  );
}

export function JobsDrawer({ isOpen, onClose, onOpen, onToggle, autoOpen = false, compact = false, jobCount = 0, screenplayIdFromHub, onNavigateToEntity }: JobsDrawerProps) {
  const router = useRouter();
  const screenplay = useScreenplay();
  // Use Hub's screenplayId when provided (URL-first, then context) so drawer and badge query the same project
  const screenplayId = (screenplayIdFromHub?.trim() || screenplay.screenplayId || '').trim() || '';
  const { getToken, userId, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { isDrawerOpen: isChatDrawerOpen } = useDrawer(); // Check if chat drawer is open
  
  // Mobile detection - EXACT same pattern as AgentDrawer
  const [isMobile, setIsMobile] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // Detect mobile vs desktop - EXACT same as AgentDrawer
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: Calculate height (50px collapsed)
  const currentMobileHeight = isOpen ? mobileHeight : 50;

  // Handle drag gestures (MOBILE ONLY) - EXACT same as AgentDrawer
  const handleDragStart = (clientY: number) => {
    if (!isMobile) return;
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = mobileHeight;
  };

  useEffect(() => {
    if (!isDragging || !isMobile) return;

    const handleMove = (clientY: number) => {
      const deltaY = dragStartY.current - clientY;
      const newHeight = Math.max(300, Math.min(window.innerHeight * 0.9, dragStartHeight.current + deltaY));

      // If swiping down significantly, close the drawer
      if (deltaY < -100 && clientY > dragStartY.current) {
        onClose();
        setIsDragging(false);
        return;
      }

      setMobileHeight(newHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isMobile, onClose]);
  
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Track which jobs we've already processed for credit refresh (avoid duplicates)
  const processedJobIdsForCredits = useRef<Set<string>>(new Set());
  // Track previous jobs state to prevent infinite loops
  const previousJobsHash = useRef<string>('');
  // GSI eventual consistency: retry counter when initial load returns 0 jobs (max 3 retries with exponential backoff)
  const emptyRetryCountRef = useRef(0);
  // GSI: retry counter when list returned but optimistic placeholder(s) not in list (max 3 retries)
  const placeholderRetryCountRef = useRef(0);
  // Single source of truth for tracked jobs: we never overwrite these with list API data (list often omits results).
  // Tracked = added optimistically or updated via get-by-ID. Only get-by-ID updates these jobs until they have results.
  const trackedJobIdsRef = useRef<Set<string>>(new Set());
  // Keep latest jobs in ref for interval callback (avoids stale closure)
  const jobsRef = useRef<WorkflowJob[]>([]);
  jobsRef.current = jobs;
  // Poll-by-ID until completion (industry-standard pattern)
  const POLL_BY_ID_INTERVAL_MS = 4000;
  const MAX_POLL_PER_TICK = 20;
  const directFetchInProgressRef = useRef<Set<string>>(new Set());
  // Direct-fetched jobs: re-insert in merge if list didn't include them (stale state edge case)
  const directFetchedJobsRef = useRef<Map<string, WorkflowJob>>(new Map());
  const resultsBackfillFetchedRef = useRef<Set<string>>(new Set());
  const MAX_GSI_RETRIES = 3;
  const GSI_RETRY_DELAYS = [2000, 4000, 8000];
  const OPTIMISTIC_POLL_DELAY_MS = 800;
  const optimisticFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScreenplayIdRef = useRef<string>('');
  // Placeholders stored here so loadJobs can re-inject them when prevJobs is stale (React batching race).
  const optimisticPlaceholdersRef = useRef<Map<string, WorkflowJob>>(new Map());
  // Diagnostic: job IDs to log (recently added optimistically). Max 10; cleared with tracked.
  const diagnosticJobIdsRef = useRef<Set<string>>(new Set());
  const MAX_DIAGNOSTIC_JOBS = 10;
  const hasResultsForLog = (j: WorkflowJob) => j?.results && (
    (j.results.poses?.length) ||
    (j.results.angleReferences?.length) ||
    (j.results.backgroundReferences?.length) ||
    (j.results.images?.length) ||
    (j.results.videos?.length) ||
    (j.results.screenplayReading) ||
    (j.results.videoSoundscape)
  );

  // Storage modal state
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'image' | 'video' | 'audio';
    metadata?: any;
  } | null>(null);

  // Safety error dialog state
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [safetyErrorData, setSafetyErrorData] = useState<{
    jobId: string;
    jobType: string;
    failedItems: Array<{
      id: string;
      name: string;
      error: string;
    }>;
    entityId?: string;
    entityName?: string;
  } | null>(null);

  // Track deleted job IDs in sessionStorage to persist deletions
  const [deletedJobIds, setDeletedJobIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('deletedJobIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  // Save deleted job IDs to sessionStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && deletedJobIds.size > 0) {
      sessionStorage.setItem('deletedJobIds', JSON.stringify(Array.from(deletedJobIds)));
    }
  }, [deletedJobIds]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isSignedIn === false) {
      sessionStorage.removeItem('deletedJobIds');
      setDeletedJobIds(new Set());
      setJobs([]);
      setHasLoadedOnce(false);
      trackedJobIdsRef.current.clear();
      optimisticPlaceholdersRef.current.clear();
      diagnosticJobIdsRef.current.clear();
    }
  }, [isSignedIn]);

  /**
   * Filter jobs to show:
   * 1. All running/queued jobs (regardless of age)
   * 2. Completed/failed jobs from the last 7 days
   * 3. Exclude deleted jobs
   */
  const getVisibleJobs = () => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds

    return jobs.filter(job => {
      // Always exclude deleted jobs
      if (deletedJobIds.has(job.jobId)) return false;

      // Always show running/queued jobs regardless of age
      if (job.status === 'running' || job.status === 'queued') return true;

      // For completed/failed jobs, only show if within last 7 days
      const jobDate = new Date(job.createdAt).getTime();
      return jobDate >= sevenDaysAgo;
    });
  };

  // Filter out deleted jobs and apply 7-day filter - calculate early so it can be used in useEffects
  const visibleJobs = getVisibleJobs();

  // Diagnostic: log what state has for recently added job IDs (so we can compare list vs get-by-ID vs UI)
  useEffect(() => {
    const diagnostic = diagnosticJobIdsRef.current;
    if (diagnostic.size === 0) return;
    jobs.forEach((j) => {
      if (!diagnostic.has(j.jobId)) return;
      const firstKey = (j.results?.poses?.[0]?.s3Key) ?? (j.results?.images?.[0]?.s3Key) ?? (j.results?.angleReferences?.[0]?.s3Key) ?? (j.results?.backgroundReferences?.[0]?.s3Key) ?? 'none';
      console.log('[JobsDrawer] [DEBUG] state', {
        jobId: j.jobId.slice(-12),
        status: j.status,
        hasResults: hasResultsForLog(j),
        thumbnailKey: firstKey === 'none' ? 'none' : firstKey.slice(-40),
      });
    });
  }, [jobs]);

  // Auto-open when jobs are running
  useEffect(() => {
    if (!autoOpen || !isOpen) return;
    
    const hasRunningJobs = jobs.some(j => 
      j.status === 'running' || j.status === 'queued'
    );
    
    // Auto-open logic is handled by parent component
    // This effect just ensures we're polling when drawer is open
  }, [jobs, autoOpen, isOpen]);

  /**
   * Helper function for downloading audio files via blob
   */
  const downloadAudioAsBlob = async (audioUrl: string, filename: string, s3Key?: string) => {
    try {
      let downloadUrl = audioUrl;
      
      if (s3Key) {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');
          
          const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
          const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600,
            }),
          });
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
          }
          
          const presignedData = await presignedResponse.json();
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[JobsDrawer] Failed to get presigned URL, using original URL:', error);
        }
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[JobsDrawer] Failed to download audio:', error);
      toast.error('Failed to download audio', { description: error.message });
      throw error;
    }
  };

  /**
   * Direct fetch: Fetch a single job by ID using primary key lookup (bypasses GSI)
   * Used as fallback when GSI list doesn't return the job after max retries, and for poll-by-ID until completion.
   */
  const fetchJobDirectly = async (jobId: string, options?: { silent?: boolean }): Promise<WorkflowJob | null> => {
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return null;

      const response = await fetch(`/api/workflows/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.warn('[JobsDrawer] Direct fetch failed', { jobId: jobId.slice(-12), status: response.status });
        return null;
      }
      
      const data = await response.json();
      if (!data.success || !data.data?.execution) {
        console.warn('[JobsDrawer] Direct fetch returned no execution', { jobId: jobId.slice(-12) });
        return null;
      }
      
      const exec = data.data.execution;
      // Transform execution response to WorkflowJob format
      const job: WorkflowJob = {
        jobId: exec.executionId,
        workflowId: exec.workflowId || 'image-generation',
        workflowName: exec.workflowName || 'Image Generation',
        jobType: exec.jobType || 'image-generation',
        status: exec.status,
        progress: exec.progress || Math.round((exec.currentStep / exec.totalSteps) * 100) || 0,
        createdAt: exec.startedAt || new Date().toISOString(),
        creditsUsed: exec.totalCreditsUsed || 0,
        results: exec.finalOutputs,
        metadata: exec.metadata,
      };
      
      if (!options?.silent) {
        console.log('[JobsDrawer] Direct fetch SUCCESS', { 
          jobId: jobId.slice(-12), 
          status: job.status, 
          projectId: exec.projectId?.slice(0, 24),
          storedProjectId: exec.projectId,
          queriedScreenplayId: screenplayId,
          match: exec.projectId === screenplayId
        });
      }
      if (options?.silent && diagnosticJobIdsRef.current.has(jobId)) {
        console.log('[JobsDrawer] [DEBUG] direct_fetch', {
          jobId: jobId.slice(-12),
          status: job.status,
          hasResults: hasResultsForLog(job),
        });
      }
      return job;
    } catch (error: any) {
      console.error('[JobsDrawer] Direct fetch error', { jobId: jobId.slice(-12), error: error.message });
      return null;
    }
  };

  /**
   * Fallback: Fetch missing placeholders directly by ID (bypasses GSI projectId filter)
   */
  const fetchMissingPlaceholdersDirectly = async (missingJobIds: string[]) => {
    if (missingJobIds.length === 0) return;
    
    // Prevent duplicate fetches - skip if any of these IDs are already being fetched
    const alreadyFetching = missingJobIds.some(id => directFetchInProgressRef.current.has(id));
    if (alreadyFetching) {
      console.log('[JobsDrawer] Direct fetch skipped - already in progress', {
        jobIds: missingJobIds.map(id => id.slice(-12)),
      });
      return;
    }
    
    // Mark these IDs as in-progress
    const idsSet = new Set(missingJobIds);
    missingJobIds.forEach(id => directFetchInProgressRef.current.add(id));
    
    try {
      console.log('[JobsDrawer] Direct fetch fallback for missing placeholders', {
        count: missingJobIds.length,
        jobIds: missingJobIds.map(id => id.slice(-12)),
      });
      
      const fetchedJobs: WorkflowJob[] = [];
      for (const jobId of missingJobIds) {
        const job = await fetchJobDirectly(jobId);
        if (job) fetchedJobs.push(job);
      }
      
      if (fetchedJobs.length > 0) {
        fetchedJobs.forEach(job => {
          optimisticPlaceholdersRef.current.delete(job.jobId);
          directFetchedJobsRef.current.set(job.jobId, job);
          trackedJobIdsRef.current.add(job.jobId);
        });
        setJobs(prevJobs => {
          const jobMap = new Map(prevJobs.map(j => [j.jobId, j]));
          fetchedJobs.forEach((job) => {
            jobMap.delete(job.jobId);
            jobMap.set(job.jobId, job);
          });
          const mergedJobs = Array.from(jobMap.values());
          mergedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return mergedJobs;
        });
        console.log('[JobsDrawer] Direct fetch replaced placeholders', { count: fetchedJobs.length });
      }
    } finally {
      // Always clean up in-progress set
      idsSet.forEach(id => directFetchInProgressRef.current.delete(id));
    }
  };

  /**
   * Load jobs from API
   */
  const loadJobs = async (showLoading: boolean = false) => {
    try {
      if (!screenplayId || screenplayId === 'default' || screenplayId.trim() === '') {
        console.log('[JobsDrawer] Skipping load - invalid screenplayId:', screenplayId);
        return;
      }
      
      if (showLoading) {
        setIsLoading(true);
      }
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        if (showLoading) {
          toast.error('Authentication required');
          setIsLoading(false);
        }
        return;
      }

      // Load all jobs for this session (no filtering). Limit 50 so newest jobs aren't cut off.
      const url = `/api/workflows/executions?screenplayId=${screenplayId}&limit=50`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      const jobList: WorkflowJob[] = [];

      // Add workflow jobs
      if (data.success) {
        const workflowJobs = data.data?.jobs || data.jobs || [];
        jobList.push(...workflowJobs);
      }

      // Diagnostic: log what we queried and what we got (always, so production can confirm ID + count)
      const summary = jobList.slice(0, 20).map(j => `${j.jobId.slice(-8)}:${j.status}:${j.progress}%`);
      console.log('[JobsDrawer] loadJobs', {
        screenplayId: screenplayId.slice(0, 24) + (screenplayId.length > 24 ? '…' : ''),
        count: jobList.length,
        jobs: summary,
        runningCount: jobList.filter(j => j.status === 'running' || j.status === 'queued').length,
      });
      
      const apiJobIds = new Set(jobList.map((j: WorkflowJob) => j.jobId));

      setJobs(prevJobs => {
        const jobMap = new Map(prevJobs.map(j => [j.jobId, j]));
        const tracked = trackedJobIdsRef.current;
        // Single source of truth: tracked jobs are updated only via get-by-ID. List is for discovery; never overwrite tracked.
        const hasResults = (j: WorkflowJob) => j.results && (
          (j.results.poses?.length) ||
          (j.results.angleReferences?.length) ||
          (j.results.backgroundReferences?.length) ||
          (j.results.images?.length) ||
          (j.results.videos?.length) ||
          (j.results.screenplayReading) ||
          (j.results.videoSoundscape)
        );
        jobList.forEach((newJob: WorkflowJob) => {
          if (tracked.has(newJob.jobId)) {
            // Don't overwrite tracked with list when list has no results (poll/get-by-ID is source of truth).
            // Do accept list when it has results and we don't (e.g. thumbnail) so UI can update without waiting for poll.
            const existing = jobMap.get(newJob.jobId);
            const listHasRes = hasResults(newJob);
            const existingHasRes = existing && hasResults(existing);
            const accepted = !!(existing && listHasRes && !existingHasRes);
            if (accepted) {
              jobMap.set(newJob.jobId, newJob);
              optimisticPlaceholdersRef.current.delete(newJob.jobId);
            }
            if (diagnosticJobIdsRef.current.has(newJob.jobId)) {
              console.log('[JobsDrawer] [DEBUG] merge list (tracked)', {
                jobId: newJob.jobId.slice(-12),
                action: accepted ? 'accepted_list_had_results' : 'skipped_tracked',
                listStatus: newJob.status,
                listHasResults: listHasRes,
                existingStatus: existing?.status,
                existingHasResults: existingHasRes,
              });
            }
            return;
          }
          const existing = jobMap.get(newJob.jobId);
          if (existing && (existing.status === 'completed' || existing.status === 'failed') && (newJob.status === 'completed' || newJob.status === 'failed')) {
            if (hasResults(existing) && !hasResults(newJob)) {
              jobMap.set(newJob.jobId, { ...newJob, results: existing.results });
            } else {
              jobMap.set(newJob.jobId, newJob);
            }
          } else {
            jobMap.set(newJob.jobId, newJob);
          }
        });
        directFetchedJobsRef.current.forEach((job, id) => {
          if (!apiJobIds.has(id)) jobMap.set(id, job);
          else directFetchedJobsRef.current.delete(id);
        });
        // Re-inject optimistic placeholders when prevJobs was stale (React batching race: loadJobs setJobs ran before optimistic setJobs committed).
        tracked.forEach((id) => {
          if (!jobMap.has(id)) {
            const place = optimisticPlaceholdersRef.current.get(id);
            if (place) {
              jobMap.set(id, place);
              if (diagnosticJobIdsRef.current.has(id)) {
                console.log('[JobsDrawer] [DEBUG] reinject placeholder', { jobId: id.slice(-12) });
              }
            }
          }
        });
        
        const mergedJobs = Array.from(jobMap.values());
        mergedJobs.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        // GSI: if we have optimistic placeholder(s) that weren't in this list response, retry with exponential backoff
        // DynamoDB GSI eventual consistency can take 5-10+ seconds in some cases
        const placeholdersMissing = prevJobs.filter(j => j.workflowId === '' && !jobList.some((api: WorkflowJob) => api.jobId === j.jobId));
        if (placeholdersMissing.length > 0 && placeholderRetryCountRef.current < MAX_GSI_RETRIES && isOpen) {
          const retryDelay = GSI_RETRY_DELAYS[placeholderRetryCountRef.current] || 8000;
          console.log('[JobsDrawer] GSI placeholder retry', {
            missingPlaceholders: placeholdersMissing.map(j => j.jobId.slice(-12)),
            retryCount: placeholderRetryCountRef.current + 1,
            maxRetries: MAX_GSI_RETRIES,
            nextRetryMs: retryDelay,
          });
          placeholderRetryCountRef.current += 1;
          setTimeout(() => loadJobs(false), retryDelay);
        } else if (placeholdersMissing.length > 0 && placeholderRetryCountRef.current >= MAX_GSI_RETRIES && isOpen) {
          // GSI retries exhausted - try direct fetch by job ID (bypasses projectId filter)
          // This handles projectId mismatch between job creation and list query
          const missingJobIds = placeholdersMissing.map(j => j.jobId);
          fetchMissingPlaceholdersDirectly(missingJobIds);
        }
        return mergedJobs;
      });

      // GSI eventual consistency: if initial load returned 0, retry with exponential backoff
      if (jobList.length === 0 && emptyRetryCountRef.current < MAX_GSI_RETRIES && isOpen) {
        const retryDelay = GSI_RETRY_DELAYS[emptyRetryCountRef.current] || 8000;
        console.log('[JobsDrawer] GSI empty result retry', {
          retryCount: emptyRetryCountRef.current + 1,
          maxRetries: MAX_GSI_RETRIES,
          nextRetryMs: retryDelay,
        });
        emptyRetryCountRef.current += 1;
        setTimeout(() => loadJobs(false), retryDelay);
      }

      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    } catch (error: any) {
      console.error('[JobsDrawer] Load error:', error);
      if (showLoading) {
        toast.error('Failed to load jobs', { description: error.message });
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Optimistic job: when a job is started (e.g. GenerateAssetTab), show it in the list immediately.
   * Polling replaces this with real status; avoids relying on GSI eventual consistency for first paint.
   * Trigger an immediate direct fetch by ID so we get full job/results before list can overwrite with completed (no results).
   */
  useEffect(() => {
    const handler = (e: CustomEvent<{ jobId: string; screenplayId: string; jobType?: string; assetName?: string }>) => {
      const { jobId, screenplayId: eventScreenplayId, jobType = 'image-generation', assetName } = e.detail || {};
      if (!jobId || !eventScreenplayId?.trim()) return;
      if (eventScreenplayId.trim() !== screenplayId?.trim()) return;
      placeholderRetryCountRef.current = 0;
      trackedJobIdsRef.current.add(jobId);
      if (diagnosticJobIdsRef.current.size >= MAX_DIAGNOSTIC_JOBS) {
        const first = diagnosticJobIdsRef.current.values().next().value;
        if (first) diagnosticJobIdsRef.current.delete(first);
      }
      diagnosticJobIdsRef.current.add(jobId);
      console.log('[JobsDrawer] Optimistic job added', { jobId: jobId.slice(-12), jobType, assetName });
      const placeholder: WorkflowJob = {
        jobId,
        workflowId: '',
        workflowName: assetName ? `Image Generation - ${assetName}` : 'Image Generation',
        jobType: jobType as WorkflowJob['jobType'],
        status: 'running',
        progress: 0,
        createdAt: new Date().toISOString(),
        creditsUsed: 0,
      };
      optimisticPlaceholdersRef.current.set(jobId, placeholder);
      setJobs(prev => {
        if (prev.some(j => j.jobId === jobId)) return prev;
        return [placeholder, ...prev];
      });
      // Fetch by ID soon so we get full job (and results if already completed) before list/GSI overwrites with completed (no results)
      if (optimisticFetchTimeoutRef.current) clearTimeout(optimisticFetchTimeoutRef.current);
      optimisticFetchTimeoutRef.current = setTimeout(() => {
        optimisticFetchTimeoutRef.current = null;
        if (directFetchInProgressRef.current.has(jobId)) return;
        directFetchInProgressRef.current.add(jobId);
        fetchJobDirectly(jobId, { silent: true }).then((full) => {
          try {
            if (!full) {
              if (diagnosticJobIdsRef.current.has(jobId)) {
                console.log('[JobsDrawer] [DEBUG] optimistic_800ms', { jobId: jobId.slice(-12), result: 'null' });
              }
              return;
            }
            if (diagnosticJobIdsRef.current.has(full.jobId)) {
              console.log('[JobsDrawer] [DEBUG] optimistic_800ms', {
                jobId: full.jobId.slice(-12),
                status: full.status,
                hasResults: hasResultsForLog(full),
                merged: true,
              });
            }
            optimisticPlaceholdersRef.current.delete(full.jobId);
            trackedJobIdsRef.current.add(full.jobId);
            directFetchedJobsRef.current.set(full.jobId, full);
            setJobs(prev => {
              const map = new Map(prev.map((j) => [j.jobId, j]));
              map.set(full.jobId, full);
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              return merged;
            });
          } finally {
            directFetchInProgressRef.current.delete(jobId);
          }
        });
      }, OPTIMISTIC_POLL_DELAY_MS);
    };
    window.addEventListener('wryda:optimistic-job', handler as EventListener);
    return () => {
      window.removeEventListener('wryda:optimistic-job', handler as EventListener);
      if (optimisticFetchTimeoutRef.current) {
        clearTimeout(optimisticFetchTimeoutRef.current);
        optimisticFetchTimeoutRef.current = null;
      }
    };
  }, [screenplayId]);

  /**
   * Load jobs when drawer opens or screenplayId changes (one-time load).
   * Hub polls for badge when drawer is closed; we only poll list when drawer is open.
   */
  useEffect(() => {
    if (!screenplayId || screenplayId === 'default' || screenplayId.trim() === '') return;
    if (isOpen) {
      emptyRetryCountRef.current = 0;
      placeholderRetryCountRef.current = 0;
      directFetchInProgressRef.current.clear();
      directFetchedJobsRef.current.clear();
      if (screenplayId && screenplayId !== lastScreenplayIdRef.current) {
        lastScreenplayIdRef.current = screenplayId;
        trackedJobIdsRef.current.clear();
        optimisticPlaceholdersRef.current.clear();
        diagnosticJobIdsRef.current.clear();
      }
    }
    const shouldShowLoading = isOpen && jobs.length === 0 && !hasLoadedOnce;
    loadJobs(shouldShowLoading);
  }, [screenplayId, isOpen, hasLoadedOnce]);

  /**
   * When drawer is open: poll list API so jobs (including new/running) stay in sync.
   * First 10s: poll at 2s and 5s (GSI eventual consistency); then every 5s.
   */
  useEffect(() => {
    if (!isOpen || !screenplayId || screenplayId === 'default' || screenplayId.trim() === '') {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    const t2 = setTimeout(() => loadJobs(false), 2000);
    const t5 = setTimeout(() => loadJobs(false), 5000);
    const interval = setInterval(() => loadJobs(false), 5000);
    return () => {
      clearTimeout(t2);
      clearTimeout(t5);
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isOpen, screenplayId]);

  /**
   * Poll-by-ID: for every running/queued job, poll GET /api/workflows/:id until completed/failed.
   * Tracked jobs are updated only from this (and 800ms optimistic fetch); list never overwrites them.
   */
  useEffect(() => {
    if (!isOpen || !screenplayId || screenplayId === 'default' || screenplayId.trim() === '') return;

    let cancelled = false;

    const pollRunningJobsById = async () => {
      if (cancelled) return;
      const currentJobs = jobsRef.current;
      const toPoll = currentJobs
        .filter((j) => (j.status === 'running' || j.status === 'queued') && j.jobId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_POLL_PER_TICK);
      if (toPoll.length === 0) return;

      const updates: WorkflowJob[] = [];
      for (const job of toPoll) {
        if (cancelled) break;
        const updated = await fetchJobDirectly(job.jobId, { silent: true });
        if (!updated || cancelled) continue;
        if (diagnosticJobIdsRef.current.has(updated.jobId)) {
          console.log('[JobsDrawer] [DEBUG] poll_by_id', {
            jobId: updated.jobId.slice(-12),
            status: updated.status,
            hasResults: hasResultsForLog(updated),
            merged: true,
          });
        }
        optimisticPlaceholdersRef.current.delete(updated.jobId);
        trackedJobIdsRef.current.add(updated.jobId);
        const isTerminal = updated.status === 'completed' || updated.status === 'failed';
        const changed = updated.status !== job.status || (updated.results && !job.results);
        if (isTerminal || changed) updates.push(updated);
      }

      if (cancelled || updates.length === 0) return;
      setJobs((prev) => {
        const map = new Map(prev.map((j) => [j.jobId, j]));
        updates.forEach((u) => map.set(u.jobId, u));
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return merged;
      });
    };

    pollRunningJobsById(); // run once immediately so new placeholders get polled without waiting for first interval
    const interval = setInterval(pollRunningJobsById, POLL_BY_ID_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, screenplayId]);

  /**
   * Backfill: completed jobs without results (e.g. from list only) get one direct fetch so "Done" cards show thumbnails.
   */
  useEffect(() => {
    if (!isOpen || !screenplayId || screenplayId === 'default' || screenplayId.trim() === '') return;

    const completedWithoutResults = jobs.filter((j) => {
      if (j.status !== 'completed' || !j.jobId) return false;
      if (resultsBackfillFetchedRef.current.has(j.jobId)) return false;
      const hasResults = j.results && (
        (j.results.poses?.length) ||
        (j.results.angleReferences?.length) ||
        (j.results.backgroundReferences?.length) ||
        (j.results.images?.length) ||
        (j.results.videos?.length) ||
        (j.results.screenplayReading) ||
        (j.results.videoSoundscape)
      );
      return !hasResults;
    });
    if (completedWithoutResults.length === 0) return;

    const jobToBackfill = completedWithoutResults[0];

    let cancelled = false;
    fetchJobDirectly(jobToBackfill.jobId, { silent: true }).then((full) => {
      if (cancelled) return;
      // On fetch failure (null), don't mark as attempted so transient errors can retry
      if (!full) return;
      resultsBackfillFetchedRef.current.add(full.jobId);
      trackedJobIdsRef.current.add(full.jobId);
      const hasResults = full.results && (
        (full.results.poses?.length) ||
        (full.results.angleReferences?.length) ||
        (full.results.backgroundReferences?.length) ||
        (full.results.images?.length) ||
        (full.results.videos?.length) ||
        (full.results.screenplayReading) ||
        (full.results.videoSoundscape)
      );
      if (!hasResults) return;
      setJobs((prev) => {
        const map = new Map(prev.map((j) => [j.jobId, j]));
        map.set(full.jobId, full);
        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return merged;
      });
    });

    return () => { cancelled = true; };
  }, [isOpen, screenplayId, jobs]);

  /**
   * Watch for completed jobs and refresh related data
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const completedPoseJobs = visibleJobs.filter(job => 
      job.status === 'completed' && 
      job.jobType === 'pose-generation' &&
      job.results?.poses && 
      job.results.poses.length > 0
    );

    if (completedPoseJobs.length > 0) {
      queryClient.refetchQueries({ queryKey: ['characters', screenplayId, 'production-hub'] });
    }

    const completedLocationAngleJobs = jobs.filter(job =>
      job.status === 'completed' &&
      job.jobType === 'image-generation' &&
      job.results?.angleReferences &&
      job.results.angleReferences.length > 0 &&
      job.metadata?.inputs?.locationId
    );
    
    const completedLocationBackgroundJobs = jobs.filter(job =>
      job.status === 'completed' &&
      job.jobType === 'image-generation' &&
      job.results?.backgroundReferences &&
      job.results.backgroundReferences.length > 0 &&
      job.metadata?.inputs?.locationId
    );

    if (completedLocationAngleJobs.length > 0 || completedLocationBackgroundJobs.length > 0) {
      queryClient.refetchQueries({ queryKey: ['locations', screenplayId, 'production-hub'] });
    }

    const completedAssetAngleJobs = jobs.filter(job =>
      job.status === 'completed' &&
      job.jobType === 'image-generation' &&
      job.results?.angleReferences &&
      job.results.angleReferences.length > 0 &&
      job.metadata?.inputs?.assetId
    );

    if (completedAssetAngleJobs.length > 0) {
      queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] });
    }

    const completedScreenplayReadingJobs = jobs.filter(job =>
      job.status === 'completed' &&
      job.jobType === 'screenplay-reading' &&
      job.results?.screenplayReading
    );

    if (completedScreenplayReadingJobs.length > 0) {
      queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] });
    }
  }, [jobs, screenplayId, queryClient, isOpen]);

  /**
   * 🔥 CATCH-ALL: Refresh credits for ANY completed job that used credits
   * This ensures credits update immediately regardless of job type
   * Also refreshes when jobs transition to completed status
   * NOTE: This runs even when drawer is closed to ensure credits always update
   */
  useEffect(() => {
    // Process even when drawer is closed - credits need to update regardless of UI state
    
    // Create a stable hash of jobs to detect actual changes
    const currentJobsHash = jobs
      .map(j => `${j.jobId}:${j.status}:${j.creditsUsed || 0}:${j.results?.totalCreditsUsed || 0}`)
      .sort()
      .join('|');
    
    // Only process if jobs actually changed
    if (currentJobsHash === previousJobsHash.current) {
      return;
    }
    previousJobsHash.current = currentJobsHash;
    
    const newlyCompletedJobs = jobs.filter(job => {
      const isCompleted = job.status === 'completed';
      const notProcessed = !processedJobIdsForCredits.current.has(job.jobId);
      const hasCredits = job.creditsUsed > 0 || job.results?.totalCreditsUsed > 0;
      
      return isCompleted && notProcessed && hasCredits;
    });
    
    if (newlyCompletedJobs.length > 0) {
      console.log('[JobsDrawer] 🔥 CATCH-ALL: Detected completed jobs with credits, refreshing...', {
        jobCount: newlyCompletedJobs.length,
        jobIds: newlyCompletedJobs.map(j => j.jobId),
        jobTypes: newlyCompletedJobs.map(j => j.jobType),
        totalCredits: newlyCompletedJobs.reduce((sum, j) => sum + (j.creditsUsed || j.results?.totalCreditsUsed || 0), 0)
      });
      
      // Mark these jobs as processed
      newlyCompletedJobs.forEach(job => {
        processedJobIdsForCredits.current.add(job.jobId);
      });
      
      // Refresh credits immediately
      if (typeof window !== 'undefined' && (window as any).refreshCredits) {
        (window as any).refreshCredits();
      }
    }
  }, [jobs, isOpen]);

  /**
   * Check for safety errors in completed jobs
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const jobsWithSafetyErrors = jobs.filter(job => {
      if (job.status !== 'completed' || !job.results) return false;
      
      if (job.jobType === 'pose-generation' && job.results.failedPoses) {
        const safetyErrors = job.results.failedPoses.filter(fp => fp.errorCode === 'SAFETY_ERROR_USER_CHOICE');
        return safetyErrors.length > 0;
      }
      
      if (job.jobType === 'image-generation' && job.results.failedAngles) {
        const safetyErrors = job.results.failedAngles.filter(fa => fa.errorCode === 'SAFETY_ERROR_USER_CHOICE');
        return safetyErrors.length > 0;
      }
      
      return false;
    });
    
    if (jobsWithSafetyErrors.length > 0 && !showSafetyDialog) {
      const job = jobsWithSafetyErrors[0];
      const failedItems: Array<{ id: string; name: string; error: string }> = [];
      
      if (job.jobType === 'pose-generation' && job.results?.failedPoses) {
        job.results.failedPoses
          .filter(fp => fp.errorCode === 'SAFETY_ERROR_USER_CHOICE')
          .forEach(fp => {
            failedItems.push({
              id: fp.poseId,
              name: fp.poseName,
              error: fp.error
            });
          });
      } else if (job.jobType === 'image-generation' && job.results?.failedAngles) {
        job.results.failedAngles
          .filter(fa => fa.errorCode === 'SAFETY_ERROR_USER_CHOICE')
          .forEach(fa => {
            failedItems.push({
              id: fa.angle,
              name: fa.angle,
              error: fa.error
            });
          });
      }
      
      if (failedItems.length > 0) {
        setSafetyErrorData({
          jobId: job.jobId,
          jobType: job.jobType || 'unknown',
          failedItems,
          entityId: job.metadata?.inputs?.characterId || job.metadata?.inputs?.locationId || job.metadata?.inputs?.assetId,
          entityName: job.metadata?.inputs?.characterName || job.metadata?.inputs?.locationName || job.metadata?.inputs?.assetName
        });
        setShowSafetyDialog(true);
      }
    }
  }, [jobs, showSafetyDialog, isOpen]);

  // REMOVED: Retry functionality - regeneration/reshoot is now handled in storyboard

  /**
   * Delete job (local only - jobs are session-based, everything saves elsewhere)
   */
  const handleDelete = async (jobId: string) => {
    if (!confirm('Remove this job from view? (Results are saved elsewhere)')) return;

    // Add to deleted set to persist across drawer opens/closes
    setDeletedJobIds(prev => new Set([...prev, jobId]));
    toast.success('Job removed from view');
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: WorkflowJob['status']) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Clock className="w-2.5 h-2.5" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-2.5 h-2.5" />
            Done
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle className="w-2.5 h-2.5" />
            Failed
          </span>
        );
    }
  };


  /**
   * Calculate estimated remaining time for a running job
   */
  const getEstimatedRemaining = (job: WorkflowJob): string | null => {
    if (job.status !== 'running' && job.status !== 'queued') return null;
    if (job.progress === 0) return null; // Can't estimate if no progress yet
    
    const elapsed = new Date().getTime() - new Date(job.createdAt).getTime();
    const elapsedMinutes = elapsed / 60000;
    
    // Estimate: if 20% done in X minutes, remaining is 4X minutes
    if (job.progress > 0 && job.progress < 100) {
      const estimatedTotalMinutes = elapsedMinutes / (job.progress / 100);
      const remainingMinutes = estimatedTotalMinutes - elapsedMinutes;
      
      if (remainingMinutes < 1) return '< 1 min';
      if (remainingMinutes < 60) return `~${Math.round(remainingMinutes)} min`;
      const hours = Math.floor(remainingMinutes / 60);
      const mins = Math.round(remainingMinutes % 60);
      return `~${hours}h ${mins}m`;
    }
    
    return null;
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Determine z-index based on chat drawer state
  const zIndex = isChatDrawerOpen ? Z_INDEX.JOBS_DRAWER : Z_INDEX.JOBS_DRAWER;

  // Render drawer content (reused for both mobile and desktop)
  const renderDrawerContent = () => (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      {/* Header - Matches AgentDrawer style (hidden on mobile, shown on desktop) */}
      <div className="hidden md:flex flex-shrink-0 h-14 items-center justify-between px-4 bg-[#1F1F1F] border-b border-[#3F3F46]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <h3 className="text-base font-semibold text-[#E5E7EB]">Jobs</h3>
          {isPolling && (
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="btn btn-sm btn-ghost btn-circle"
          title="Close"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content - flex-1 min-h-0 so this area gets remaining height and scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {isLoading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#DC143C]" />
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-[#808080] font-medium">No jobs found</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Generate a workflow to see it here
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {visibleJobs.map((job) => (
              <div
                key={job.jobId}
                className="p-3 rounded-lg border border-[#3F3F46] bg-[#141414] hover:bg-[#1F1F1F] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-xs font-semibold text-[#E5E7EB] truncate">
                        {job.jobType === 'screenplay-reading' && job.metadata?.inputs?.screenplayTitle
                          ? `Screenplay Reading - ${job.metadata.inputs.screenplayTitle}`
                          : job.workflowName}
                      </h4>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-[10px] text-[#808080]">
                      {formatTime(job.createdAt)} · {job.creditsUsed} credits
                      {(job.status === 'running' || job.status === 'queued') && getEstimatedRemaining(job) && (
                        <span className="ml-1.5 text-blue-400">· ~{getEstimatedRemaining(job)} remaining</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-2">
                    {/* REMOVED: Retry button - regeneration/reshoot is now handled in storyboard */}
                    <button
                      onClick={() => handleDelete(job.jobId)}
                      className="p-1 rounded hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar (for running jobs) */}
                {(job.status === 'running' || job.status === 'queued') && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-[#808080]">Progress</span>
                      <span className="font-semibold text-[#DC143C]">{Math.round(job.progress)}%</span>
                    </div>
                    <div className="h-1 bg-[#1F1F1F] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#DC143C] transition-all duration-[2000ms] ease-out"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {job.status === 'failed' && job.error && (
                  <div className="p-2 rounded bg-red-900/20 border border-red-800 mb-2">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-300">{job.error}</p>
                    </div>
                  </div>
                )}

                {/* Results (for completed jobs) - Compact view */}
                {job.status === 'completed' && job.results && (
                  <div className="space-y-1.5">
                    {/* Result summary */}
                    <div className="flex items-center gap-2 text-[10px] text-[#808080]">
                      {job.jobType === 'pose-generation' && job.results.poses && (
                        <span className="flex items-center gap-0.5">
                          <Image className="w-2.5 h-2.5" />
                          {job.results.poses.length} pose(s)
                        </span>
                      )}
                      {job.jobType === 'image-generation' && (
                        <>
                          {job.results.angleReferences && job.results.angleReferences.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Image className="w-2.5 h-2.5" />
                              {job.results.angleReferences.length} angle(s)
                            </span>
                          )}
                          {job.results.images && job.results.images.length > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Image className="w-2.5 h-2.5" />
                              {job.results.images.length} image(s)
                            </span>
                          )}
                        </>
                      )}
                      {job.jobType === 'audio-generation' && job.results.audio && (
                        <span className="flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5" />
                          {job.results.audio.length} audio
                        </span>
                      )}
                      {job.jobType === 'complete-scene' && job.results.videos && (
                        <span className="flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5" />
                          {job.results.videos.length} video(s)
                        </span>
                      )}
                      {job.jobType === 'screenplay-reading' && job.results.screenplayReading && (
                        <span className="flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5" />
                          {job.results.screenplayReading.sceneAudios?.length || job.results.screenplayReading.scenesProcessed?.length || 0} scene(s)
                        </span>
                      )}
                      {job.jobType === 'video-soundscape' && job.results.videoSoundscape && (
                        <span className="flex items-center gap-0.5">
                          <Music className="w-2.5 h-2.5" />
                          Analysis complete
                        </span>
                      )}
                    </div>

                    {/* Compact thumbnails - 4 columns for drawer */}
                    {job.jobType === 'pose-generation' && job.results.poses && job.results.poses.length > 0 && (
                      <div className="grid grid-cols-4 gap-1">
                        {job.results.poses.slice(0, 4).map((pose, index) => {
                          const characterId = job.metadata?.inputs?.characterId;
                          const canNavigate = onNavigateToEntity && characterId;
                          return (
                            <div
                              key={pose.poseId || index}
                              className={`relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] ${
                                canNavigate ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (canNavigate) {
                                  onNavigateToEntity('character', characterId);
                                  onClose();
                                }
                              }}
                              title={canNavigate ? `View ${job.metadata?.inputs?.characterName || 'Character'}` : undefined}
                            >
                              {pose.s3Key ? (
                                <ImageThumbnailFromS3Key 
                                  s3Key={pose.s3Key} 
                                  alt={pose.poseName || `Pose ${index + 1}`}
                                  fallbackUrl={pose.imageUrl}
                                />
                              ) : pose.imageUrl ? (
                                <img
                                  src={pose.imageUrl}
                                  alt={pose.poseName || `Pose ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] text-[#6B7280] text-[8px]">
                                  No image
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {job.results.poses.length > 4 && (
                          <div className="relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] flex items-center justify-center">
                            <span className="text-[8px] text-[#808080]">+{job.results.poses.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Angle References - Location/Asset angles */}
                    {job.jobType === 'image-generation' && job.results?.angleReferences && job.results.angleReferences.length > 0 && (
                      <div className="grid grid-cols-4 gap-1">
                        {job.results.angleReferences.slice(0, 4).map((angleRef, index) => {
                          const locationId = job.metadata?.inputs?.locationId;
                          const assetId = job.metadata?.inputs?.assetId;
                          const entityType = locationId ? 'location' : assetId ? 'asset' : null;
                          const entityId = locationId || assetId;
                          const entityName = job.metadata?.inputs?.locationName || job.metadata?.inputs?.assetName;
                          const canNavigate = onNavigateToEntity && entityType && entityId;
                          
                          return (
                            <div
                              key={angleRef.s3Key || index}
                              className={`relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] ${
                                canNavigate ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (canNavigate && entityType) {
                                  onNavigateToEntity(entityType, entityId);
                                  onClose();
                                }
                              }}
                              title={canNavigate ? `View ${entityName || entityType}` : undefined}
                            >
                              {angleRef.s3Key ? (
                                <ImageThumbnailFromS3Key 
                                  s3Key={angleRef.s3Key} 
                                  alt={`${angleRef.angle} view`}
                                  fallbackUrl={angleRef.imageUrl}
                                />
                              ) : angleRef.imageUrl ? (
                                <img
                                  src={angleRef.imageUrl}
                                  alt={`${angleRef.angle} view`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] text-[#6B7280] text-[8px]">
                                  No image
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                                <p className="text-[8px] text-white truncate capitalize">{angleRef.angle || `Angle ${index + 1}`}</p>
                              </div>
                            </div>
                          );
                        })}
                        {job.results.angleReferences.length > 4 && (
                          <div className="relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] flex items-center justify-center">
                            <span className="text-[8px] text-[#808080]">+{job.results.angleReferences.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Background References - Location backgrounds */}
                    {job.jobType === 'image-generation' && job.results?.backgroundReferences && job.results.backgroundReferences.length > 0 && (
                      <div className="grid grid-cols-4 gap-1">
                        {job.results.backgroundReferences.slice(0, 4).map((bgRef: any, index: number) => {
                          const locationId = job.metadata?.inputs?.locationId;
                          const entityType = locationId ? 'location' : null;
                          const entityId = locationId;
                          const entityName = job.metadata?.inputs?.locationName;
                          const canNavigate = onNavigateToEntity && entityType && entityId;
                          
                          return (
                            <div
                              key={bgRef.s3Key || index}
                              className={`relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] ${
                                canNavigate ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (canNavigate && entityType) {
                                  onNavigateToEntity(entityType, entityId);
                                  onClose();
                                }
                              }}
                              title={canNavigate ? `View ${entityName || entityType}` : undefined}
                            >
                              {bgRef.s3Key ? (
                                <ImageThumbnailFromS3Key 
                                  s3Key={bgRef.s3Key} 
                                  alt={`${bgRef.backgroundType} background`}
                                  fallbackUrl={bgRef.imageUrl}
                                />
                              ) : bgRef.imageUrl ? (
                                <img
                                  src={bgRef.imageUrl}
                                  alt={`${bgRef.backgroundType} background`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] text-[#6B7280] text-[8px]">
                                  No image
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                                <p className="text-[8px] text-white truncate capitalize">{bgRef.backgroundType || `Background ${index + 1}`}</p>
                              </div>
                            </div>
                          );
                        })}
                        {job.results.backgroundReferences.length > 4 && (
                          <div className="relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] flex items-center justify-center">
                            <span className="text-[8px] text-[#808080]">+{job.results.backgroundReferences.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generic Images */}
                    {job.jobType === 'image-generation' && job.results.images && job.results.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-1">
                        {job.results.images.slice(0, 4).map((img, index) => {
                          const characterId = job.metadata?.inputs?.characterId;
                          const locationId = job.metadata?.inputs?.locationId;
                          const assetId = job.metadata?.inputs?.assetId;
                          const entityType = characterId ? 'character' : locationId ? 'location' : assetId ? 'asset' : null;
                          const entityId = characterId || locationId || assetId;
                          const entityName = job.metadata?.inputs?.characterName || job.metadata?.inputs?.locationName || job.metadata?.inputs?.assetName;
                          const canNavigate = onNavigateToEntity && entityType && entityId;
                          
                          return (
                            <div
                              key={index}
                              className={`relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] ${
                                canNavigate ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                              }`}
                              onClick={() => {
                                if (canNavigate && entityType) {
                                  onNavigateToEntity(entityType, entityId);
                                  onClose();
                                }
                              }}
                              title={canNavigate ? `View ${entityName || entityType}` : undefined}
                            >
                              {img.s3Key ? (
                                <ImageThumbnailFromS3Key 
                                  s3Key={img.s3Key} 
                                  alt={img.label || `Image ${index + 1}`}
                                  fallbackUrl={img.imageUrl}
                                />
                              ) : img.imageUrl ? (
                                <img
                                  src={img.imageUrl}
                                  alt={img.label || `Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] text-[#6B7280] text-[8px]">
                                  No image
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {job.results.images.length > 4 && (
                          <div className="relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F] flex items-center justify-center">
                            <span className="text-[8px] text-[#808080]">+{job.results.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download buttons - compact */}
                    <div className="flex flex-wrap gap-1">
                      {job.jobType === 'audio-generation' && job.results.audio && job.results.audio.length > 0 && (
                        <button
                          onClick={() => {
                            const firstAudio = job.results!.audio![0];
                            setSelectedAsset({
                              url: firstAudio.audioUrl,
                              s3Key: firstAudio.s3Key,
                              name: firstAudio.label || 'Generated Audio',
                              type: 'audio',
                              metadata: {
                                audioType: job.metadata?.inputs?.type || 'audio',
                                prompt: job.metadata?.inputs?.prompt,
                                allAudio: job.results!.audio
                              }
                            });
                            setShowStorageModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#8B5CF6] text-white hover:bg-[#7C4DCC] transition-colors"
                        >
                          <Save className="w-2.5 h-2.5" />
                          Save
                        </button>
                      )}
                      
                      {job.jobType === 'complete-scene' && job.results.videos && (
                        <>
                          {job.results.videos.map((video, index) => (
                            <a
                              key={index}
                              href={video.url}
                              download
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
                            >
                              <Download className="w-2.5 h-2.5" />
                              Download
                            </a>
                          ))}
                        </>
                      )}

                      {job.jobType === 'video-soundscape' && job.results.videoSoundscape && (
                        <button
                          onClick={() => {
                            router.push('/direct?tab=soundscape');
                            onClose(); // Close drawer when navigating
                            // Store analysisId in sessionStorage so VideoSoundscapePanel can load it
                            if (job.results?.videoSoundscape?.analysisId) {
                              sessionStorage.setItem('videoSoundscape_analysisId', job.results.videoSoundscape.analysisId);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5" />
                          View Analysis
                        </button>
                      )}
                      {job.jobType === 'screenplay-reading' && job.results.screenplayReading && (
                        <button
                          onClick={() => {
                            router.push('/produce?tab=readings');
                            onClose(); // Close drawer when navigating
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
                        >
                          <ChevronRight className="w-2.5 h-2.5" />
                          View in Readings
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // MOBILE RENDER - EXACT same pattern as AgentDrawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop - Mobile Only */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Drawer - Slides up from bottom - EXACT same as AgentDrawer */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#3F3F46] z-50 transition-all duration-300 ease-out md:hidden rounded-t-2xl"
          style={{ height: `${currentMobileHeight}px` }}
        >
          {/* Drag Handle (Mobile) - Compact like debug panel */}
          <div
            className="w-full py-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing bg-[#1F1F1F] border-b border-[#3F3F46] rounded-t-2xl relative"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            {isOpen && (
              <>
                <GripHorizontal className="w-6 h-6 text-[#808080]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="absolute right-4 btn btn-sm btn-ghost btn-circle z-10"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {!isOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="w-full h-full text-xs font-medium text-[#E5E7EB] flex items-center justify-center gap-2"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                Jobs
                {(jobCount > 0 || visibleJobs.length > 0) && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white min-w-[18px] text-center">
                    {(jobCount || visibleJobs.length) > 99 ? '99+' : (jobCount || visibleJobs.length)}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Content */}
          {isOpen && (
            <div className="h-[calc(100%-48px)] overflow-auto pb-6">
              {renderDrawerContent()}
            </div>
          )}
        </div>

        {/* Safety Error Dialog */}
        <AlertDialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>4K Generation Failed</AlertDialogTitle>
              <AlertDialogDescription>
                {safetyErrorData?.failedItems.length || 0} item(s) failed due to safety restrictions.
                <br /><br />
                Would you like to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Retry 4K:</strong> Try generating in 4K quality again (may still fail if content is restricted)</li>
                  <li><strong>Use Standard (1080p):</strong> Generate with standard quality, which has fewer safety restrictions</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowSafetyDialog(false);
                setSafetyErrorData(null);
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setShowSafetyDialog(false);
                  setSafetyErrorData(null);
                  toast.info('Regenerate with standard quality - coming soon');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Use Standard (1080p)
              </AlertDialogAction>
              <AlertDialogAction
                onClick={async () => {
                  setShowSafetyDialog(false);
                  setSafetyErrorData(null);
                  toast.info('Retry 4K - coming soon');
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Retry 4K
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Storage Decision Modal */}
        {showStorageModal && selectedAsset && (
          <StorageDecisionModal
            isOpen={showStorageModal}
            onClose={() => {
              setShowStorageModal(false);
              setSelectedAsset(null);
            }}
            assetType={selectedAsset.type}
            assetName={selectedAsset.name}
            s3TempUrl={selectedAsset.url}
            s3Key={selectedAsset.s3Key}
            fileSize={undefined}
            metadata={selectedAsset.metadata}
          />
        )}
      </>
    );
  }

  // DESKTOP RENDER - EXACT same pattern as AgentDrawer
  return (
    <>
      {/* Backdrop - Desktop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 transition-opacity hidden md:block"
          onClick={onClose}
        />
      )}

      {/* Desktop Drawer - Slides in from right - EXACT same as AgentDrawer */}
      <div
        className={`fixed top-0 right-0 h-full flex flex-col bg-[#0A0A0A] border-l border-[#3F3F46] shadow-xl z-40 transition-all duration-300 ease-out hidden md:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: compact ? '100vw' : '400px', maxWidth: '90vw' }}
      >
        {renderDrawerContent()}
      </div>

      {/* Floating Open Button (Desktop - when closed) - EXACT same as AgentDrawer */}
      {!isOpen && (
        <button
          onClick={() => onOpen()}
          className="fixed top-1/2 right-0 -translate-y-1/2 bg-blue-600 hover:opacity-90 text-white text-sm font-medium rounded-l-lg rounded-r-none shadow-lg hidden md:flex z-30 border-none px-4 py-3 transition-all duration-300"
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed',
            animation: 'pulse-subtle 3s ease-in-out infinite'
          }}
        >
          JOBS
        </button>
      )}

      {/* Safety Error Dialog */}
      <AlertDialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>4K Generation Failed</AlertDialogTitle>
            <AlertDialogDescription>
              {safetyErrorData?.failedItems.length || 0} item(s) failed due to safety restrictions.
              <br /><br />
              Would you like to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Retry 4K:</strong> Try generating in 4K quality again (may still fail if content is restricted)</li>
                <li><strong>Use Standard (1080p):</strong> Generate with standard quality, which has fewer safety restrictions</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSafetyDialog(false);
              setSafetyErrorData(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowSafetyDialog(false);
                setSafetyErrorData(null);
                toast.info('Regenerate with standard quality - coming soon');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Use Standard (1080p)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={async () => {
                setShowSafetyDialog(false);
                setSafetyErrorData(null);
                toast.info('Retry 4K - coming soon');
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Retry 4K
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Storage Decision Modal */}
      {showStorageModal && selectedAsset && (
        <StorageDecisionModal
          isOpen={showStorageModal}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedAsset(null);
          }}
          assetType={selectedAsset.type}
          assetName={selectedAsset.name}
          s3TempUrl={selectedAsset.url}
          s3Key={selectedAsset.s3Key}
          fileSize={undefined}
          metadata={selectedAsset.metadata}
        />
      )}
    </>
  );
}

