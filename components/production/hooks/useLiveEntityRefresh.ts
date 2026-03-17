'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseLiveEntityRefreshOptions {
  isOpen: boolean;
  screenplayId?: string;
  entityQueryKey: readonly unknown[];
  intervalMs?: number;
}

/**
 * Shared modal polling helper to keep entity + media views fresh while generation jobs run.
 * Additive utility: preserves current behavior and avoids per-modal drift.
 */
export function useLiveEntityRefresh({
  isOpen,
  screenplayId,
  entityQueryKey,
  intervalMs = 4000,
}: UseLiveEntityRefreshOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen || !screenplayId) return;

    const interval = setInterval(() => {
      queryClient.refetchQueries({ queryKey: entityQueryKey, type: 'active' });
      queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId], exact: false });
      queryClient.refetchQueries({ queryKey: ['media', 'presigned-urls'], exact: false });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isOpen, screenplayId, intervalMs, queryClient, entityQueryKey]);
}

