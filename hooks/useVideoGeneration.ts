/**
 * useVideoGeneration Hook
 * 
 * Handles asynchronous video generation with polling-based status checking.
 * Allows users to continue working while videos generate in the background.
 * 
 * Usage:
 * const { startGeneration, cancelGeneration, jobId, status, progress, videos } = useVideoGeneration();
 * 
 * await startGeneration({
 *   prompts: [{ text: "A car drives down a street", segmentIndex: 0 }],
 *   provider: "veo-3.1",
 *   resolution: "1080p",
 *   ...
 * });
 * 
 * // Hook automatically polls for status updates
 * // Shows toast notification when complete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface VideoJobResult {
  videoUrl: string;
  s3Key: string;
  segmentIndex: number;
  duration: number;
  creditsUsed: number;
  generatedAt: string;
  hasAudio: boolean;
  
  // NEW: Asset metadata for timeline (Feature 0064)
  assetMetadata?: {
    sourceType: 'ai-video';
    provider: string;
    prompt: string;
    resolution: string;
    aspectRatio: string;
    duration: string;
    videoMode: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images';
    enableSound?: boolean;
    enableLoop?: boolean;
    cameraMotion?: string;
    referenceImages?: string[];
    startImage?: string;
    endImage?: string;
    qualityTier?: string;
    generatedAt: string;
    jobId: string;
    creditsUsed: number;
    model?: string;
    generationTime?: number;
  };
}

export interface VideoGenerationParams {
  prompts: Array<{
    text: string;
    segmentIndex: number;
  }>;
  // Provider-agnostic parameters (NEW in Feature 0060)
  videoMode?: string;               // NEW: 'text-only' | 'image-start' | 'image-interpolation' | 'reference-images'
  qualityTier: string;              // professional, premium, cinema
  cameraMotion?: string;            // NEW: Unified camera motion (provider-agnostic)
  enableSound?: boolean;            // NEW: Provider-agnostic sound generation
  
  // Standard parameters
  resolution: string;
  aspectRatio: string;
  sceneId: string;
  sceneName: string;
  useVideoExtension?: boolean;
  
  // Image parameters
  referenceImageS3Keys?: string[];  // Up to 3 reference images for character consistency
  referenceImageUrls?: string[];    // Presigned URLs for reference images
  startImageS3Key?: string;
  startImageUrl?: string;           // Presigned URL
  endImageS3Key?: string;
  endImageUrl?: string;             // Presigned URL
  
  // Additional options
  duration?: string;
  enableLoop?: boolean;
  
  // DEPRECATED (backward compat - backend ignores these)
  lumaConcepts?: string;
  lumaCameraMotion?: string;
  lumaModel?: string;
}

export type VideoJobStatus = 'idle' | 'queued' | 'generating' | 'enhancing' | 'completed' | 'failed' | 'cancelled';

interface VideoJobState {
  jobId: string | null;
  status: VideoJobStatus;
  progress: number;
  videos: VideoJobResult[];
  totalCreditsUsed: number;
  error: string | null;
  isPolling: boolean;
}

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_FAILURES = 3;

export function useVideoGeneration() {
  const [state, setState] = useState<VideoJobState>({
    jobId: null,
    status: 'idle',
    progress: 0,
    videos: [],
    totalCreditsUsed: 0,
    error: null,
    isPolling: false,
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollFailureCountRef = useRef(0);
  const hasNotifiedRef = useRef(false);

  /**
   * Poll job status
   */
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/video/jobs/${jobId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }

      const data = await response.json();
      const job = data.job;

      // Reset failure count on success
      pollFailureCountRef.current = 0;

      // Update state
      setState(prev => ({
        ...prev,
        status: job.status,
        progress: job.progress || 0,
        videos: job.videos || [],
        totalCreditsUsed: job.totalCreditsUsed || 0,
        error: job.error?.message || null,
      }));

      // No notification for 'enhancing' phase - just let progress bars update silently
      // User doesn't need to know about internal processing steps

      // Stop polling if job is finished
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setState(prev => ({ ...prev, isPolling: false }));

        // Show notification (only once)
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;

          if (job.status === 'completed') {
            toast.success('✅ Your video is ready!', {
              duration: 5000,
              description: `Generated ${job.videos?.length || 0} video(s) using ${job.totalCreditsUsed || 0} credits`,
            });
            
            // 🔥 Refresh credits immediately after video generation completes
            if (typeof window !== 'undefined' && window.refreshCredits) {
              window.refreshCredits();
            }
          } else if (job.status === 'failed') {
            toast.error('❌ Video generation failed', {
              duration: 5000,
              description: job.error?.message || 'Unknown error',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('[useVideoGeneration] Poll error:', error);
      pollFailureCountRef.current++;

      // Stop polling after too many failures
      if (pollFailureCountRef.current >= MAX_POLL_FAILURES) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Lost connection to server. Please refresh and check your jobs.',
          isPolling: false,
        }));

        toast.error('❌ Connection lost', {
          description: 'Unable to check video generation status. Please refresh the page.',
        });
      }
    }
  }, []);

  /**
   * Start video generation
   */
  const startGeneration = useCallback(async (params: VideoGenerationParams) => {
    try {
      // Reset state
      setState({
        jobId: null,
        status: 'queued',
        progress: 0,
        videos: [],
        totalCreditsUsed: 0,
        error: null,
        isPolling: false,
      });
      hasNotifiedRef.current = false;
      pollFailureCountRef.current = 0;

      // Get auth token
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Authentication required. Please sign in.');
      }

      // Call async video generation endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/video/generate-async`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to start video generation: ${response.statusText}`);
      }

      const data = await response.json();
      const jobId = data.jobId;

      if (!jobId) {
        throw new Error('No job ID returned from server');
      }

      console.log('[useVideoGeneration] Job started:', jobId);

      // Update state with jobId
      setState(prev => ({
        ...prev,
        jobId,
        status: 'queued',
        isPolling: true,
      }));

      // Start polling immediately
      await pollJobStatus(jobId);

      // Set up polling interval
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(jobId);
      }, POLL_INTERVAL);

      return jobId;
    } catch (error: any) {
      console.error('[useVideoGeneration] Start error:', error);

      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Failed to start video generation',
      }));

      toast.error('❌ Failed to start video generation', {
        description: error.message,
      });

      throw error;
    }
  }, [pollJobStatus]);

  /**
   * Cancel video generation
   */
  const cancelGeneration = useCallback(async () => {
    if (!state.jobId) {
      return;
    }

    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/video/jobs/${state.jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel job: ${response.statusText}`);
      }

      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Reset state
      setState({
        jobId: null,
        status: 'cancelled',
        progress: 0,
        videos: [],
        totalCreditsUsed: 0,
        error: null,
        isPolling: false,
      });

      toast.info('Video generation cancelled');
    } catch (error: any) {
      console.error('[useVideoGeneration] Cancel error:', error);
      toast.error('Failed to cancel generation', {
        description: error.message,
      });
    }
  }, [state.jobId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setState({
      jobId: null,
      status: 'idle',
      progress: 0,
      videos: [],
      totalCreditsUsed: 0,
      error: null,
      isPolling: false,
    });

    hasNotifiedRef.current = false;
    pollFailureCountRef.current = 0;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  return {
    // State
    jobId: state.jobId,
    status: state.status,
    progress: state.progress,
    videos: state.videos,
    totalCreditsUsed: state.totalCreditsUsed,
    error: state.error,
    isPolling: state.isPolling,
    isGenerating: state.status === 'queued' || state.status === 'generating',
    isComplete: state.status === 'completed',
    isFailed: state.status === 'failed',

    // Actions
    startGeneration,
    cancelGeneration,
    reset,
  };
}

