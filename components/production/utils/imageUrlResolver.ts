/**
 * Image URL Resolution Utility
 * 
 * Standardized utility for resolving image URLs from various sources.
 * Handles thumbnails, full images, and fallback chains consistently.
 */

/**
 * Resolves the best available image URL from multiple sources.
 * 
 * Priority order:
 * 1. Thumbnail URL (fastest, smallest)
 * 2. Full image URL from map (for selected/visible items)
 * 3. Fallback imageUrl (if it's a valid presigned URL)
 * 
 * @param options - Resolution options
 * @returns The best available image URL, or null if none available
 */
export function resolveImageUrl(options: {
  /** The S3 key of the original image */
  s3Key: string | null | undefined;
  /** Map of s3Key -> thumbnailS3Key */
  thumbnailS3KeyMap?: Map<string, string> | null;
  /** Map of thumbnailS3Key -> presigned URL */
  thumbnailUrlsMap?: Map<string, string> | null;
  /** Map of s3Key -> full image presigned URL */
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
  if (thumbnailS3KeyMap?.has(s3Key)) {
    const thumbnailS3Key = thumbnailS3KeyMap.get(s3Key);
    if (thumbnailS3Key && thumbnailUrlsMap?.has(thumbnailS3Key)) {
      const thumbnailUrl = thumbnailUrlsMap.get(thumbnailS3Key);
      if (thumbnailUrl && isValidImageUrl(thumbnailUrl)) {
        return thumbnailUrl;
      }
    }
  }

  // Priority 2: Try full image URL from map
  if (fullImageUrlsMap?.has(s3Key)) {
    const fullImageUrl = fullImageUrlsMap.get(s3Key);
    if (fullImageUrl && isValidImageUrl(fullImageUrl)) {
      return fullImageUrl;
    }
  }

  // Priority 3: Try fallback imageUrl (if it's a valid presigned URL)
  if (fallbackImageUrl && isValidImageUrl(fallbackImageUrl)) {
    return fallbackImageUrl;
  }

  // No valid URL found
  return null;
}

/**
 * Checks if a string is a valid image URL (presigned URL or data URL).
 * 
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Valid if it starts with http/https (presigned URL) or data: (data URL)
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
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
