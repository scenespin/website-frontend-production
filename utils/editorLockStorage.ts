/**
 * Editor Lock Storage API Client
 * Feature 0187: Editor Lock for Multi-Device Conflict Prevention
 * 
 * Client-side functions for editor lock management
 */


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

/** Build headers for editor-lock requests. Sends X-Editor-Tab-Id (per-tab lock) when provided. */
function editorLockHeaders(holderId?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (holderId && holderId.trim()) {
    headers['X-Editor-Tab-Id'] = holderId.trim();
  }
  return headers;
}

/**
 * Get editor lock status for a screenplay
 * 
 * @param screenplayId - The screenplay ID
 * @param holderId - Tab ID (or session ID fallback) sent as X-Editor-Tab-Id for per-tab lock
 * @returns Lock status information
 */
export async function getEditorLock(screenplayId: string, holderId?: string): Promise<EditorLockStatus | null> {
  if (!isFeatureEnabled()) {
    return null; // Feature disabled, return null (no lock)
  }
  
  // Defensive check - don't make API calls if feature is disabled
  if (process.env.NEXT_PUBLIC_ENABLE_EDITOR_LOCK !== 'true') {
    return null;
  }

  try {
    const response = await fetch(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'GET',
      headers: editorLockHeaders(holderId),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Feature not enabled on backend
        return null;
      }
      if (response.status === 503) {
        // Feature not configured (table doesn't exist) - graceful degradation
        console.warn('[EditorLockStorage] Editor lock feature not configured on backend');
        return null;
      }
      throw new Error(`Failed to get editor lock: ${response.statusText}`);
    }

    const data = await response.json();
    if (typeof window !== 'undefined') {
      console.debug('[EditorLockStorage] GET editor-lock', {
        holderIdSent: !!(holderId && holderId.trim()),
        isLocked: data?.isLocked,
        hasLock: !!data?.lock,
      });
    }
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
 * @param holderId - Tab ID sent as X-Editor-Tab-Id for per-tab lock
 * @returns Lock information
 * @throws Error if lock exists for same user on different tab (409 Conflict)
 */
export async function acquireEditorLock(screenplayId: string, holderId?: string): Promise<EditorLock> {
  if (!isFeatureEnabled()) {
    throw new Error('Editor lock feature is not enabled');
  }

  try {
    const response = await fetch(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'POST',
      headers: editorLockHeaders(holderId),
    });

    if (!response.ok) {
      if (response.status === 409) {
        const error = await response.json();
        throw new Error(error.error || 'Editor is locked by another session');
      }
      if (response.status === 404) {
        throw new Error('Editor lock feature is not enabled');
      }
      if (response.status === 503) {
        // Feature not configured (table doesn't exist) - graceful degradation
        console.warn('[EditorLockStorage] Editor lock feature not configured on backend');
        throw new Error('Editor lock feature is not configured');
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
 * @param holderId - Tab ID sent as X-Editor-Tab-Id
 */
export async function releaseEditorLock(screenplayId: string, holderId?: string): Promise<void> {
  if (!isFeatureEnabled()) {
    return; // Feature disabled, nothing to release
  }

  try {
    const response = await fetch(`/api/screenplays/${screenplayId}/editor-lock`, {
      method: 'DELETE',
      headers: editorLockHeaders(holderId),
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
 * @param holderId - Tab ID sent as X-Editor-Tab-Id
 */
export async function updateLockHeartbeat(screenplayId: string, holderId?: string): Promise<void> {
  if (!isFeatureEnabled()) {
    return; // Feature disabled, nothing to update
  }

  try {
    const response = await fetch(`/api/screenplays/${screenplayId}/editor-lock/heartbeat`, {
      method: 'PUT',
      headers: editorLockHeaders(holderId),
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
