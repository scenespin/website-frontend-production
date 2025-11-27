/**
 * Audit Log Storage Utility
 * Feature 0135: Screenplay Audit Log System
 * 
 * API client for querying screenplay change history
 */

import { useAuth } from '@clerk/nextjs';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export interface AuditLogFieldChange {
  field: string;
  old_value?: any;
  new_value?: any;
}

export interface AuditLogEntry {
  screenplay_id: string;
  change_id: string;
  edited_by: string;
  edited_at: string;
  change_type: 'content' | 'title' | 'author' | 'metadata' | 'collaborators' | 'delete' | 'status' | 'github_config' | 'relationships';
  field_changes: AuditLogFieldChange[];
  summary: string;
  ip_address?: string;
  user_agent?: string;
  version?: number;
  // Enriched fields (added by backend, similar to cursor positions)
  edited_by_email?: string;
  edited_by_name?: string;
}

export interface ChangeHistoryResponse {
  success: boolean;
  data: AuditLogEntry[];
  count: number;
}

/**
 * Get change history for a screenplay
 * 
 * @param screenplayId - Screenplay ID
 * @param limit - Maximum number of entries to return (default: 50)
 * @param fromDate - Optional start date (ISO string)
 * @param toDate - Optional end date (ISO string)
 * @param getToken - Clerk getToken function for authentication
 */
export async function getScreenplayChangeHistory(
  screenplayId: string,
  getToken: ReturnType<typeof useAuth>['getToken'],
  limit: number = 50,
  fromDate?: string,
  toDate?: string
): Promise<AuditLogEntry[]> {
  if (!screenplayId) {
    return [];
  }

  try {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.warn('[auditLogStorage] No authentication token available');
      return [];
    }

    // Build query string
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const response = await fetch(
      `${BACKEND_API_URL}/api/screenplays/${screenplayId}/change-history?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[auditLogStorage] Failed to get change history:', errorData);
      return [];
    }

    const data: ChangeHistoryResponse = await response.json();
    return data.success ? data.data : [];
  } catch (error: any) {
    console.error('[auditLogStorage] Error getting change history:', error);
    return [];
  }
}

/**
 * Get a specific audit log entry
 * 
 * @param screenplayId - Screenplay ID
 * @param changeId - Change ID
 * @param getToken - Clerk getToken function for authentication
 */
export async function getAuditLogEntry(
  screenplayId: string,
  changeId: string,
  getToken: ReturnType<typeof useAuth>['getToken']
): Promise<AuditLogEntry | null> {
  if (!screenplayId || !changeId) {
    return null;
  }

  try {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.warn('[auditLogStorage] No authentication token available');
      return null;
    }

    const response = await fetch(
      `${BACKEND_API_URL}/api/screenplays/${screenplayId}/change-history/${changeId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[auditLogStorage] Failed to get audit log entry:', errorData);
      return null;
    }

    const data: { success: boolean; data: AuditLogEntry } = await response.json();
    return data.success ? data.data : null;
  } catch (error: any) {
    console.error('[auditLogStorage] Error getting audit log entry:', error);
    return null;
  }
}

/**
 * Get change history for a specific user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of entries to return (default: 50)
 * @param fromDate - Optional start date (ISO string)
 * @param toDate - Optional end date (ISO string)
 * @param getToken - Clerk getToken function for authentication
 */
export async function getUserChangeHistory(
  userId: string,
  getToken: ReturnType<typeof useAuth>['getToken'],
  limit: number = 50,
  fromDate?: string,
  toDate?: string
): Promise<AuditLogEntry[]> {
  if (!userId) {
    return [];
  }

  try {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.warn('[auditLogStorage] No authentication token available');
      return [];
    }

    // Build query string
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);

    const response = await fetch(
      `${BACKEND_API_URL}/api/users/${userId}/change-history?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[auditLogStorage] Failed to get user change history:', errorData);
      return [];
    }

    const data: ChangeHistoryResponse = await response.json();
    return data.success ? data.data : [];
  } catch (error: any) {
    console.error('[auditLogStorage] Error getting user change history:', error);
    return [];
  }
}

