'use client';

/**
 * Workflow Progress Tracker
 * 
 * Shows real-time progress of workflow execution with step-by-step tracking.
 */

import React, { useEffect, useState } from 'react';
import { 
  Loader2, CheckCircle, XCircle, Clock, Zap, 
  Film, Image as ImageIcon, Wand2 
} from 'lucide-react';

interface WorkflowProgressTrackerProps {
  jobId: string;
  workflowName: string;
  onComplete: (results: WorkflowResults) => void;
  onError: (error: string) => void;
}

export interface WorkflowResults {
  videos: Array<{
    url: string;
    s3Key: string;
    description: string;
    creditsUsed: number;
  }>;
  images?: Array<{
    url: string;
    s3Key: string;
    description: string;
  }>;
  totalCreditsUsed: number;
  executionTime: number;
}

interface WorkflowStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

export function WorkflowProgressTracker({
  jobId,
  workflowName,
  onComplete,
  onError
}: WorkflowProgressTrackerProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { name: 'Analyzing inputs', status: 'running', progress: 0 },
    { name: 'Generating references', status: 'pending', progress: 0 },
    { name: 'Creating videos', status: 'pending', progress: 0 },
    { name: 'Finalizing outputs', status: 'pending', progress: 0 }
  ]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  /**
   * Poll workflow status
   */
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    let isPolling = true;

    const pollStatus = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch(`/api/workflows/status/${jobId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get workflow status');
        }

        // Update steps
        if (data.steps) {
          setSteps(data.steps);
        }

        // Update overall progress
        if (data.progress !== undefined) {
          setOverallProgress(data.progress);
        }

        // Update time remaining
        if (data.estimatedTimeRemaining) {
          setEstimatedTimeRemaining(data.estimatedTimeRemaining);
        }

        // Check if completed
        if (data.status === 'completed' && data.results) {
          isPolling = false;
          clearInterval(pollInterval);
          onComplete(data.results);
        } else if (data.status === 'failed') {
          isPolling = false;
          clearInterval(pollInterval);
          onError(data.error || 'Workflow execution failed');
        }

      } catch (error) {
        console.error('[WorkflowProgress] Poll error:', error);
        isPolling = false;
        clearInterval(pollInterval);
        onError(error instanceof Error ? error.message : 'Failed to track progress');
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(pollStatus, 2000);
    pollStatus(); // Initial poll

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [jobId, onComplete, onError]);

  /**
   * Get step icon
   */
  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (step.status === 'failed') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (step.status === 'running') {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    } else {
      return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Generating Your Content
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {workflowName}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Overall Progress
          </span>
          <span className="font-bold text-primary">
            {Math.round(overallProgress)}%
          </span>
        </div>
        
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Step-by-Step Progress */}
      <div className="flex-1 overflow-auto p-4">
        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">
          Workflow Steps
        </h4>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border transition-all ${
                step.status === 'running' 
                  ? 'border-primary bg-primary/5' 
                  : step.status === 'completed'
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : step.status === 'failed'
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-medium text-sm ${
                      step.status === 'running' ? 'text-primary' :
                      step.status === 'completed' ? 'text-green-700 dark:text-green-300' :
                      step.status === 'failed' ? 'text-red-700 dark:text-red-300' :
                      'text-slate-600 dark:text-slate-400'
                    }`}>
                      {step.name}
                    </span>
                    {step.status === 'running' && step.progress > 0 && (
                      <span className="text-xs font-bold text-primary">
                        {Math.round(step.progress)}%
                      </span>
                    )}
                  </div>
                  {step.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {step.message}
                    </p>
                  )}
                  {step.status === 'running' && step.progress > 0 && (
                    <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              You can safely close this screen. Your workflow will continue in the background, 
              and results will be saved to your project.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

