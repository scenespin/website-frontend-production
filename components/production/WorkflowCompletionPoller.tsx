'use client';

/**
 * WorkflowCompletionPoller - Polls in-flight workflow-execution jobs until completion
 * and refreshes media, regardless of Jobs drawer state.
 *
 * Pass-as-props pattern: parent subscribes to store with stable jobIdsKey string;
 * this component does NOT subscribe, avoiding React render loops (see #185).
 *
 * Mirrors Jobs panel: GET /api/workflows/:id, silent auth fail, refetchQueries on completion.
 * On failure: shows execution error in a toast so the user sees the backend message.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_PER_TICK = 20;

interface WorkflowCompletionPollerProps {
  /** Stable string from parent (e.g. sorted job IDs joined). Parent subscribes; poller does not. */
  jobIdsKey: string;
}

export function WorkflowCompletionPoller({ jobIdsKey }: WorkflowCompletionPollerProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const removeJob = useInFlightWorkflowJobsStore((s) => s.removeJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobIdsKey) return;

    let cancelled = false;

    const pollJob = async (
      jobId: string
    ): Promise<{ status: string; projectId?: string } | null> => {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) return null;

        const response = await fetch(`/api/workflows/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return null;

        const data = await response.json();
        const exec = data?.data?.execution;
        if (!exec) return null;

        return {
          status: exec.status || 'running',
          projectId: exec.projectId,
          error: exec.error,
        };
      } catch {
        return null;
      }
    };

    const runPoll = async () => {
      if (cancelled) return;

      const ids = useInFlightWorkflowJobsStore.getState().getJobIds();
      if (ids.length === 0) return;

      const toPoll = ids.slice(0, MAX_POLL_PER_TICK);

      for (const jobId of toPoll) {
        if (cancelled) break;

        const result = await pollJob(jobId);
        if (!result) continue;

        const { status, projectId, error } = result;
        if (status === 'completed' || status === 'failed') {
          removeJob(jobId);
          if (status === 'completed' && projectId?.trim()) {
            queryClient.refetchQueries({ queryKey: ['media', 'files', projectId] });
          }
          if (status === 'failed') {
            toast.error('Workflow failed', {
              description: error || 'Execution failed. Check the Jobs panel for details.',
              duration: 8000,
            });
          }
        }
      }
    };

    runPoll();
    intervalRef.current = setInterval(runPoll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobIdsKey, getToken, queryClient, removeJob]);

  return null;
}
