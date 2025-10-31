/**
 * S3 Utility Functions
 * Helper functions for extracting S3 keys from URLs
 */

/**
 * Extract S3 key from various URL formats
 * Handles presigned URLs, CloudFront URLs, and direct S3 URLs
 */
export function extractS3Key(url: string): string {
  if (!url) return '';
  
  try {
    // Pattern 1: Presigned URL - https://bucket.s3.region.amazonaws.com/key?params
    const presignedMatch = url.match(/amazonaws\.com\/([^?]+)/);
    if (presignedMatch) {
      return decodeURIComponent(presignedMatch[1]);
    }
    
    // Pattern 2: CloudFront URL - https://xxxxx.cloudfront.net/key?params
    const cloudFrontMatch = url.match(/cloudfront\.net\/([^?]+)/);
    if (cloudFrontMatch) {
      return decodeURIComponent(cloudFrontMatch[1]);
    }
    
    // Pattern 3: Direct S3 URL - https://s3.region.amazonaws.com/bucket/key
    const directMatch = url.match(/s3[.-][^.]+\.amazonaws\.com\/[^/]+\/(.+)/);
    if (directMatch) {
      return decodeURIComponent(directMatch[1]);
    }
    
    // Pattern 4: Path-style URL - https://bucket.s3.amazonaws.com/key
    const pathStyleMatch = url.match(/s3\.amazonaws\.com\/(.+)/);
    if (pathStyleMatch) {
      return decodeURIComponent(pathStyleMatch[1]);
    }
    
    console.warn('[S3Utils] Could not extract S3 key from URL:', url);
    return '';
  } catch (error) {
    console.error('[S3Utils] Error extracting S3 key:', error);
    return '';
  }
}

/**
 * Check if URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  if (!url) return false;
  return url.includes('amazonaws.com') || url.includes('cloudfront.net');
}

/**
 * Get file extension from S3 key or URL
 */
export function getFileExtension(urlOrKey: string): string {
  const match = urlOrKey.match(/\.([^.?]+)(\?|$)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Check if asset is a video
 */
export function isVideoAsset(urlOrKey: string): boolean {
  const ext = getFileExtension(urlOrKey);
  return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext);
}

/**
 * Check if asset is an image
 */
export function isImageAsset(urlOrKey: string): boolean {
  const ext = getFileExtension(urlOrKey);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

/**
 * Check if asset is audio
 */
export function isAudioAsset(urlOrKey: string): boolean {
  const ext = getFileExtension(urlOrKey);
  return ['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext);
}

