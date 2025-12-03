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

interface WorkflowJob {
  jobId: string;
  workflowId: string;
  workflowName: string;
  jobType?: 'complete-scene' | 'pose-generation' | 'image-generation' | 'audio-generation';
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

export function ProductionJobsPanel({ projectId }: ProductionJobsPanelProps) {
  const { getToken, userId } = useAuth();
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isPolling, setIsPolling] = useState(false);
  
  // Storage modal state
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    url: string;
    s3Key: string;
    name: string;
    type: 'image' | 'video' | 'audio';
    metadata?: any;
  } | null>(null);

  /**
   * Load jobs from API
   */
  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required');
        setIsLoading(false);
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
        jobCount: data.jobs?.length || 0, 
        jobs: data.jobs,
        projectId,
        userId 
      });

      if (data.success) {
        const jobList = data.jobs || [];
        setJobs(jobList);
        if (jobList.length === 0) {
          console.log('[JobsPanel] No jobs found - this might be expected if no jobs have been created yet');
          console.log('[JobsPanel] Checking filters:', { projectId, statusFilter });
        } else {
          console.log('[JobsPanel] ✅ Loaded jobs:', jobList.map(j => ({ id: j.jobId, type: j.jobType, status: j.status })));
        }
      } else {
        console.error('[JobsPanel] API error:', data.error);
        toast.error('Failed to load jobs', { description: data.error });
      }
    } catch (error: any) {
      console.error('[JobsPanel] Load error:', error);
      toast.error('Failed to load jobs', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial load and filter changes
   */
  useEffect(() => {
    loadJobs();
  }, [statusFilter, projectId]);

  /**
   * Refresh jobs when panel becomes visible (e.g., user navigates to jobs tab)
   * Also refresh periodically to catch newly completed jobs
   */
  useEffect(() => {
    // Refresh on mount and when projectId changes
    loadJobs();
    
    // Set up periodic refresh (every 10 seconds) to catch newly completed jobs
    const refreshInterval = setInterval(() => {
      loadJobs();
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [projectId, statusFilter]);

  /**
   * Poll running jobs every 5 seconds
   */
  useEffect(() => {
    const hasRunningJobs = jobs.some(job => job.status === 'running' || job.status === 'queued');
    
    if (!hasRunningJobs) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, [jobs]);

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
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-auto">
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
                    {job.jobType === 'image-generation' && job.results.images && (
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {job.results.images.length} image(s)
                      </span>
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
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(job.results.executionTime / 60)}m {Math.round(job.results.executionTime % 60)}s
                    </span>
                  </div>

                  {/* Action buttons based on job type */}
                  <div className="flex flex-wrap gap-2">
                    {/* Pose generation: Save button */}
                    {job.jobType === 'pose-generation' && job.results.poses && job.results.poses.length > 0 && (
                      <button
                        onClick={() => {
                          const firstPose = job.results!.poses![0];
                          setSelectedAsset({
                            url: firstPose.imageUrl,
                            s3Key: firstPose.s3Key,
                            name: `${job.metadata?.inputs?.characterName || 'Character'} - ${firstPose.poseName}`,
                            type: 'image',
                            metadata: {
                              entityType: 'character',
                              entityId: job.metadata?.inputs?.characterId,
                              entityName: job.metadata?.inputs?.characterName,
                              poseGeneration: true,
                              allPoses: job.results!.poses // Pass all poses for batch save
                            }
                          });
                          setShowStorageModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                 bg-[#DC143C] text-white text-xs font-medium
                                 hover:bg-[#B91238] transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save Poses
                      </button>
                    )}
                    
                    {/* Image generation: Save button */}
                    {job.jobType === 'image-generation' && job.results.images && job.results.images.length > 0 && (
                      <button
                        onClick={() => {
                          const firstImage = job.results!.images![0];
                          setSelectedAsset({
                            url: firstImage.imageUrl,
                            s3Key: firstImage.s3Key,
                            name: firstImage.label || 'Generated Image',
                            type: 'image',
                            metadata: {
                              entityType: job.metadata?.inputs?.entityType || 'asset',
                              entityId: job.metadata?.inputs?.entityId,
                              entityName: job.metadata?.inputs?.entityName || 'Asset',
                              allImages: job.results!.images
                            }
                          });
                          setShowStorageModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                 bg-[#DC143C] text-white text-xs font-medium
                                 hover:bg-[#B91238] transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save Images
                      </button>
                    )}
                    
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
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
      
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

