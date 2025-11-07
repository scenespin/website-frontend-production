'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  Upload,
  Sparkles,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

// ===== INLINE UI COMPONENTS =====

function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg p-4 flex gap-3 ${className}`}>
      {children}
    </div>
  );
}

function AlertDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex-1 ${className}`}>{children}</div>;
}

// ===== INTERFACES =====

export interface ExportStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  output_video_url?: string;
  error_message?: string;
  processing_time_ms?: number;
  file_size_mb?: number;
  credits_deducted: number;
  created_at: number;
  completed_at?: number;
}

interface ExportProgressModalProps {
  jobId: string | null;
  onComplete: (videoUrl: string, metadata: ExportStatus) => void;
  onClose: () => void;
  autoCloseOnComplete?: boolean;
}

// ===== HELPER FUNCTIONS =====

function getProgressStage(progress: number): {
  label: string;
  icon: React.ReactNode;
  color: string;
} {
  if (progress < 10) {
    return {
      label: 'Queuing export job...',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-500'
    };
  } else if (progress < 90) {
    return {
      label: 'Rendering video...',
      icon: <Video className="w-5 h-5" />,
      color: 'text-purple-500'
    };
  } else if (progress < 95) {
    return {
      label: 'Uploading to cloud...',
      icon: <Upload className="w-5 h-5" />,
      color: 'text-green-500'
    };
  } else {
    return {
      label: 'Finalizing...',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-yellow-500'
    };
  }
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function estimateTimeRemaining(progress: number, elapsedMs: number): string {
  if (progress === 0) return 'Calculating...';
  if (progress >= 100) return '0s';
  
  const totalEstimatedMs = (elapsedMs / progress) * 100;
  const remainingMs = totalEstimatedMs - elapsedMs;
  
  return formatTime(Math.max(0, remainingMs));
}

// ===== MAIN COMPONENT =====

export function ExportProgressModal({
  jobId,
  onComplete,
  onClose,
  autoCloseOnComplete = false
}: ExportProgressModalProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  // Poll for status updates
  useEffect(() => {
    if (!jobId) return;

    let isMounted = true;

    const pollStatus = async () => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        const response = await fetch(`/api/timeline/export/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch status: ${response.statusText}`);
        }

        const data: ExportStatus = await response.json();
        
        if (isMounted) {
          setStatus(data);

          // Handle completion
          if (data.status === 'completed' && data.output_video_url) {
            if (autoCloseOnComplete) {
              setTimeout(() => {
                onComplete(data.output_video_url!, data);
              }, 2000); // Wait 2 seconds before auto-closing
            } else {
              // Don't auto-close, let user manually proceed
            }
          }

          // Handle failure
          if (data.status === 'failed') {
            // Stop polling on failure
          }
        }
      } catch (error) {
        console.error('Error polling export status:', error);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 2 seconds
    const interval = setInterval(() => {
      if (status?.status !== 'completed' && status?.status !== 'failed') {
        pollStatus();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, status?.status, onComplete, autoCloseOnComplete]);

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!jobId || !status) {
    return (
      <Dialog open={!!jobId} onOpenChange={onClose}>
        <DialogContent className="bg-slate-950 text-slate-50 border-slate-800">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const stage = getProgressStage(status.progress);
  const isComplete = status.status === 'completed';
  const isFailed = status.status === 'failed';
  const isProcessing = status.status === 'processing' || status.status === 'pending';

  return (
    <Dialog open={!!jobId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 text-slate-50 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Export Complete!
              </>
            ) : isFailed ? (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                Export Failed
              </>
            ) : (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                Exporting Video...
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isComplete ? (
              'Your video has been rendered successfully'
            ) : isFailed ? (
              'There was an error rendering your video'
            ) : (
              'Please wait while we render your timeline'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-2 ${stage.color}`}>
                  {stage.icon}
                  <span className="font-medium">{stage.label}</span>
                </div>
                <span className="text-slate-400">{status.progress}%</span>
              </div>
              
              <Progress value={status.progress} className="h-3" />
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Elapsed: {formatTime(elapsedTime)}</span>
                <span>Remaining: ~{estimateTimeRemaining(status.progress, elapsedTime)}</span>
              </div>
            </div>
          )}

          {/* Completed State */}
          {isComplete && (
            <Card className="bg-green-950/30 border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-100 mb-1">
                      Video rendered successfully!
                    </h3>
                    <p className="text-sm text-green-200/80">
                      Your video is ready to download and share
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed State */}
          {isFailed && (
            <Alert className="bg-red-950/30 border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-200">
                <p className="font-semibold mb-1">Export failed</p>
                <p className="text-sm">{status.error_message || 'An unknown error occurred'}</p>
                <p className="text-xs mt-2 text-red-300">
                  Your credits have been refunded. Please try again or contact support if the issue persists.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Job Details */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Status</p>
                  <Badge variant={
                    isComplete ? 'default' :
                    isFailed ? 'destructive' :
                    'secondary'
                  }>
                    {status.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-slate-400 mb-1">Credits Used</p>
                  <p className="font-semibold">{status.credits_deducted} credits</p>
                </div>
                
                {status.processing_time_ms && (
                  <div>
                    <p className="text-slate-400 mb-1">Render Time</p>
                    <p className="font-semibold">{formatTime(status.processing_time_ms)}</p>
                  </div>
                )}
                
                {status.file_size_mb && (
                  <div>
                    <p className="text-slate-400 mb-1">File Size</p>
                    <p className="font-semibold">{status.file_size_mb.toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Stages Indicator */}
          {isProcessing && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Queue', threshold: 0 },
                { label: 'Render', threshold: 10 },
                { label: 'Upload', threshold: 90 },
                { label: 'Finalize', threshold: 95 }
              ].map((step, index) => (
                <div
                  key={step.label}
                  className={`text-center p-2 rounded-lg border transition-all ${
                    status.progress >= step.threshold
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    status.progress >= step.threshold
                      ? 'text-[#DC143C]'
                      : 'text-slate-500'
                  }`}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-800">
          {isComplete ? (
            <>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={() => status.output_video_url && onComplete(status.output_video_url, status)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Video className="w-4 h-4 mr-2" />
                View Video
              </Button>
            </>
          ) : isFailed ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="default"
                onClick={onClose}
              >
                Try Again
              </Button>
            </>
          ) : (
            <>
              <div className="text-xs text-slate-500">
                Job ID: {jobId.substring(0, 12)}...
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Run in Background
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

