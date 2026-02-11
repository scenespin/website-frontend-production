'use client';

/**
 * WorkflowCompletionPoller - Polls in-flight workflow-execution jobs until completion
 * and refreshes media, regardless of Jobs drawer state.
 *
 * Runs when the drawer is closed so users get automatic Updates in the Videos tab
 * without needing to keep the Jobs panel open or manually refresh.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { useInFlightWorkflowJobsStore } from '@/lib/inFlightWorkflowJobsStore';

const POLL_INTERVAL_MS = 4000;

export function WorkflowCompletionPoller() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const jobIds = useInFlightWorkflowJobsStore((s) => s.getJobIds());
  const removeJob = useInFlightWorkflowJobsStore((s) => s.removeJob);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable dependency: only re-run when the set of job IDs actually changes
  const jobIdsKey = [...jobIds].sort().join(',');

  useEffect(() => {
    if (jobIds.length === 0) return;

    const pollJob = async (jobId: string): Promise<{ status: string; projectId?: string } | null> => {
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
        };
      } catch {
        return null;
      }
    };

    const runPoll = async () => {
      const ids = useInFlightWorkflowJobsStore.getState().getJobIds();
      if (ids.length === 0) return;

      for (const jobId of ids) {
        const result = await pollJob(jobId);
        if (!result) continue;

        const { status, projectId } = result;
        if (status === 'completed' || status === 'failed') {
          removeJob(jobId);
          if (status === 'completed' && projectId?.trim()) {
            queryClient.refetchQueries({ queryKey: ['media', 'files', projectId] });
          }
        }
      }
    };

    runPoll();
    pollTimeoutRef.current = setInterval(runPoll, POLL_INTERVAL_MS);
    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [jobIdsKey, jobIds.length, getToken, queryClient, removeJob]);

  return null;
}
