/**
 * Editor Lock Storage API Client
 * Feature 0187: Editor Lock for Multi-Device Conflict Prevention
 * 
 * Client-side functions for editor lock management
 */

import { fetchWithSessionId } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface EditorLock {
  screenplayId: string;
  userId: string;
  sessionId: string;
  lockedAt: number;
  lastActivity: number;
}

export interface EditorLockStatus {
  lock: EditorLock | null;
  isLocked: boolean; // True if locked by same user on different device
  isCollaboratorEditing: boolean; // True if different user has lock
  lockedBy: string | null; // Display name of user who has lock
}

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

/**
 * Check if feature is enabled
 */
function isFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK === 'true';
}

/**
 * Get editor lock status for a screenplay
 * 
 * @param screenplayId - The screenplay ID
 * @returns Lock status information
 */
export async function getEditorLock(screenplayId: string): Promise<EditorLockStatus | null> {
  if (!isFeatureEnabled()) {
    return null; // Feature disabled, return null (no lock)
  }
  
  // Defensive check - don't make API calls if feature is disabled
  if (process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK !== 'true') {
    return null;
  }

  try {
    const response = await fetchWithSessionId(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Feature not enabled on backend
        return null;
      }
      throw new Error(`Failed to get editor lock: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[EditorLockStorage] Failed to get editor lock:', error);
    // Graceful degradation: allow editing if lock check fails
    return null;
  }
}

/**
 * Acquire an editor lock for a screenplay
 * 
 * @param screenplayId - The screenplay ID
 * @returns Lock information
 * @throws Error if lock exists for same user on different device (409 Conflict)
 */
export async function acquireEditorLock(screenplayId: string): Promise<EditorLock> {
  if (!isFeatureEnabled()) {
    throw new Error('Editor lock feature is not enabled');
  }

  try {
    const response = await fetchWithSessionId(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 409) {
        const error = await response.json();
        throw new Error(error.error || 'Editor is locked by another session');
      }
      if (response.status === 404) {
        throw new Error('Editor lock feature is not enabled');
      }
      throw new Error(`Failed to acquire editor lock: ${response.statusText}`);
    }

    const data = await response.json();
    return data.lock;
  } catch (error: any) {
    console.error('[EditorLockStorage] Failed to acquire editor lock:', error);
    throw error;
  }
}

/**
 * Release an editor lock
 * 
 * @param screenplayId - The screenplay ID
 */
export async function releaseEditorLock(screenplayId: string): Promise<void> {
  if (!isFeatureEnabled()) {
    return; // Feature disabled, nothing to release
  }

  try {
    const response = await fetchWithSessionId(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Feature not enabled on backend, ignore
        return;
      }
      // Don't throw on release failure - it's not critical
      console.warn('[EditorLockStorage] Failed to release editor lock:', response.statusText);
    }
  } catch (error: any) {
    // Don't throw on release failure - it's not critical
    console.warn('[EditorLockStorage] Failed to release editor lock:', error);
  }
}

/**
 * Update the heartbeat (lastActivity) for an editor lock
 * 
 * @param screenplayId - The screenplay ID
 */
export async function updateLockHeartbeat(screenplayId: string): Promise<void> {
  if (!isFeatureEnabled()) {
    return; // Feature disabled, nothing to update
  }

  try {
    const response = await fetchWithSessionId(`/api/screenplays/${screenplayId}/editor-lock/heartbeat`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Feature not enabled on backend, ignore
        return;
      }
      // Don't throw on heartbeat failure - it's not critical
      console.debug('[EditorLockStorage] Failed to update lock heartbeat:', response.statusText);
    }
  } catch (error: any) {
    // Don't throw on heartbeat failure - it's not critical
    console.debug('[EditorLockStorage] Failed to update lock heartbeat:', error);
  }
}
