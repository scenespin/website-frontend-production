/**
 * useEditorLock Hook
 * Feature 0187: Editor Lock — per-tab within same browser.
 *
 * Lock is per (screenplayId, userId); holder is identified by tab ID so only one tab
 * can hold the lock. Other tabs in the same browser see the banner (read-only).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  getEditorLock,
  acquireEditorLock,
  releaseEditorLock,
  updateLockHeartbeat,
  EditorLockStatus
} from '../utils/editorLockStorage';
import { getOrCreateEditorTabId } from '../utils/editorTabId';

interface UseEditorLockReturn {
  isLocked: boolean; // True if locked by same user in another tab
  isCollaboratorEditing: boolean; // True if different user has lock
  lockedBy: string | null; // Display name of user who has lock
  acquireLock: () => Promise<void>;
  releaseLock: () => Promise<void>;
  sendHeartbeat: () => Promise<void>;
}

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

/** Set to true to force editor lock off (e.g. for testing). Overrides env flag. */
const FORCE_EDITOR_LOCK_OFF = true;

const DEFAULT_UNLOCKED: UseEditorLockReturn = {
  isLocked: false,
  isCollaboratorEditing: false,
  lockedBy: null,
  acquireLock: async () => {},
  releaseLock: async () => {},
  sendHeartbeat: async () => {},
};

/**
 * Hook for managing editor locks (per-tab).
 *
 * @param screenplayId - The screenplay ID (null if no screenplay is open)
 * @returns Lock state and management functions
 */
export function useEditorLock(screenplayId: string | null): UseEditorLockReturn {
  const { user } = useUser();

  const [lockStatus, setLockStatus] = useState<EditorLockStatus | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousScreenplayIdRef = useRef<string | null>(null);
  const isFeatureEnabled = !FORCE_EDITOR_LOCK_OFF && process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK === 'true';

  if (!isFeatureEnabled) {
    return DEFAULT_UNLOCKED;
  }

  const previousUserIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessedKeyRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef<number>(0);

  // Check lock status when screenplayId changes
  useEffect(() => {
    if (!isFeatureEnabled) {
      setLockStatus(null);
      return;
    }
    if (!screenplayId || !user?.id) {
      setLockStatus(null);
      return;
    }
    if (process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK !== 'true') {
      setLockStatus(null);
      return;
    }

    const currentUserId = user.id;
    const currentTabId = getOrCreateEditorTabId();
    const processKey = `${screenplayId}:${currentUserId}:${currentTabId}`;
    
    // Prevent duplicate processing - if we're already processing the same key, skip
    if (isProcessingRef.current && lastProcessedKeyRef.current === processKey) {
      console.debug('[useEditorLock] Skipping duplicate processing for key:', processKey);
      return;
    }

    // Rate limiting: if we've had too many errors recently, skip processing
    const now = Date.now();
    if (errorCountRef.current >= 3 && (now - lastErrorTimeRef.current) < 5000) {
      console.warn('[useEditorLock] Too many errors, skipping processing to prevent loop');
      return;
    }

    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    // Mark as processing
    isProcessingRef.current = true;
    lastProcessedKeyRef.current = processKey;

    const previousUserId = previousUserIdRef.current;

    // If user changed (logout/login), try to release any stale locks for this screenplay
    if (previousUserId !== null && previousUserId !== currentUserId && screenplayId) {
      releaseEditorLock(screenplayId, currentTabId).catch(err => {
        console.warn('[useEditorLock] Failed to release stale lock after user change:', err);
      });
    }
    previousUserIdRef.current = currentUserId;

    // If screenplay changed, release lock for previous screenplay
    if (previousScreenplayIdRef.current && previousScreenplayIdRef.current !== screenplayId) {
      releaseEditorLock(previousScreenplayIdRef.current, currentTabId).catch(err => {
        console.warn('[useEditorLock] Failed to release lock for previous screenplay:', err);
      });
    }

    previousScreenplayIdRef.current = screenplayId;

    // Check lock status with a debounce to handle rapid changes (especially on mobile)
    const checkLock = async () => {
      try {
        const status = await getEditorLock(screenplayId, currentTabId);
        setLockStatus(status);
        if (status?.isLocked) {
          console.debug('[useEditorLock] Lock held by another tab – banner should show');
        }
        // Reset error count on success
        errorCountRef.current = 0;
      } catch (error: any) {
        console.error('[useEditorLock] Failed to check lock status:', error);
        // Increment error count and track time
        errorCountRef.current += 1;
        lastErrorTimeRef.current = Date.now();
        
        // If it's a 400 error, it might be a session ID issue - don't retry immediately
        if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
          console.warn('[useEditorLock] 400 error detected - likely session ID issue, skipping retry');
          errorCountRef.current = 3; // Set to max to prevent immediate retry
        }
        
        // Graceful degradation: allow editing if lock check fails
        setLockStatus(null);
      } finally {
        // Mark as done processing after a delay to prevent rapid re-processing
        processingTimeoutRef.current = setTimeout(() => {
          isProcessingRef.current = false;
          processingTimeoutRef.current = null;
        }, 200); // Increased debounce time for mobile stability
      }
    };

    // Debounce the check to handle rapid session ID changes on mobile
    const debounceTimeout = setTimeout(() => {
      checkLock();
    }, 150); // 150ms debounce

    // Cleanup timeout on unmount or re-run
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [screenplayId, user?.id]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    // Early return if feature is disabled
    if (!isFeatureEnabled) {
      return;
    }
    
    if (!screenplayId || !user?.id) {
      return;
    }

    // Don't acquire if we've had too many errors recently
    if (errorCountRef.current >= 3) {
      console.warn('[useEditorLock] Too many errors, skipping lock acquisition');
      return;
    }

    const tabId = getOrCreateEditorTabId();
    try {
      await acquireEditorLock(screenplayId, tabId);
      const status = await getEditorLock(screenplayId, tabId);
      setLockStatus(status);
      // Reset error count on success
      errorCountRef.current = 0;
    } catch (error: any) {
      console.error('[useEditorLock] Failed to acquire lock:', error);
      // Increment error count
      errorCountRef.current += 1;
      lastErrorTimeRef.current = Date.now();
      
      // If it's a 400 error, it might be a session ID issue
      if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        console.warn('[useEditorLock] 400 error on lock acquisition - likely session ID issue');
        errorCountRef.current = 3; // Set to max to prevent immediate retry
      }
      
      // If it's a conflict error, update status to show locked
      if (error.message.includes('locked by another session') || error.message.includes('locked by another tab')) {
        const status = await getEditorLock(screenplayId, tabId);
        setLockStatus(status);
      }
      throw error;
    }
  }, [screenplayId, user?.id]);

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
      await releaseEditorLock(screenplayId, getOrCreateEditorTabId());
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
      await updateLockHeartbeat(screenplayId, getOrCreateEditorTabId());
    } catch (error) {
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
    const tabId = getOrCreateEditorTabId();
    return () => {
      if (screenplayId) {
        releaseEditorLock(screenplayId, tabId).catch(err => {
          console.warn('[useEditorLock] Failed to release lock on unmount:', err);
        });
      }
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
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
