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

  // Track previous user ID to detect logout/login
  const previousUserIdRef = useRef<string | null>(null);
  const previousSessionIdRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessedKeyRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorCountRef = useRef(0); // Track consecutive errors to prevent loops
  const lastErrorTimeRef = useRef<number>(0);

  // Check lock status when screenplayId changes
  useEffect(() => {
    // Early return if feature is disabled (double-check)
    if (!isFeatureEnabled) {
      setLockStatus(null);
      return;
    }
    
    // Wait for all required values to be stable (not undefined/null)
    // On mobile, session?.id might be unstable, so we allow it to be optional
    if (!screenplayId || !user?.id) {
      // No screenplay open or user not authenticated
      setLockStatus(null);
      return;
    }
    
    // Don't make API calls if feature is disabled (defensive check)
    if (process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK !== 'true') {
      setLockStatus(null);
      return;
    }

    // Use session ID if available, otherwise use a fallback based on user ID
    // This handles cases where session?.id is unstable on mobile
    const currentUserId = user.id;
    const currentSessionId = session?.id || `fallback-${currentUserId}`;
    const processKey = `${screenplayId}:${currentUserId}:${currentSessionId}`;
    
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
    const previousSessionId = previousSessionIdRef.current;
    
    // If user or session changed (logout/login), try to release any stale locks
    if (previousUserId !== null && (previousUserId !== currentUserId || previousSessionId !== currentSessionId)) {
      // User changed or session changed - try to release stale lock for current screenplay
      if (screenplayId) {
        releaseEditorLock(screenplayId).catch(err => {
          console.warn('[useEditorLock] Failed to release stale lock after user change:', err);
        });
      }
    }
    
    previousUserIdRef.current = currentUserId;
    previousSessionIdRef.current = currentSessionId;

    // If screenplay changed, release lock for previous screenplay
    if (previousScreenplayIdRef.current && previousScreenplayIdRef.current !== screenplayId) {
      releaseEditorLock(previousScreenplayIdRef.current).catch(err => {
        console.warn('[useEditorLock] Failed to release lock for previous screenplay:', err);
      });
    }

    previousScreenplayIdRef.current = screenplayId;

    // Check lock status with a debounce to handle rapid changes (especially on mobile)
    const checkLock = async () => {
      try {
        const status = await getEditorLock(screenplayId);
        setLockStatus(status);
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
  }, [screenplayId, user?.id, session?.id]);

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

    try {
      await acquireEditorLock(screenplayId);
      // Refresh lock status after acquiring
      const status = await getEditorLock(screenplayId);
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
      if (error.message.includes('locked by another session')) {
        const status = await getEditorLock(screenplayId);
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
