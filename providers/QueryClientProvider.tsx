/**
 * React Query Client Provider
 * 
 * Provides QueryClient to the application for React Query hooks.
 * Part of Feature 0127: Media Library Refactor to Best Practices
 */

'use client';

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  // Create QueryClient with default options
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes default (formerly cacheTime)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnMount: true,
        refetchOnReconnect: true,
        // Note: Query timeouts are handled via cleanup on unmount and reset on remount in SceneBuilderPanel
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }));

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}

