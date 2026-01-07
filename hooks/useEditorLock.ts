/**
 * useEditorLock Hook
 * Feature 0187: Editor Lock for Multi-Device Conflict Prevention
 * 
 * Custom hook for managing editor locks to prevent conflicts when the same user
 * account is logged in on multiple devices simultaneously.
 * 
 * Lock is per (screenplayId, userId) combination - each screenplay has its own independent lock.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, useUser } from '@clerk/nextjs';
import {
  getEditorLock,
  acquireEditorLock,
  releaseEditorLock,
  updateLockHeartbeat,
  EditorLockStatus
} from '../utils/editorLockStorage';

interface UseEditorLockReturn {
  isLocked: boolean; // True if locked by same user on different device
  isCollaboratorEditing: boolean; // True if different user has lock
  lockedBy: string | null; // Display name of user who has lock
  acquireLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
  sendHeartbeat: () => Promise<void>;
}

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Hook for managing editor locks
 * 
 * @param screenplayId - The screenplay ID (null if no screenplay is open)
 * @returns Lock state and management functions
 */
export function useEditorLock(screenplayId: string | null): UseEditorLockReturn {
  const { session } = useSession();
  const { user } = useUser();
  
  const [lockStatus, setLockStatus] = useState<EditorLockStatus | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousScreenplayIdRef = useRef<string | null>(null);
  const isFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK === 'true';

  // Check if feature is enabled
  if (!isFeatureEnabled) {
    // Return default values if feature is disabled
    return {
      isLocked: false,
      isCollaboratorEditing: false,
      lockedBy: null,
      acquireLock: async () => {},
      releaseLock: async () => {},
      sendHeartbeat: async () => {},
    };
  }

  // Check lock status when screenplayId changes
  useEffect(() => {
    // Early return if feature is disabled (double-check)
    if (!isFeatureEnabled) {
      setLockStatus(null);
      return;
    }
    
    if (!screenplayId || !user?.id || !session?.id) {
      // No screenplay open or user not authenticated
      setLockStatus(null);
      return;
    }
    
    // Don't make API calls if feature is disabled (defensive check)
    if (process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK !== 'true') {
      setLockStatus(null);
      return;
    }

    // If screenplay changed, release lock for previous screenplay
    if (previousScreenplayIdRef.current && previousScreenplayIdRef.current !== screenplayId) {
      releaseEditorLock(previousScreenplayIdRef.current).catch(err => {
        console.warn('[useEditorLock] Failed to release lock for previous screenplay:', err);
      });
    }

    previousScreenplayIdRef.current = screenplayId;

    // Check lock status
    const checkLock = async () => {
      try {
        const status = await getEditorLock(screenplayId);
        setLockStatus(status);
      } catch (error) {
        console.error('[useEditorLock] Failed to check lock status:', error);
        // Graceful degradation: allow editing if lock check fails
        setLockStatus(null);
      }
    };

    checkLock();
  }, [screenplayId, user?.id, session?.id]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    // Early return if feature is disabled
    if (!isFeatureEnabled) {
      return;
    }
    
    if (!screenplayId || !user?.id || !session?.id) {
      return;
    }

    try {
      await acquireEditorLock(screenplayId);
      // Refresh lock status after acquiring
      const status = await getEditorLock(screenplayId);
      setLockStatus(status);
    } catch (error: any) {
      console.error('[useEditorLock] Failed to acquire lock:', error);
      // If it's a conflict error, update status to show locked
      if (error.message.includes('locked by another session')) {
        const status = await getEditorLock(screenplayId);
        setLockStatus(status);
      }
      throw error;
    }
  }, [screenplayId, user?.id, session?.id]);

  // Release lock
  const releaseLock = useCallback(async () => {
    // Early return if feature is disabled
    if (!isFeatureEnabled) {
      return;
    }
    
    if (!screenplayId) {
      return;
    }

    try {
      await releaseEditorLock(screenplayId);
      setLockStatus(null);
    } catch (error) {
      console.error('[useEditorLock] Failed to release lock:', error);
    }
  }, [screenplayId]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async () => {
    // Early return if feature is disabled
    if (!isFeatureEnabled) {
      return;
    }
    
    if (!screenplayId) {
      return;
    }

    try {
      await updateLockHeartbeat(screenplayId);
    } catch (error) {
      // Don't log heartbeat failures - they're not critical
      console.debug('[useEditorLock] Heartbeat failed (non-critical):', error);
    }
  }, [screenplayId]);

  // Set up heartbeat interval when lock is acquired
  useEffect(() => {
    if (!screenplayId || !lockStatus || lockStatus.isLocked) {
      // Clear heartbeat if no screenplay, no lock, or locked by another device
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Start heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [screenplayId, lockStatus, sendHeartbeat]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (screenplayId) {
        releaseEditorLock(screenplayId).catch(err => {
          console.warn('[useEditorLock] Failed to release lock on unmount:', err);
        });
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [screenplayId]);

  return {
    isLocked: lockStatus?.isLocked ?? false,
    isCollaboratorEditing: lockStatus?.isCollaboratorEditing ?? false,
    lockedBy: lockStatus?.lockedBy ?? null,
    acquireLock,
    releaseLock,
    sendHeartbeat,
  };
}
