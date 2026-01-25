/**
 * Video Prefetching Utility
 * 
 * Converts presigned URLs to Blob URLs to avoid CORS and format detection issues.
 * This is a best practice for reliable video playback with presigned URLs.
 */

interface PrefetchOptions {
  onProgress?: (progress: number) => void;
  timeout?: number;
}

/**
 * Prefetch a video from a URL and convert it to a Blob URL
 * This eliminates CORS issues and improves format detection
 */
export async function prefetchVideo(
  url: string,
  options: PrefetchOptions = {}
): Promise<string> {
  const { onProgress, timeout = 30000 } = options;

  try {
    // Check if URL is already a blob URL
    if (url.startsWith('blob:')) {
      return url;
    }

    // Fetch the video
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors', // Explicitly request CORS
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    // Check Content-Type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('video/')) {
      console.warn('[prefetchVideo] Unexpected Content-Type:', contentType);
    }

    // Get content length for progress tracking
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // Read the response as a blob
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      received += value.length;

      // Report progress if callback provided
      if (onProgress && total > 0) {
        onProgress(received / total);
      }
    }

    // Create blob from chunks
    const blob = new Blob(chunks, { type: contentType || 'video/mp4' });
    
    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    return blobUrl;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Video prefetch timeout');
    }
    throw error;
  }
}

/**
 * Check if browser supports the video format
 */
export function canPlayVideoFormat(url: string): { supported: boolean; format: string } {
  const video = document.createElement('video');
  
  // Detect format from URL
  const urlLower = url.toLowerCase();
  let format = 'unknown';
  let mimeType = '';

  if (urlLower.includes('.mp4') || urlLower.includes('video/mp4')) {
    format = 'mp4';
    mimeType = 'video/mp4; codecs="avc1.42E01E"'; // H.264 baseline
  } else if (urlLower.includes('.webm') || urlLower.includes('video/webm')) {
    format = 'webm';
    mimeType = 'video/webm; codecs="vp8, vorbis"';
  } else if (urlLower.includes('.mov') || urlLower.includes('video/quicktime')) {
    format = 'mov';
    mimeType = 'video/quicktime';
  } else if (urlLower.includes('.mkv')) {
    format = 'mkv';
    mimeType = 'video/x-matroska';
  }

  // Check if browser can play this format
  const canPlay = mimeType ? video.canPlayType(mimeType) : 'maybe';
  const supported = canPlay === 'probably' || canPlay === 'maybe';

  return { supported, format };
}

/**
 * Cleanup blob URL to free memory
 */
export function revokeBlobUrl(blobUrl: string): void {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl);
  }
}
