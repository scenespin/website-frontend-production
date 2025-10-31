/**
 * Job Recovery Hook
 * 
 * Fetches user's recent completed jobs and identifies "orphaned" jobs
 * (jobs that completed while user was away and haven't been seen yet).
 * 
 * Feature 0067: Orphaned Job Recovery System
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { filterUnseenJobs, markJobAsSeen, cleanupOldSeenJobs } from '@/utils/jobTracking';

export interface OrphanedJob {
  jobId: string;
  jobType: 'video' | 'image' | 'composition';
  status: 'completed' | 'failed';
  assets: Array<{
    url: string;
    s3Key?: string;
    thumbnailUrl?: string;
    creditsUsed?: number;
  }>;
  creditsUsed: number;
  completedAt: string;
  createdAt: string;
  metadata?: {
    prompt?: string;
    qualityTier?: string;
    provider?: string;
    resolution?: string;
    aspectRatio?: string;
    duration?: string;
    [key: string]: any;
  };
}

export interface UseJobRecoveryReturn {
  isChecking: boolean;
  orphanedJobs: OrphanedJob[];
  totalOrphanedCount: number;
  checkForOrphanedJobs: () => Promise<void>;
  dismissJob: (jobId: string) => void;
  error: string | null;
}

/**
 * Hook to check for orphaned (unseen completed) jobs
 * 
 * @param userId - User ID
 * @param autoCheck - Whether to check automatically on mount (default: true)
 * @param checkInterval - Interval in ms to auto-check (default: 60000 = 1 min)
 */
export function useJobRecovery(
  userId: string | undefined,
  autoCheck: boolean = true,
  checkInterval: number = 60000
): UseJobRecoveryReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [orphanedJobs, setOrphanedJobs] = useState<OrphanedJob[]>([]);
  const [totalOrphanedCount, setTotalOrphanedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch video generation jobs from backend
   */
  const fetchVideoJobs = useCallback(async (): Promise<OrphanedJob[]> => {
    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();
      
      if (!token) {
        return [];
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/video/jobs?limit=10&status=completed`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('[JobRecovery] Failed to fetch video jobs:', response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.success || !data.jobs) {
        return [];
      }

      // Transform video jobs to OrphanedJob format
      return data.jobs.map((job: any) => ({
        jobId: job.jobId,
        jobType: 'video' as const,
        status: job.status,
        assets: (job.videos || []).map((video: any) => ({
          url: video.videoUrl,
          s3Key: video.s3Key,
          thumbnailUrl: video.thumbnailUrl,
          creditsUsed: video.creditsUsed
        })),
        creditsUsed: job.totalCreditsUsed || 0,
        completedAt: job.completedAt || job.updatedAt,
        createdAt: job.createdAt,
        metadata: {
          prompt: job.prompt,
          qualityTier: job.qualityTier,
          provider: job.provider,
          resolution: job.resolution,
          aspectRatio: job.aspectRatio,
          duration: job.duration
        }
      }));
    } catch (error) {
      console.error('[JobRecovery] Error fetching video jobs:', error);
      return [];
    }
  }, []);

  /**
   * Fetch composition jobs from backend
   */
  const fetchCompositionJobs = useCallback(async (): Promise<OrphanedJob[]> => {
    try {
      const { getAuthToken } = await import('@/utils/api');
      const token = await getAuthToken();
      
      if (!token) {
        return [];
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/composition/history?limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('[JobRecovery] Failed to fetch composition jobs:', response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.jobs) {
        return [];
      }

      // Transform composition jobs to OrphanedJob format
      // Only include completed jobs
      return data.jobs
        .filter((job: any) => job.status === 'completed' && job.output_video_url)
        .map((job: any) => ({
          jobId: job.job_id,
          jobType: 'composition' as const,
          status: 'completed' as const,
          assets: [{
            url: job.output_video_url,
            s3Key: job.output_s3_key,
            thumbnailUrl: job.thumbnail_url
          }],
          creditsUsed: job.credits_used || 0,
          completedAt: job.updated_at,
          createdAt: job.created_at,
          metadata: {
            layoutId: job.layout_id,
            compositionType: job.composition_type
          }
        }));
    } catch (error) {
      console.error('[JobRecovery] Error fetching composition jobs:', error);
      return [];
    }
  }, []);

  /**
   * Fetch image generation jobs from backend
   * (Future: When image jobs API is available)
   */
  const fetchImageJobs = useCallback(async (): Promise<OrphanedJob[]> => {
    // TODO: Implement when image jobs API is available
    // For now, return empty array
    return [];
  }, []);

  /**
   * Main function to check for orphaned jobs
   */
  const checkForOrphanedJobs = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Cleanup old seen jobs first (30+ days old)
      cleanupOldSeenJobs(userId);

      // Fetch all job types in parallel
      const [videoJobs, compositionJobs, imageJobs] = await Promise.all([
        fetchVideoJobs(),
        fetchCompositionJobs(),
        fetchImageJobs()
      ]);

      // Combine all jobs
      const allJobs = [...videoJobs, ...compositionJobs, ...imageJobs];

      // Filter out already-seen jobs
      const unseen = filterUnseenJobs(userId, allJobs);

      // Sort by completion time (most recent first)
      unseen.sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      });

      setOrphanedJobs(unseen);
      setTotalOrphanedCount(unseen.length);

      console.log(`[JobRecovery] Found ${unseen.length} orphaned jobs`);
    } catch (err: any) {
      console.error('[JobRecovery] Error checking for orphaned jobs:', err);
      setError(err.message || 'Failed to check for orphaned jobs');
    } finally {
      setIsChecking(false);
    }
  }, [userId, fetchVideoJobs, fetchCompositionJobs, fetchImageJobs]);

  /**
   * Dismiss a job (mark as seen without saving)
   */
  const dismissJob = useCallback((jobId: string) => {
    if (!userId) {
      return;
    }

    // Find the job to get its type
    const job = orphanedJobs.find(j => j.jobId === jobId);
    
    if (job) {
      // Mark as seen
      markJobAsSeen(userId, jobId, job.jobType, false);
      
      // Remove from orphaned list
      setOrphanedJobs(prev => prev.filter(j => j.jobId !== jobId));
      setTotalOrphanedCount(prev => Math.max(0, prev - 1));
      
      console.log(`[JobRecovery] Dismissed job: ${jobId}`);
    }
  }, [userId, orphanedJobs]);

  /**
   * Auto-check on mount if enabled
   */
  useEffect(() => {
    if (autoCheck && userId) {
      checkForOrphanedJobs();
    }
  }, [autoCheck, userId, checkForOrphanedJobs]);

  /**
   * Auto-check at interval if enabled
   */
  useEffect(() => {
    if (!userId || checkInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      checkForOrphanedJobs();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [userId, checkInterval, checkForOrphanedJobs]);

  return {
    isChecking,
    orphanedJobs,
    totalOrphanedCount,
    checkForOrphanedJobs,
    dismissJob,
    error
  };
}

