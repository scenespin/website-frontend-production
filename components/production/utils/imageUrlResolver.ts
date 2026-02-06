/**
 * Image URL Resolution Utility
 *
 * Standardized utility for resolving image URLs from various sources.
 * Handles thumbnails, full images, fallback chains, and cloud storage (Drive/Dropbox).
 */

import type { MediaFile } from '@/types/media';

/**
 * Resolves the best available image URL from multiple sources.
 * 
 * Priority order:
 * 1. Thumbnail URL (fastest, smallest) - uses proxy URL if thumbnailS3Key available
 * 2. Full image URL from map (for selected/visible items) - uses proxy URL if available
 * 3. Fallback to proxy URL for original s3Key
 * 4. Fallback imageUrl (if it's a valid URL)
 * 
 * Feature 0243: Updated to return proxy URLs for S3 keys (stable, cacheable).
 * 
 * @param options - Resolution options
 * @returns The best available image URL, or null if none available
 */
export function resolveImageUrl(options: {
  /** The S3 key of the original image */
  s3Key: string | null | undefined;
  /** Map of s3Key -> thumbnailS3Key */
  thumbnailS3KeyMap?: Map<string, string> | null;
  /** Map of thumbnailS3Key -> URL (proxy URL or presigned URL) */
  thumbnailUrlsMap?: Map<string, string> | null;
  /** Map of s3Key -> full image URL (proxy URL or presigned URL) */
  fullImageUrlsMap?: Map<string, string> | null;
  /** Fallback imageUrl (should be presigned URL, but will be validated) */
  fallbackImageUrl?: string | null;
}): string | null {
  const {
    s3Key,
    thumbnailS3KeyMap,
    thumbnailUrlsMap,
    fullImageUrlsMap,
    fallbackImageUrl
  } = options;

  // If no s3Key, we can't resolve anything
  if (!s3Key) {
    // Try fallback if it's a valid URL
    if (fallbackImageUrl && isValidImageUrl(fallbackImageUrl)) {
      return fallbackImageUrl;
    }
    return null;
  }

  // Priority 1: Try thumbnail URL (fastest)
  // Feature 0243: Prefer proxy URL from map, or generate proxy URL from thumbnailS3Key
  if (thumbnailS3KeyMap?.has(s3Key)) {
    const thumbnailS3Key = thumbnailS3KeyMap.get(s3Key);
    if (thumbnailS3Key) {
      // Check if map has a URL (could be proxy URL or presigned URL)
      if (thumbnailUrlsMap?.has(thumbnailS3Key)) {
        const thumbnailUrl = thumbnailUrlsMap.get(thumbnailS3Key);
        if (thumbnailUrl && isValidImageUrl(thumbnailUrl)) {
          return thumbnailUrl;
        }
      }
      // If no URL in map, generate proxy URL from thumbnailS3Key
      return `/api/media/file?key=${encodeURIComponent(thumbnailS3Key)}`;
    }
  }

  // Priority 2: Try full image URL from map
  // Feature 0243: Prefer proxy URL from map, or generate proxy URL from s3Key
  if (fullImageUrlsMap?.has(s3Key)) {
    const fullImageUrl = fullImageUrlsMap.get(s3Key);
    if (fullImageUrl && isValidImageUrl(fullImageUrl)) {
      return fullImageUrl;
    }
  }

  // Priority 3: Generate proxy URL for original s3Key
  // Feature 0243: Always return proxy URL when s3Key is available
  return `/api/media/file?key=${encodeURIComponent(s3Key)}`;
}

/**
 * Checks if a string is a valid image URL (presigned URL, proxy URL, or data URL).
 * 
 * Feature 0243: Updated to accept proxy URLs (relative paths starting with /).
 * 
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Valid if it starts with:
  // - http/https (presigned URL)
  // - / (proxy URL or relative path)
  // - data: (data URL)
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/') ||
         url.startsWith('data:');
}

/**
 * Resolves image URL for character headshots.
 * 
 * @param headshot - Character headshot object
 * @param maps - URL maps for resolution
 * @returns The best available image URL, or null if none available
 */
export function resolveCharacterHeadshotUrl(
  headshot: {
    s3Key: string;
    imageUrl?: string | null;
  },
  maps: {
    thumbnailS3KeyMap?: Map<string, string> | null;
    thumbnailUrlsMap?: Map<string, string> | null;
    fullImageUrlsMap?: Map<string, string> | null;
  }
): string | null {
  return resolveImageUrl({
    s3Key: headshot.s3Key,
    thumbnailS3KeyMap: maps.thumbnailS3KeyMap,
    thumbnailUrlsMap: maps.thumbnailUrlsMap,
    fullImageUrlsMap: maps.fullImageUrlsMap,
    fallbackImageUrl: headshot.imageUrl
  });
}

/**
 * Resolves image URL for location references.
 * 
 * @param locationRef - Location reference object
 * @param maps - URL maps for resolution
 * @returns The best available image URL, or null if none available
 */
export function resolveLocationImageUrl(
  locationRef: {
    s3Key?: string | null;
    imageUrl?: string | null;
  },
  maps: {
    thumbnailS3KeyMap?: Map<string, string> | null;
    thumbnailUrlsMap?: Map<string, string> | null;
    fullImageUrlsMap?: Map<string, string> | null;
  }
): string | null {
  return resolveImageUrl({
    s3Key: locationRef.s3Key || null,
    thumbnailS3KeyMap: maps.thumbnailS3KeyMap,
    thumbnailUrlsMap: maps.thumbnailUrlsMap,
    fullImageUrlsMap: maps.fullImageUrlsMap,
    fallbackImageUrl: locationRef.imageUrl
  });
}

/**
 * Resolves image URL for prop images.
 * 
 * @param propImage - Prop image object
 * @param maps - URL maps for resolution
 * @returns The best available image URL, or null if none available
 */
export function resolvePropImageUrl(
  propImage: {
    s3Key?: string | null;
    imageUrl?: string | null;
  },
  maps: {
    thumbnailS3KeyMap?: Map<string, string> | null;
    thumbnailUrlsMap?: Map<string, string> | null;
    fullImageUrlsMap?: Map<string, string> | null;
  }
): string | null {
  return resolveImageUrl({
    s3Key: propImage.s3Key || null,
    thumbnailS3KeyMap: maps.thumbnailS3KeyMap,
    thumbnailUrlsMap: maps.thumbnailUrlsMap,
    fullImageUrlsMap: maps.fullImageUrlsMap,
    fallbackImageUrl: propImage.imageUrl
  });
}

/** Presigned/S3 URL maps used by getMediaFileDisplayUrl */
export interface MediaFilePresignedMaps {
  thumbnailS3KeyMap?: Map<string, string> | null;
  thumbnailUrlsMap?: Map<string, string> | null;
  fullImageUrlsMap?: Map<string, string> | null;
}

/**
 * Resolves display URL for a MediaFile by storage type.
 * Use for local/wryda-temp (S3), google-drive, and dropbox (with dropboxUrlMap).
 * Call from components that display media; pair with useDropboxPreviewUrls for Dropbox.
 * 
 * Feature 0243: Phase 1 - Returns proxy URL for S3 and Dropbox (stable, cacheable).
 * Presigned maps and dropboxUrlMap are ignored for local/dropbox when proxy is used.
 */
export function getMediaFileDisplayUrl(
  file: MediaFile,
  presignedMaps?: MediaFilePresignedMaps | null,
  dropboxUrlMap?: Map<string, string> | null
): string | null {
  const st = file.storageType || 'local';
  if (st === 'google-drive') {
    const cloudFileId = file.metadata?.cloudFileId ?? file.id;
    if (!cloudFileId) return null;
    return `https://drive.google.com/uc?export=view&id=${cloudFileId}`;
  }
  if (st === 'dropbox') {
    // Feature 0243: Use proxy URL for Dropbox (stable, cacheable)
    const dropboxPath = getDropboxPath(file);
    if (!dropboxPath) return null;
    return `/api/media/file?provider=dropbox&path=${encodeURIComponent(dropboxPath)}`;
  }
  if (st === 'local' || st === 'wryda-temp') {
    // Feature 0243: Use proxy URL for S3 (stable, cacheable)
    if (!file.s3Key) return null;
    return `/api/media/file?key=${encodeURIComponent(file.s3Key)}`;
  }
  return null;
}

/** Get Dropbox path for a file (for preview-url API). */
export function getDropboxPath(file: MediaFile): string {
  return file.metadata?.cloudFilePath ?? (file as { path?: string }).path ?? file.id;
}
