'use client';

/**
 * Production Jobs Panel
 * 
 * Displays workflow execution history with real-time polling for running jobs.
 * Allows users to view, download, retry, and manage all their workflow jobs.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Loader2, CheckCircle, XCircle, Clock, Download, 
  RefreshCw, Trash2, Filter, ChevronDown, Play,
  Sparkles, AlertCircle, Image, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { useQueryClient } from '@tanstack/react-query';
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

interface WorkflowJob {
  jobId: string;
  workflowId: string;
  workflowName: string;
  jobType?: 'complete-scene' | 'pose-generation' | 'image-generation' | 'audio-generation' | 'workflow-execution' | 'playground-experiment';
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
    totalCreditsUsed: number;
    executionTime: number;
    failedPoses?: Array<{
      poseId: string;
      poseName: string;
      error: string;
      errorCode?: string; // 'SAFETY_ERROR_USER_CHOICE' for safety errors
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
      errorCode?: string; // 'SAFETY_ERROR_USER_CHOICE' for safety errors
      attemptedQuality?: string;
    }>;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
  creditsUsed: number;
  metadata?: any;
}

interface ProductionJobsPanelProps {
  projectId: string;
}

type StatusFilter = 'all' | 'running' | 'completed' | 'failed';

/**
 * Helper component to display image thumbnail from S3 key
 * Generates presigned URL on mount, with fallback to provided URL
 */
function ImageThumbnailFromS3Key({ s3Key, alt, fallbackUrl }: { s3Key: string; alt: string; fallbackUrl?: string }) {
  const { getToken } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(fallbackUrl || null);
  const [isLoading, setIsLoading] = useState(!fallbackUrl); // If fallbackUrl exists, don't show loading initially
  const [useFallback, setUseFallback] = useState(!!fallbackUrl);

  useEffect(() => {
    async function fetchPresignedUrl() {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Call API to get presigned URL
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

        if (response.ok) {
          const data = await response.json();
          if (data.downloadUrl) {
            setImageUrl(data.downloadUrl);
            setUseFallback(false); // Use fresh presigned URL
          }
        }
      } catch (error) {
        console.error('[ImageThumbnail] Failed to fetch presigned URL:', error);
        // Keep fallbackUrl if available
        if (!fallbackUrl) {
          setImageUrl(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (s3Key) {
      // Always fetch fresh presigned URL, but use fallbackUrl immediately if available
      fetchPresignedUrl();
    } else {
      setIsLoading(false);
    }
  }, [s3Key, getToken, fallbackUrl]);

  if (isLoading && !useFallback) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[10px]">
        No image
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        // If fallback failed and we have s3Key, try to fetch again
        if (useFallback && s3Key) {
          // Will be handled by useEffect
          setUseFallback(false);
        } else {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
        }
      }}
    />
  );
}

export function ProductionJobsPanel({ projectId }: ProductionJobsPanelProps) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isPolling, setIsPolling] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track if we've successfully loaded jobs at least once
  
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

  /**
   * Load jobs from API
   */
  const loadJobs = async (showLoading: boolean = false) => {
    try {
      // Validate projectId - don't load if invalid
      if (!projectId || projectId === 'default' || projectId.trim() === '') {
        console.log('[JobsPanel] Skipping load - invalid projectId:', projectId);
        return;
      }
      
      // Only show loading spinner on initial load, not on periodic refreshes
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

      // Use the new executions endpoint instead of list endpoint
      const statusParam = statusFilter === 'all' ? '' : statusFilter;
      const url = `/api/workflows/executions?projectId=${projectId}${statusParam ? `&status=${statusParam}` : ''}&limit=50`;
      
      console.log('[JobsPanel] Loading jobs from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      console.log('[JobsPanel] Jobs response:', { 
        success: data.success, 
        hasData: !!data.data,
        jobCount: data.data?.jobs?.length || data.jobs?.length || 0, 
        jobs: data.data?.jobs || data.jobs,
        fullResponse: data,
        projectId,
        userId 
      });

      if (data.success) {
        // Backend uses sendSuccess which wraps in { success: true, data: { jobs: [...] } }
        // But also check for direct jobs property for backwards compatibility
        const jobList = data.data?.jobs || data.jobs || [];
        
        // Merge jobs instead of replacing to prevent flashing
        // Update existing jobs and add new ones
        // 🔥 FIX: Sort by creation date (newest first) so new jobs appear at top
        setJobs(prevJobs => {
          const jobMap = new Map(prevJobs.map(j => [j.jobId, j]));
          jobList.forEach((newJob: WorkflowJob) => {
            jobMap.set(newJob.jobId, newJob);
          });
          const mergedJobs = Array.from(jobMap.values());
          // Sort by createdAt (newest first)
          mergedJobs.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Descending (newest first)
          });
          return mergedJobs;
        });
        
        if (!hasLoadedOnce) {
          setHasLoadedOnce(true);
        }
        
        if (jobList.length === 0) {
          console.log('[JobsPanel] No jobs found - this might be expected if no jobs have been created yet');
          console.log('[JobsPanel] Checking filters:', { projectId, statusFilter });
        } else {
          console.log('[JobsPanel] ✅ Loaded jobs:', jobList.map(j => ({ id: j.jobId, type: j.jobType, status: j.status })));
        }
      } else {
        console.error('[JobsPanel] API error:', data.error);
        if (showLoading) {
          toast.error('Failed to load jobs', { description: data.error });
        }
      }
    } catch (error: any) {
      console.error('[JobsPanel] Load error:', error);
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
   * Initial load and periodic refresh
   * Refresh on mount, when filters change, and every 10 seconds to catch newly completed jobs
   */
  useEffect(() => {
    // Only show loading spinner if we have no jobs loaded yet (prevents flashing)
    const shouldShowLoading = jobs.length === 0 && !hasLoadedOnce;
    
    // Always load jobs on mount or filter change, but only show loading spinner if we haven't loaded before
    loadJobs(shouldShowLoading);
    
    // Set up periodic refresh (every 10 seconds) to catch newly completed jobs
    // Don't show loading spinner on periodic refreshes to avoid clearing jobs
    const refreshInterval = setInterval(() => {
      loadJobs(false);
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, statusFilter]); // loadJobs is stable, but we want to reload when filters change

  /**
   * Poll running jobs every 3 seconds (more aggressive for immediate updates)
   * 🔥 FIX: Also poll when jobs array changes to catch newly created jobs
   */
  useEffect(() => {
    const hasRunningJobs = jobs.some(job => job.status === 'running' || job.status === 'queued');
    
    // Always poll if we have jobs (even completed ones) to catch newly created jobs
    // This ensures new jobs appear immediately
    setIsPolling(true);
    const interval = setInterval(() => {
      loadJobs(false); // Don't show loading spinner on polling
    }, 3000); // Poll every 3 seconds for faster updates

    return () => clearInterval(interval);
  }, [jobs.length]); // Re-run when jobs array length changes (new job added)
  
  /**
   * Watch for completed pose generation jobs and refresh character data
   * Simplified: Just refresh immediately when job completes
   */
  useEffect(() => {
    const completedPoseJobs = jobs.filter(job => 
      job.status === 'completed' && 
      job.jobType === 'pose-generation' &&
      job.results?.poses && 
      job.results.poses.length > 0
    );
    
    if (completedPoseJobs.length > 0) {
      console.log('[ProductionJobsPanel] Pose generation completed, refreshing characters immediately...', completedPoseJobs.length);
      
      // Refresh immediately - backend should have saved by the time job status is 'completed'
      window.dispatchEvent(new CustomEvent('refreshCharacters'));
      
      // Also invalidate React Query cache for media files
      queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
    }
  }, [jobs, projectId, queryClient]);
  
  /**
   * 🔥 NEW: Watch for completed location/asset angle generation jobs and refresh data
   */
  useEffect(() => {
    const completedAngleJobs = jobs.filter(job => 
      job.status === 'completed' && 
      job.jobType === 'image-generation' &&
      job.results?.angleReferences &&
      Array.isArray(job.results.angleReferences) &&
      job.results.angleReferences.length > 0
    );
    
    if (completedAngleJobs.length > 0) {
      console.log('[ProductionJobsPanel] Angle generation completed, refreshing locations and assets...', completedAngleJobs.length);
      // Trigger location/asset refresh via window events
      window.dispatchEvent(new CustomEvent('refreshLocations'));
      window.dispatchEvent(new CustomEvent('refreshAssets'));
      
      // Also invalidate React Query cache for media files
      queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
    }
  }, [jobs, projectId, queryClient]);
  
  /**
   * 🔥 NEW: Check for safety errors in completed jobs and show dialog
   */
  useEffect(() => {
    // Check for jobs with safety errors that haven't been shown yet
    const jobsWithSafetyErrors = jobs.filter(job => {
      if (job.status !== 'completed' || !job.results) return false;
      
      // Check for failed poses with safety errors (character poses)
      if (job.jobType === 'pose-generation' && job.results.failedPoses) {
        const safetyErrors = job.results.failedPoses.filter(fp => fp.errorCode === 'SAFETY_ERROR_USER_CHOICE');
        return safetyErrors.length > 0;
      }
      
      // Check for failed angles with safety errors (location/asset angles)
      if (job.jobType === 'image-generation' && job.results.failedAngles) {
        const safetyErrors = job.results.failedAngles.filter(fa => fa.errorCode === 'SAFETY_ERROR_USER_CHOICE');
        return safetyErrors.length > 0;
      }
      
      return false;
    });
    
    // Show dialog for first job with safety errors (if not already shown)
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
  }, [jobs, showSafetyDialog]);

  /**
   * Retry failed job
   */
  const handleRetry = async (jobId: string) => {
    toast.info('Retry functionality coming soon!');
  };

  /**
   * Delete job
   */
  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this job? This cannot be undone.')) return;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/workflows/delete/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setJobs(jobs.filter(j => j.jobId !== jobId));
        toast.success('Job deleted');
      } else {
        toast.error('Failed to delete job');
      }
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: WorkflowJob['status']) => {
    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Clock className="w-3 h-3" />
            Queued
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0A] overflow-auto">
      {/* Header with filter */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-slate-200">
            Workflow Jobs
          </h3>
          {isPolling && (
            <Loader2 className="w-4 h-4 animate-spin text-[#DC143C]" />
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-1.5 rounded-lg border border-slate-700
                     bg-slate-800 text-slate-200 text-sm
                     focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
          >
            <option value="all">All Jobs</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 relative z-10">
            <div className="flex flex-col items-center justify-center">
              <Sparkles className="w-12 h-12 mb-3 opacity-50" style={{ maxWidth: '48px', maxHeight: '48px' }} />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">
                {statusFilter === 'all' 
                  ? 'Generate a workflow to see it here'
                  : `No ${statusFilter} jobs`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.jobId}
                className="p-4 rounded-lg border border-slate-700/50
                         bg-slate-800/50 hover:bg-slate-800 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-200">
                      {job.workflowName}
                    </h4>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatTime(job.createdAt)} · {job.creditsUsed} credits
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(job.jobId)}
                      className="p-2 rounded-lg hover:bg-slate-700
                               text-slate-400 hover:text-white transition-colors"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job.jobId)}
                    className="p-2 rounded-lg hover:bg-red-900/30
                             text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar (for running jobs) */}
              {(job.status === 'running' || job.status === 'queued') && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-semibold text-[#DC143C]">{Math.round(job.progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#DC143C] transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {job.status === 'failed' && job.error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{job.error}</p>
                  </div>
                </div>
              )}

              {/* Results (for completed jobs) */}
              {job.status === 'completed' && job.results && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {job.jobType === 'pose-generation' && job.results.poses && (
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {job.results.poses.length} pose(s)
                      </span>
                    )}
                    {job.jobType === 'image-generation' && (
                      <>
                        {job.results.angleReferences && job.results.angleReferences.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {job.results.angleReferences.length} angle(s)
                          </span>
                        )}
                        {job.results.images && job.results.images.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {job.results.images.length} image(s)
                          </span>
                        )}
                      </>
                    )}
                    {job.jobType === 'audio-generation' && job.results.audio && (
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {job.results.audio.length} audio file(s)
                      </span>
                    )}
                    {job.jobType === 'complete-scene' && job.results.videos && (
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {job.results.videos.length} video(s)
                      </span>
                    )}
                    {job.jobType === 'workflow-execution' && job.results && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Workflow completed
                      </span>
                    )}
                    {job.jobType === 'playground-experiment' && job.results && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Experiment completed
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(job.results.executionTime / 60)}m {Math.round(job.results.executionTime % 60)}s
                    </span>
                  </div>

                  {/* 🔥 FIX: Display images for ALL job types with smaller thumbnails (half size) */}
                  {/* Pose Image Thumbnails - Character Poses */}
                  {job.jobType === 'pose-generation' && job.results.poses && job.results.poses.length > 0 && (
                    <div className="grid grid-cols-6 gap-1.5 mt-3">
                      {job.results.poses.map((pose, index) => (
                        <div
                          key={pose.poseId || index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/50"
                        >
                          {pose.s3Key ? (
                            // 🔥 FIX: Always use s3Key-based component to ensure fresh presigned URLs
                            <ImageThumbnailFromS3Key 
                              s3Key={pose.s3Key} 
                              alt={pose.poseName || `Pose ${index + 1}`}
                              fallbackUrl={pose.imageUrl} // Try imageUrl first if available
                            />
                          ) : pose.imageUrl ? (
                            <img
                              src={pose.imageUrl}
                              alt={pose.poseName || `Pose ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[10px]">
                              No image
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                            <p className="text-[10px] text-white truncate">{pose.poseName || `Pose ${index + 1}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image Generation Thumbnails - Generic Images */}
                  {job.jobType === 'image-generation' && job.results.images && job.results.images.length > 0 && (
                    <div className="grid grid-cols-6 gap-1.5 mt-3">
                      {job.results.images.map((img, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/50"
                        >
                          {img.s3Key ? (
                            // 🔥 FIX: Always use s3Key-based component to ensure fresh presigned URLs
                            <ImageThumbnailFromS3Key 
                              s3Key={img.s3Key} 
                              alt={img.label || `Image ${index + 1}`}
                              fallbackUrl={img.imageUrl} // Try imageUrl first if available
                            />
                          ) : img.imageUrl ? (
                            <img
                              src={img.imageUrl}
                              alt={img.label || `Image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[10px]">
                              No image
                            </div>
                          )}
                          {img.label && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                              <p className="text-[10px] text-white truncate">{img.label}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🔥 FIX: Display angleReferences for location/asset angle generation jobs - ALWAYS show when present */}
                  {job.jobType === 'image-generation' && job.results.angleReferences && job.results.angleReferences.length > 0 && (
                    <div className="grid grid-cols-6 gap-1.5 mt-3">
                      {job.results.angleReferences.map((angleRef, index) => (
                        <div
                          key={angleRef.s3Key || index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/50"
                        >
                          {angleRef.s3Key ? (
                            // 🔥 FIX: Always use s3Key-based component to ensure fresh presigned URLs
                            // This handles expired imageUrl presigned URLs
                            <ImageThumbnailFromS3Key 
                              s3Key={angleRef.s3Key} 
                              alt={`${angleRef.angle} view`}
                              fallbackUrl={angleRef.imageUrl} // Try imageUrl first if available
                            />
                          ) : angleRef.imageUrl ? (
                            <img
                              src={angleRef.imageUrl}
                              alt={`${angleRef.angle} view`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[10px]">
                              No image
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                            <p className="text-[10px] text-white truncate capitalize">{angleRef.angle || `Angle ${index + 1}`}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons based on job type */}
                  <div className="flex flex-wrap gap-2">
                    {/* 🔥 REMOVED: Save buttons - all generation jobs auto-save to their respective entities
                        - Poses auto-save to character.poseReferences
                        - Location angles auto-save to location.locationBankProfile.angleVariations
                        - Asset angles auto-save to asset.angleReferences
                    */}
                    
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                 bg-[#8B5CF6] text-white text-xs font-medium
                                 hover:bg-[#7C4DCC] transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save Audio
                      </button>
                    )}
                    
                    {/* Video workflow: Download buttons */}
                    {job.jobType === 'complete-scene' && job.results.videos && (
                      <>
                        {job.results.videos.map((video, index) => (
                          <a
                            key={index}
                            href={video.url}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                     bg-[#DC143C] text-white text-xs font-medium
                                     hover:bg-[#B91238] transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            Video {index + 1}
                          </a>
                        ))}
                      </>
                    )}
                    
                    {/* Workflow execution: Display workflow results */}
                    {job.jobType === 'workflow-execution' && job.results && (
                      <div className="space-y-2">
                        {job.results.videos && job.results.videos.length > 0 && (
                          <>
                            {job.results.videos.map((video, index) => (
                              <a
                                key={index}
                                href={video.url}
                                download
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                         bg-[#DC143C] text-white text-xs font-medium
                                         hover:bg-[#B91238] transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                {video.description || `Video ${index + 1}`}
                              </a>
                            ))}
                          </>
                        )}
                        {job.metadata?.workflowName && (
                          <div className="text-xs text-slate-400 mt-2">
                            Workflow: {job.metadata.workflowName}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Playground experiment: Display experiment results */}
                    {job.jobType === 'playground-experiment' && job.results && (
                      <div className="space-y-2">
                        {job.metadata?.experimentType && (
                          <div className="text-xs text-slate-400">
                            Experiment: {job.metadata.experimentType}
                          </div>
                        )}
                        {job.results.videos && job.results.videos.length > 0 && (
                          <div className="text-xs text-slate-400">
                            Generated {job.results.videos.length} video(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
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
                // TODO: Implement regenerate with standard quality
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
                // TODO: Implement retry 4K
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
    </div>
  );
}

