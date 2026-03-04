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
  /** Canonical screenplay id from page context (preferred refresh key). */
  screenplayId?: string;
}

export function WorkflowCompletionPoller({ jobIdsKey, screenplayId }: WorkflowCompletionPollerProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const removeJob = useInFlightWorkflowJobsStore((s) => s.removeJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobIdsKey) return;

    let cancelled = false;

    const pollJob = async (
      jobId: string
    ): Promise<{ status: string; projectIds: string[]; jobType?: string; error?: string } | null> => {
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

        const resolvedJobType = exec.jobType || exec.metadata?.jobType || exec.workflowId;

        const projectIds = Array.from(new Set([
          exec.projectId,
          exec.metadata?.screenplayId,
          exec.inputs?.screenplayId,
          exec.inputs?.projectId,
        ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)));

        return {
          status: exec.status || 'running',
          projectIds,
          jobType: resolvedJobType,
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

        const { status, projectIds, error } = result;
        const terminalStatuses = ['completed', 'failed', 'partial_delivery'];
        if (terminalStatuses.includes(status)) {
          removeJob(jobId);
          const refreshIds = Array.from(new Set([
            screenplayId,
            ...projectIds,
          ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)));
          // Refresh media for ALL terminal states: first frames may be saved even when videos fail
          // (e.g. dialogue shot fails with safety error, but first frames were persisted)
          if (refreshIds.length > 0) {
            for (const projectId of refreshIds) {
              queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
              queryClient.invalidateQueries({ queryKey: ['scenes', projectId] });
              queryClient.invalidateQueries({ queryKey: ['characters', projectId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['locations', projectId, 'production-hub'] });
              queryClient.invalidateQueries({ queryKey: ['assets', projectId, 'production-hub'] });
              queryClient.refetchQueries({ queryKey: ['media', 'files', projectId] });
              queryClient.refetchQueries({ queryKey: ['characters', projectId, 'production-hub'] });
              queryClient.refetchQueries({ queryKey: ['locations', projectId, 'production-hub'] });
              queryClient.refetchQueries({ queryKey: ['assets', projectId, 'production-hub'] });
            }
            // Delayed retry: Media Library registration is async (1-5s). Retry so Shot Board/Videos tab updates.
            const refreshWithRetry = (attempt: number = 1, maxAttempts: number = 3) => {
              const delay = 2000; // 2s between attempts → refreshes at 2s, 4s, 6s from completion
              setTimeout(async () => {
                try {
                  for (const projectId of refreshIds) {
                    await queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
                    await queryClient.refetchQueries({ queryKey: ['media', 'files', projectId] });
                    await queryClient.invalidateQueries({ queryKey: ['scenes', projectId] });
                  }
                } catch (e) {
                  /* non-fatal */
                }
                if (attempt < maxAttempts) {
                  refreshWithRetry(attempt + 1, maxAttempts);
                }
              }, delay);
            };
            refreshWithRetry();
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
  }, [jobIdsKey, screenplayId, getToken, queryClient, removeJob]);

  return null;
}
