'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

interface SceneBuilderProgressProps {
  executionId: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'awaiting_user_decision' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  stepResults?: Array<{
    stepNumber: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    creditsUsed: number;
  }>;
  totalCreditsUsed: number;
  error?: string;
}

/**
 * Scene Builder Progress Tracker
 * 
 * Shows real-time progress as workflow executes:
 * - Current step
 * - Completed steps
 * - Credits used
 * - Errors
 */
export function SceneBuilderProgress({
  executionId,
  status,
  currentStep,
  totalSteps,
  stepResults = [],
  totalCreditsUsed,
  error
}: SceneBuilderProgressProps) {
  if (!executionId || status === 'idle') return null;

  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  const statusConfig = {
    running: {
      icon: Loader2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-900',
      label: 'Generating...'
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-900',
      label: 'Completed!'
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-900',
      label: 'Failed'
    },
    awaiting_user_decision: {
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-900',
      label: 'Awaiting Decision'
    },
    cancelled: {
      icon: Circle,
      color: 'text-base-content/40 dark:text-base-content/60',
      bgColor: 'bg-base-100 dark:bg-base-200/20',
      borderColor: 'border-base-content/20 dark:border-base-content/20',
      label: 'Cancelled'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.running;
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <StatusIcon className={`w-5 h-5 ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
        <div className="flex-1">
          <div className="font-semibold text-sm">{config.label}</div>
          <div className="text-xs text-muted-foreground">
            Step {currentStep} of {totalSteps} • {totalCreditsUsed} credits used
          </div>
        </div>
        <div className={`text-lg font-bold ${config.color}`}>{progress}%</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-base-200 dark:bg-base-content/20 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            status === 'completed' ? 'bg-green-500' :
            status === 'failed' ? 'bg-red-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step List */}
      {stepResults.length > 0 && (
        <div className="space-y-2">
          {stepResults.map((step) => (
            <div key={step.stepNumber} className="flex items-center gap-2 text-xs">
              {step.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {step.status === 'running' && (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
              )}
              {step.status === 'failed' && (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              {step.status === 'pending' && (
                <Circle className="w-4 h-4 text-base-content/60 flex-shrink-0" />
              )}
              <span className="flex-1">Step {step.stepNumber}</span>
              <span className="text-muted-foreground">{step.creditsUsed} cr</span>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 rounded bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Execution ID (for debugging) */}
      <div className="mt-3 text-[10px] text-muted-foreground font-mono">
        ID: {executionId}
      </div>
    </div>
  );
}

