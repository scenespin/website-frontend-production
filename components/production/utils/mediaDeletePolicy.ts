'use client';

export type MediaDeletePolicyResult =
  | { kind: 'confirmed' }
  | { kind: 'blocked'; message: string; status?: number }
  | { kind: 'transient'; message: string; status?: number };

function getErrorMessage(payload: any, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim().length > 0) return payload.message;
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) return payload.error;
  }
  return fallback;
}

/**
 * Status-aware policy for delete-by-s3-key:
 * - 401/403 and other 4xx: block local optimistic mutation
 * - 5xx/network/404: allow optimistic mutation with warning (eventual consistency safe path)
 * - 2xx: confirmed delete
 */
export async function deleteMediaByS3KeyWithPolicy(params: {
  token: string | null;
  s3Key: string;
  screenplayId?: string;
  backendApiUrl?: string;
}): Promise<MediaDeletePolicyResult> {
  const { token, s3Key, screenplayId, backendApiUrl } = params;
  const BACKEND_API_URL = backendApiUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

  if (!token) {
    return { kind: 'blocked', message: 'Please sign in to delete media.', status: 401 };
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/media/delete-by-s3-key`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Key,
        ...(screenplayId ? { screenplayId } : {}),
      }),
    });

    if (response.ok) return { kind: 'confirmed' };

    const payload = await response.json().catch(() => ({}));
    const status = response.status;
    const message = getErrorMessage(payload, response.statusText || 'Delete failed');

    if (status === 401 || status === 403) {
      return { kind: 'blocked', message, status };
    }

    if (status === 404) {
      return {
        kind: 'transient',
        message: 'Media was already removed. Syncing UI state now.',
        status,
      };
    }

    if (status >= 500) {
      return {
        kind: 'transient',
        message: 'Delete could not be confirmed due to a temporary server issue. Syncing UI state now.',
        status,
      };
    }

    return { kind: 'blocked', message, status };
  } catch {
    return {
      kind: 'transient',
      message: 'Delete could not be confirmed due to a temporary network issue. Syncing UI state now.',
    };
  }
}
