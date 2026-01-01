/**
 * Thumbnail Regeneration Utility
 * 
 * Automatically regenerates thumbnails when they're missing or broken.
 * This utility can be used in image components to handle thumbnail failures gracefully.
 */

'use client';

import React from 'react';
import { useRegenerateThumbnail } from '@/hooks/useMediaLibrary';

/**
 * Hook to handle thumbnail regeneration on image error
 * 
 * Usage:
 * ```tsx
 * const { handleThumbnailError, isRegenerating } = useThumbnailRegeneration(s3Key, screenplayId, fileType);
 * 
 * <img
 *   src={thumbnailUrl}
 *   onError={() => handleThumbnailError(thumbnailUrl, () => {
 *     // Callback after regeneration (e.g., refresh image)
 *   })}
 * />
 * ```
 */
export function useThumbnailRegeneration(
  s3Key: string | null | undefined,
  screenplayId: string,
  fileType?: 'image' | 'video'
) {
  const regenerateThumbnail = useRegenerateThumbnail();
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [regenerationAttempts, setRegenerationAttempts] = React.useState(0);
  const MAX_ATTEMPTS = 1; // Only try once to avoid infinite loops

  const handleThumbnailError = React.useCallback(
    async (
      failedUrl: string,
      onSuccess?: () => void,
      onError?: (error: Error) => void
    ) => {
      // Only regenerate if we have an s3Key and haven't exceeded max attempts
      if (!s3Key || regenerationAttempts >= MAX_ATTEMPTS) {
        if (onError) {
          onError(new Error('Cannot regenerate thumbnail: missing s3Key or max attempts reached'));
        }
        return;
      }

      // Check if this is a thumbnail URL (contains 'thumbnails/')
      const isThumbnailUrl = failedUrl.includes('thumbnails/');
      if (!isThumbnailUrl) {
        // Not a thumbnail error, don't regenerate
        return;
      }

      setIsRegenerating(true);
      setRegenerationAttempts(prev => prev + 1);

      try {
        await regenerateThumbnail.mutateAsync({
          s3Key,
          screenplayId,
          fileType
        });

        // Wait a moment for the thumbnail to be available
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          setIsRegenerating(false);
        }, 1000);
      } catch (error: any) {
        console.error('[useThumbnailRegeneration] Failed to regenerate thumbnail:', error);
        setIsRegenerating(false);
        if (onError) {
          onError(error);
        }
      }
    },
    [s3Key, screenplayId, fileType, regenerateThumbnail, regenerationAttempts]
  );

  return {
    handleThumbnailError,
    isRegenerating: isRegenerating || regenerateThumbnail.isPending,
    canRegenerate: s3Key && regenerationAttempts < MAX_ATTEMPTS
  };
}

/**
 * Simple utility function to check if a thumbnail exists and regenerate if missing
 * This can be called proactively (e.g., on component mount) to ensure thumbnails exist
 */
export async function ensureThumbnailExists(
  s3Key: string,
  screenplayId: string,
  fileType?: 'image' | 'video',
  getToken?: () => Promise<string | null>
): Promise<boolean> {
  if (!getToken) {
    console.warn('[ensureThumbnailExists] getToken function required');
    return false;
  }

  try {
    const token = await getToken();
    if (!token) {
      console.warn('[ensureThumbnailExists] Not authenticated');
      return false;
    }

    const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    
    // Check if thumbnail exists by trying to generate a presigned URL
    const thumbnailS3Key = `thumbnails/${s3Key.replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm|mkv)$/i, '.jpg')}`;
    
    const checkResponse = await fetch(`${BACKEND_API_URL}/api/s3/bulk-download-urls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Keys: [thumbnailS3Key],
        expiresIn: 3600
      }),
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      if (checkData.urls && checkData.urls.length > 0 && checkData.urls[0].downloadUrl) {
        // Thumbnail exists
        return true;
      }
    }

    // Thumbnail doesn't exist, regenerate it
    const regenerateResponse = await fetch(`${BACKEND_API_URL}/api/media/regenerate-thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Key,
        screenplayId,
        fileType
      }),
    });

    if (regenerateResponse.ok) {
      console.log('[ensureThumbnailExists] ✅ Thumbnail regenerated:', thumbnailS3Key);
      return true;
    } else {
      const errorData = await regenerateResponse.json().catch(() => ({}));
      console.warn('[ensureThumbnailExists] ⚠️ Failed to regenerate thumbnail:', errorData);
      return false;
    }
  } catch (error: any) {
    console.error('[ensureThumbnailExists] ❌ Error:', error);
    return false;
  }
}

