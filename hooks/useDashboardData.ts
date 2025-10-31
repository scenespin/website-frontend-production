/**
 * Dashboard Data Hooks
 * Feature 0068: Production Dashboard Backend Integration
 * 
 * Custom hooks using SWR for efficient data fetching with:
 * - Automatic caching
 * - Real-time revalidation
 * - Error handling
 * - Loading states
 */

import useSWR from 'swr';
import type {
  ProductionMetrics,
  CreditBreakdown,
  ProductionActivityWeek,
  VideoJob,
  UserProfile,
  DashboardStats,
  AIUsageBreakdown,
  ListJobsResponse,
} from '@/types/dashboard';

// ==================== CONFIGURATION ====================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Generic fetcher for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include', // Include auth cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data;
}

// ==================== HOOK 1: PRODUCTION METRICS ====================

/**
 * Hook: Production metrics (hero cards)
 * Fetches: videos generated, compositions, time saved
 * Refresh: Every 60 seconds
 */
export function useProductionMetrics() {
  const { data, error, isLoading, mutate } = useSWR<ProductionMetrics>(
    `${API_BASE}/dashboard/production-metrics`,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every 60 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000, // Prevent duplicate requests within 10s
    }
  );

  return {
    metrics: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 2: CREDIT BREAKDOWN ====================

/**
 * Hook: Credit breakdown by category
 * Fetches: credits spent on videos, images, audio, compositions
 * Refresh: Every 60 seconds
 */
export function useCreditBreakdown(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR<CreditBreakdown>(
    `${API_BASE}/dashboard/credit-breakdown?days=${days}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  return {
    breakdown: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 3: PRODUCTION ACTIVITY TIMELINE ====================

/**
 * Hook: Production activity over time
 * Fetches: weekly production data (videos, images, audio, compositions)
 * Refresh: Every 2 minutes
 */
export function useProductionActivity(weeks: number = 4) {
  const { data, error, isLoading, mutate } = useSWR<ProductionActivityWeek[]>(
    `${API_BASE}/dashboard/production-activity?weeks=${weeks}`,
    fetcher,
    {
      refreshInterval: 120000, // Refresh every 2 minutes
      revalidateOnFocus: true,
    }
  );

  return {
    activity: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 4: ACTIVE VIDEO JOBS (REAL-TIME) ====================

/**
 * Hook: Active video generation jobs (in-progress)
 * Fetches: jobs with status 'queued' or 'processing'
 * Refresh: Every 5 seconds for real-time updates
 */
export function useActiveJobs() {
  const { data, error, isLoading, mutate } = useSWR<ListJobsResponse>(
    `${API_BASE}/video/jobs?status=processing&limit=10`,
    fetcher,
    {
      refreshInterval: 5000, // REAL-TIME: Poll every 5 seconds
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    jobs: data?.jobs || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 5: RECENT COMPLETED JOBS ====================

/**
 * Hook: Recently completed video jobs
 * Fetches: last 10 completed jobs for activity feed
 * Refresh: Every 30 seconds
 */
export function useRecentCompletedJobs() {
  const { data, error, isLoading, mutate } = useSWR<ListJobsResponse>(
    `${API_BASE}/video/jobs?status=completed&limit=10`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    jobs: data?.jobs || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 6: USER PROFILE (WITH ASSETS) ====================

/**
 * Hook: User profile with character and location assets
 * Fetches: user data, character gallery, location gallery
 * Refresh: On focus (when user returns to tab)
 */
export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    `${API_BASE}/user/profile`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
    }
  );

  return {
    profile: data,
    characters: data?.character_assets || [],
    locations: data?.location_assets || [],
    credits: data?.credits_remaining || 0,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 7: DASHBOARD STATS (LEGACY) ====================

/**
 * Hook: General dashboard stats
 * Fetches: projects, pages written, scenes, etc.
 * Refresh: Every 2 minutes
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    `${API_BASE}/dashboard/stats`,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== HOOK 8: AI USAGE BREAKDOWN ====================

/**
 * Hook: AI agent usage breakdown
 * Fetches: usage percentages by agent type
 * Refresh: Every 2 minutes
 */
export function useAIUsage() {
  const { data, error, isLoading, mutate } = useSWR<AIUsageBreakdown>(
    `${API_BASE}/dashboard/ai-usage`,
    fetcher,
    {
      refreshInterval: 120000,
      revalidateOnFocus: true,
    }
  );

  return {
    usage: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// ==================== UTILITY HOOK: REFRESH ALL ====================

/**
 * Hook: Refresh all dashboard data
 * Useful for "pull-to-refresh" or manual refresh actions
 */
export function useRefreshDashboard() {
  const { refresh: refreshMetrics } = useProductionMetrics();
  const { refresh: refreshBreakdown } = useCreditBreakdown();
  const { refresh: refreshActivity } = useProductionActivity();
  const { refresh: refreshActiveJobs } = useActiveJobs();
  const { refresh: refreshCompletedJobs } = useRecentCompletedJobs();
  const { refresh: refreshProfile } = useUserProfile();

  const refreshAll = async () => {
    await Promise.all([
      refreshMetrics(),
      refreshBreakdown(),
      refreshActivity(),
      refreshActiveJobs(),
      refreshCompletedJobs(),
      refreshProfile(),
    ]);
  };

  return { refreshAll };
}

