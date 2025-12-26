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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Loader2, CheckCircle, XCircle, Clock, Download, 
  RefreshCw, Trash2, Filter, ChevronDown, Play,
  Sparkles, AlertCircle, Image, Save, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { useQueryClient } from '@tanstack/react-query';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { Z_INDEX } from '@/config/z-index';
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
  jobType?: 'complete-scene' | 'pose-generation' | 'image-generation' | 'audio-generation' | 'workflow-execution' | 'playground-experiment' | 'screenplay-reading';
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
        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
      }}
    />
  );
}

export function JobsDrawer({ isOpen, onClose, onOpen, onToggle, autoOpen = false, compact = false, jobCount = 0, onNavigateToEntity }: JobsDrawerProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const { isDrawerOpen: isChatDrawerOpen } = useDrawer(); // Check if chat drawer is open
  
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
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

  // Filter out deleted jobs - calculate early so it can be used in useEffects
  const visibleJobs = jobs.filter(job => !deletedJobIds.has(job.jobId));

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

      // Load all jobs for this session (no filtering)
      const url = `/api/workflows/executions?screenplayId=${screenplayId}&limit=50`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const jobList = data.data?.jobs || data.jobs || [];
        
        setJobs(prevJobs => {
          const jobMap = new Map(prevJobs.map(j => [j.jobId, j]));
          jobList.forEach((newJob: WorkflowJob) => {
            jobMap.set(newJob.jobId, newJob);
          });
          const mergedJobs = Array.from(jobMap.values());
          mergedJobs.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
          return mergedJobs;
        });
        
        if (!hasLoadedOnce) {
          setHasLoadedOnce(true);
        }
      } else {
        console.error('[JobsDrawer] API error:', data.error);
        if (showLoading) {
          toast.error('Failed to load jobs', { description: data.error });
        }
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
   * Load jobs when drawer opens
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const shouldShowLoading = jobs.length === 0 && !hasLoadedOnce;
    loadJobs(shouldShowLoading);
  }, [screenplayId, isOpen, hasLoadedOnce]);

  /**
   * Adaptive polling: poll frequently when jobs are running, less when idle
   */
  useEffect(() => {
    if (!isOpen) {
      setIsPolling(false);
      return;
    }
    
    const hasRunningJobs = visibleJobs.some(job => 
      job.status === 'running' || job.status === 'queued'
    );
    
    setIsPolling(hasRunningJobs);
    const pollInterval = hasRunningJobs ? 5000 : 15000;
    
    const interval = setInterval(() => {
      loadJobs(false);
    }, pollInterval);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isOpen, visibleJobs.length]);

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

    if (completedLocationAngleJobs.length > 0) {
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

  /**
   * Retry failed job
   */
  const handleRetry = async (jobId: string) => {
    toast.info('Retry functionality coming soon!');
  };

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

  return (
    <>
      {/* Floating Open Button (Desktop - when closed) - Matches AgentDrawer style exactly */}
      {!isOpen && (jobCount > 0 || visibleJobs.length > 0) && (
        <button
          onClick={() => onOpen()}
          className="fixed top-1/2 right-0 -translate-y-1/2 bg-blue-600 hover:opacity-90 text-white text-sm font-medium rounded-l-lg rounded-r-none shadow-lg hidden md:flex z-30 border-none px-4 py-3 transition-all duration-300 relative"
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed',
            animation: 'pulse-subtle 3s ease-in-out infinite'
          }}
          title={`${jobCount || visibleJobs.length} job${(jobCount || visibleJobs.length) !== 1 ? 's' : ''} running`}
        >
          JOBS
          {(jobCount > 0 || visibleJobs.length > 0) && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-600 min-w-[18px] text-center">
              {(jobCount || visibleJobs.length) > 99 ? '99+' : (jobCount || visibleJobs.length)}
            </span>
          )}
        </button>
      )}

      {/* Backdrop - Only render when open (matches AgentDrawer) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 transition-opacity hidden md:block"
          style={{ zIndex: Z_INDEX.JOBS_DRAWER - 1 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
        />
      )}

      {/* Drawer - Always render for smooth slide animation (matches AgentDrawer) */}
      <div
        className={`fixed top-0 right-0 h-full bg-[#0A0A0A] border-l border-[#3F3F46] shadow-xl transition-all duration-300 ease-out hidden md:block ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: compact ? '100vw' : '400px',
          maxWidth: '90vw',
          zIndex: Z_INDEX.JOBS_DRAWER,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header - Matches AgentDrawer style */}
        <div className="h-14 flex items-center justify-between px-4 bg-[#1F1F1F] border-b border-[#3F3F46]">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
                          {job.workflowName}
                        </h4>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-[10px] text-[#808080]">
                        {formatTime(job.createdAt)} · {job.creditsUsed} credits
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {job.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(job.jobId)}
                          className="p-1 rounded hover:bg-[#1F1F1F] text-[#808080] hover:text-[#E5E7EB] transition-colors"
                          title="Retry"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
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
                          className="h-full bg-[#DC143C] transition-all duration-500"
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
                      </div>

                      {/* Compact thumbnails - 4 columns for drawer */}
                      {job.jobType === 'pose-generation' && job.results.poses && job.results.poses.length > 0 && (
                        <div className="grid grid-cols-4 gap-1">
                          {job.results.poses.slice(0, 4).map((pose, index) => (
                            <div
                              key={pose.poseId || index}
                              className="relative aspect-square rounded overflow-hidden border border-[#3F3F46] bg-[#1F1F1F]"
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
                          ))}
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
                            // Determine entity type and ID from job metadata
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
                                    onClose(); // Close drawer when navigating
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

                      {/* Generic Images */}
                      {job.jobType === 'image-generation' && job.results.images && job.results.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-1">
                          {job.results.images.slice(0, 4).map((img, index) => {
                            // Check if this is for a character, location, or asset
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
                                    onClose(); // Close drawer when navigating
                                  }
                                }}
                                title={canNavigate ? `View ${entityName || entityType}` : undefined}
                              >
                                {img.s3Key ? (
                                  <ImageThumbnailFromS3Key 
                                    s3Key={img.s3Key} 
                                    alt={img.name || `Image ${index + 1}`}
                                    fallbackUrl={img.imageUrl}
                                  />
                                ) : img.imageUrl ? (
                                  <img
                                    src={img.imageUrl}
                                    alt={img.name || `Image ${index + 1}`}
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
                          ))}
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

                        {job.jobType === 'screenplay-reading' && job.results.screenplayReading && (() => {
                          const reading = job.results!.screenplayReading!;
                          return (
                            <>
                              <button
                                onClick={async () => {
                                  const filename = 'Screenplay Reading.mp3';
                                  await downloadAudioAsBlob(reading.audioUrl, filename, reading.s3Key);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
                              >
                                <Download className="w-2.5 h-2.5" />
                                Download
                              </button>
                              {reading.subtitleS3Key && (
                                <button
                                  onClick={async () => {
                                    // Download subtitle logic
                                    toast.info('Subtitle download coming soon');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#DC143C] text-white hover:bg-[#B91C1C] transition-colors"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  Subtitles
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedAsset({
                                    url: reading.audioUrl,
                                    s3Key: reading.s3Key,
                                    name: 'Screenplay Reading - Complete',
                                    type: 'audio',
                                    metadata: {
                                      screenplayId: job.metadata?.inputs?.screenplayId,
                                      scenesProcessed: reading.scenesProcessed,
                                      sceneAudios: reading.sceneAudios
                                    }
                                  });
                                  setShowStorageModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#8B5CF6] text-white hover:bg-[#7C4DCC] transition-colors"
                              >
                                <Save className="w-2.5 h-2.5" />
                                Save
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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

