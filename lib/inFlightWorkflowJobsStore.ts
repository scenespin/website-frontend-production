/**
 * In-flight workflow jobs store
 *
 * Tracks workflow-execution job IDs so we can poll for completion even when the
 * Jobs drawer is closed. Scene Builder registers jobs here when they start;
 * WorkflowCompletionPoller polls until done and refreshes media.
 *
 * Key: poller receives jobIdsKey as prop and does NOT subscribe to this store,
 * avoiding React render loops (see pass-as-props pattern).
 */

import { create } from 'zustand';

interface InFlightWorkflowJobsState {
  jobIds: Set<string>;
  addJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  getJobIds: () => string[];
}

export const useInFlightWorkflowJobsStore = create<InFlightWorkflowJobsState>()((set, get) => ({
  jobIds: new Set(),
  addJob: (jobId: string) => {
    if (!jobId?.trim()) return;
    set((state) => {
      const next = new Set(state.jobIds);
      next.add(jobId);
      return { jobIds: next };
    });
  },
  removeJob: (jobId: string) => {
    set((state) => {
      const next = new Set(state.jobIds);
      next.delete(jobId);
      return { jobIds: next };
    });
  },
  getJobIds: () => Array.from(get().jobIds),
}));
