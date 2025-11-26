/**
 * Cursor Position Storage Utility
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * API client for broadcasting and managing cursor positions during collaborative editing.
 * Uses the same authentication pattern as screenplayStorage.ts
 */

import { CursorPosition, UpdateCursorPositionRequest, CursorPositionResponse } from '@/types/collaboration';
import { useAuth } from '@clerk/nextjs';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * Broadcast cursor position to the server
 * 
 * @param screenplayId - Screenplay ID
 * @param position - Character offset in screenplay content
 * @param selectionStart - Optional selection start position
 * @param selectionEnd - Optional selection end position
 * @param getToken - Clerk getToken function for authentication
 */
export async function broadcastCursorPosition(
  screenplayId: string,
  position: number,
  selectionStart?: number,
  selectionEnd?: number,
  getToken?: ReturnType<typeof useAuth>['getToken']
): Promise<boolean> {
  if (!screenplayId || typeof position !== 'number' || position < 0) {
    console.warn('[cursorPositionStorage] Invalid parameters for broadcastCursorPosition');
    return false;
  }

  try {
    // Get authentication token
    let token: string | null = null;
    if (getToken) {
      token = await getToken({ template: 'wryda-backend' });
    }

    if (!token) {
      console.warn('[cursorPositionStorage] No authentication token available');
      return false;
    }

    // Prepare request body
    const body: UpdateCursorPositionRequest = {
      position,
      ...(selectionStart !== undefined && { selectionStart }),
      ...(selectionEnd !== undefined && { selectionEnd })
    };

    // POST cursor position to backend
    const response = await fetch(`${BACKEND_API_URL}/api/screenplays/${screenplayId}/cursor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[cursorPositionStorage] Failed to broadcast cursor position:', errorData);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[cursorPositionStorage] Error broadcasting cursor position:', error);
    return false;
  }
}

/**
 * Get all active cursor positions for a screenplay
 * 
 * @param screenplayId - Screenplay ID
 * @param getToken - Clerk getToken function for authentication
 * @returns Array of cursor positions (excluding current user's cursor)
 */
export async function getCursorPositions(
  screenplayId: string,
  getToken?: ReturnType<typeof useAuth>['getToken']
): Promise<CursorPosition[]> {
  if (!screenplayId) {
    return [];
  }

  try {
    // Get authentication token
    let token: string | null = null;
    if (getToken) {
      token = await getToken({ template: 'wryda-backend' });
    }

    if (!token) {
      console.warn('[cursorPositionStorage] No authentication token available');
      return [];
    }

    // GET cursor positions from backend
    const response = await fetch(`${BACKEND_API_URL}/api/screenplays/${screenplayId}/cursors`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[cursorPositionStorage] Failed to get cursor positions:', errorData);
      return [];
    }

    const data: { success: boolean; data: CursorPositionResponse } = await response.json();
    
    if (data.success && data.data.cursors) {
      return data.data.cursors;
    }

    return [];
  } catch (error: any) {
    console.error('[cursorPositionStorage] Error getting cursor positions:', error);
    return [];
  }
}

/**
 * Clear cursor position (when user disconnects or stops editing)
 * 
 * @param screenplayId - Screenplay ID
 * @param getToken - Clerk getToken function for authentication
 */
export async function clearCursorPosition(
  screenplayId: string,
  getToken?: ReturnType<typeof useAuth>['getToken']
): Promise<boolean> {
  if (!screenplayId) {
    return false;
  }

  try {
    // Get authentication token
    let token: string | null = null;
    if (getToken) {
      token = await getToken({ template: 'wryda-backend' });
    }

    if (!token) {
      console.warn('[cursorPositionStorage] No authentication token available');
      return false;
    }

    // DELETE cursor position from backend
    const response = await fetch(`${BACKEND_API_URL}/api/screenplays/${screenplayId}/cursor`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[cursorPositionStorage] Failed to clear cursor position:', errorData);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[cursorPositionStorage] Error clearing cursor position:', error);
    return false;
  }
}

