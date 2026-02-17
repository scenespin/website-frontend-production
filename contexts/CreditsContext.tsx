'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';

type CreditsContextValue = {
  credits: number | null;
  loading: boolean;
  refreshCredits: (forceRefresh?: boolean) => Promise<void>;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCredits = useCallback(async (forceRefresh: boolean = true) => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.user.getCredits(forceRefresh);
      const balance = response?.data?.data?.balance;
      setCredits(typeof balance === 'number' ? balance : 0);
    } catch (error) {
      console.error('[CreditsContext] Failed to fetch credits:', error);
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load and user switches should always bypass cache once.
  useEffect(() => {
    refreshCredits(true);
  }, [refreshCredits]);

  // Periodic refresh fallback.
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshCredits(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refreshCredits]);

  // Refresh on tab visibility restore.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCredits(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshCredits]);

  // Backward-compatible global refresh hook for existing callers.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.refreshCredits = () => {
      refreshCredits(true);
      window.dispatchEvent(new CustomEvent('creditsRefreshed'));
    };

    return () => {
      if (window.refreshCredits) {
        delete window.refreshCredits;
      }
    };
  }, [refreshCredits]);

  const value = useMemo(
    () => ({ credits, loading, refreshCredits }),
    [credits, loading, refreshCredits]
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditsProvider');
  }
  return context;
}

