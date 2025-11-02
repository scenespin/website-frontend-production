'use client';

/**
 * Production Jobs Panel
 * 
 * Displays workflow execution history with real-time polling for running jobs.
 * Allows users to view, download, retry, and manage all their workflow jobs.
 */

import React, { useState, useEffect } from 'react';
import {
  Loader2, CheckCircle, XCircle, Clock, Download, 
  RefreshCw, Trash2, Filter, ChevronDown, Play,
  Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowJob {
  jobId: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    videos: Array<{
      url: string;
      description: string;
      creditsUsed: number;
    }>;
    totalCreditsUsed: number;
    executionTime: number;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
  creditsUsed: number;
}

interface ProductionJobsPanelProps {
  projectId: string;
}

type StatusFilter = 'all' | 'running' | 'completed' | 'failed';

export function ProductionJobsPanel({ projectId }: ProductionJobsPanelProps) {
  const [jobs, setJobs] = useState<WorkflowJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Load jobs from API
   */
  const loadJobs = async () => {
    try {
      const response = await fetch(`/api/workflows/list?projectId=${projectId}&status=${statusFilter === 'all' ? '' : statusFilter}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        toast.error('Failed to load jobs', { description: data.error });
      }
    } catch (error) {
      console.error('[JobsPanel] Load error:', error);
      toast.error('Failed to load jobs');
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
      const response = await fetch(`/api/workflows/delete/${jobId}`, {
        method: 'DELETE'
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
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-base-content">
            Workflow Jobs
          </h3>
          {isPolling && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-sm
                     focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Jobs</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">
            {statusFilter === 'all' 
              ? 'Generate a workflow to see it here'
              : `No ${statusFilter} jobs`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-base-content">
                      {job.workflowName}
                    </h4>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatTime(job.createdAt)} · {job.creditsUsed} credits
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(job.jobId)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700
                               text-slate-600 dark:text-slate-400"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job.jobId)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
                             text-red-600 dark:text-red-400"
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
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="font-semibold text-primary">{Math.round(job.progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {job.status === 'failed' && job.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-300">{job.error}</p>
                  </div>
                </div>
              )}

              {/* Results (for completed jobs) */}
              {job.status === 'completed' && job.results && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {job.results.videos.length} video(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(job.results.executionTime / 60)}m {Math.round(job.results.executionTime % 60)}s
                    </span>
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-wrap gap-2">
                    {job.results.videos.map((video, index) => (
                      <a
                        key={index}
                        href={video.url}
                        download
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                 bg-primary text-base-content text-xs font-medium
                                 hover:bg-primary/90 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Video {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

